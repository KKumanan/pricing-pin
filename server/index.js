const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Backblaze B2 SDK setup
const B2 = require('backblaze-b2');
require('dotenv').config(); // For environment variable support

// Backblaze B2 credentials (use environment variables for security)
const B2_KEY_ID = process.env.B2_KEY_ID || '0050f4552dcab570000000001';
const B2_APP_KEY = process.env.B2_APP_KEY || 'K005jwgio1jqZwiOMF2yPQvtEYYPnWk';
const B2_BUCKET_ID = process.env.B2_BUCKET_ID || '901fb475a5923d0c9a8b0517';

const b2 = new B2({
  applicationKeyId: B2_KEY_ID,
  applicationKey: B2_APP_KEY,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Create CSV sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS csv_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      data TEXT NOT NULL,
      stats TEXT,
      starred_property_id TEXT,
      b2_file_name TEXT -- New column for B2 file reference
    )
  `);

  // Create indexes for better performance
  db.run('CREATE INDEX IF NOT EXISTS idx_created_at ON csv_sessions(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_name ON csv_sessions(name)');
});

// API Routes

// Get all CSV sessions
app.get('/api/sessions', (req, res) => {
  const query = `
    SELECT id, name, description, created_at, updated_at, stats
    FROM csv_sessions 
    ORDER BY updated_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching sessions:', err);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
    
    // Parse stats JSON for each session
    const sessions = rows.map(row => ({
      ...row,
      stats: row.stats ? JSON.parse(row.stats) : null
    }));
    
    res.json(sessions);
  });
});

// Get a specific CSV session by ID
app.get('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM csv_sessions WHERE id = ?';

  db.get(query, [id], async (err, row) => {
    if (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ error: 'Failed to fetch session' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Session not found' });
    }

    try {
      let sessionData;
      // Check if B2 is configured
      if (!B2_BUCKET_ID) {
        return res.status(500).json({ 
          error: 'Backblaze B2 not configured. Please set B2_BUCKET_ID environment variable.' 
        });
      }

      // If b2_file_name exists, fetch from B2
      if (row.b2_file_name) {
        try {
          await b2.authorize();
          // Download file by name
          const fileResponse = await b2.downloadFileByName({
            bucketName: process.env.B2_BUCKET_NAME, // You need to set this in your .env
            fileName: row.b2_file_name,
            responseType: 'text',
          });
          sessionData = JSON.parse(fileResponse.data);
        } catch (b2Error) {
          console.error('Failed to fetch from B2:', b2Error.message);
          return res.status(500).json({ 
            error: 'Failed to load session from Backblaze B2', 
            details: b2Error.message 
          });
        }
      } else {
        return res.status(500).json({ 
          error: 'Session data not found in Backblaze B2' 
        });
      }
      
      const session = {
        ...row,
        data: sessionData,
        stats: row.stats ? JSON.parse(row.stats) : null,
        starredPropertyId: row.starred_property_id
      };
      res.json(session);
    } catch (err) {
      console.error('Error loading session data:', err);
      return res.status(500).json({ error: 'Failed to load session data', details: err && err.message ? err.message : err });
    }
  });
});

// Save a new CSV session
app.post('/api/sessions', async (req, res) => {
  const { name, description, data, stats, starredPropertyId } = req.body;

  if (!name || !data) {
    return res.status(400).json({ error: 'Name and data are required' });
  }

  // Check if B2 is properly configured
  if (!B2_BUCKET_ID) {
    return res.status(500).json({ 
      error: 'Backblaze B2 not configured. Please set B2_BUCKET_ID environment variable.' 
    });
  }

  try {
    // 1. Authorize with B2
    await b2.authorize();

    // 2. Get upload URL
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId: B2_BUCKET_ID });
    const uploadUrl = uploadUrlResponse.data.uploadUrl;
    const uploadAuthToken = uploadUrlResponse.data.authorizationToken;

    // 3. Prepare file data and name
    const fileName = `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.json`;
    const fileData = Buffer.from(JSON.stringify(data), 'utf8');

    // 4. Upload file to B2
    await b2.uploadFile({
      uploadUrl,
      uploadAuthToken,
      fileName,
      data: fileData,
      mime: 'application/json'
    });

    // 5. Store metadata in SQLite (leave data column empty or '{}')
    const query = `
      INSERT INTO csv_sessions (name, description, data, stats, starred_property_id, b2_file_name, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    const statsJson = stats ? JSON.stringify(stats) : null;
    db.run(query, [name, description, '{}', statsJson, starredPropertyId || null, fileName], function(err) {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      res.json({
        id: this.lastID,
        message: 'Session saved successfully',
        b2_file_name: fileName
      });
    });
  } catch (err) {
    console.error('Error uploading to B2 or saving session:', err);
    return res.status(500).json({ error: 'Failed to save session to B2', details: err && err.message ? err.message : err });
  }
});

// Update an existing CSV session
app.put('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, data, stats, starredPropertyId } = req.body;

  if (!name || !data) {
    return res.status(400).json({ error: 'Name and data are required' });
  }

  // Check if B2 is properly configured
  if (!B2_BUCKET_ID) {
    return res.status(500).json({ 
      error: 'Backblaze B2 not configured. Please set B2_BUCKET_ID environment variable.' 
    });
  }

  const selectQuery = 'SELECT * FROM csv_sessions WHERE id = ?';
  db.get(selectQuery, [id], async (err, row) => {
    if (err) {
      console.error('Error fetching session for update:', err);
      return res.status(500).json({ error: 'Failed to fetch session for update' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    try {
      let b2FileName = row.b2_file_name;
      if (b2FileName) {
        await b2.authorize();
        // Overwrite the file in B2
        const uploadUrlResponse = await b2.getUploadUrl({ bucketId: B2_BUCKET_ID });
        const uploadUrl = uploadUrlResponse.data.uploadUrl;
        const uploadAuthToken = uploadUrlResponse.data.authorizationToken;
        const fileData = Buffer.from(JSON.stringify(data), 'utf8');
        await b2.uploadFile({
          uploadUrl,
          uploadAuthToken,
          fileName: b2FileName,
          data: fileData,
          mime: 'application/json'
        });
      }
      // Update metadata in SQLite
      const query = `
        UPDATE csv_sessions 
        SET name = ?, description = ?, data = ?, stats = ?, starred_property_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      const dataJson = b2FileName ? '{}' : JSON.stringify(data);
      const statsJson = stats ? JSON.stringify(stats) : null;
      db.run(query, [name, description, dataJson, statsJson, starredPropertyId || null, id], function(err) {
        if (err) {
          console.error('Error updating session:', err);
          return res.status(500).json({ error: 'Failed to update session' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Session not found' });
        }
        res.json({
          message: 'Session updated successfully'
        });
      });
    } catch (err) {
      console.error('Error updating session or B2 file:', err);
      return res.status(500).json({ error: 'Failed to update session or B2 file', details: err && err.message ? err.message : err });
    }
  });
});

// Delete a CSV session
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;

  const selectQuery = 'SELECT * FROM csv_sessions WHERE id = ?';
  db.get(selectQuery, [id], async (err, row) => {
    if (err) {
      console.error('Error fetching session for delete:', err);
      return res.status(500).json({ error: 'Failed to fetch session for delete' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Session not found' });
    }
    try {
      if (row.b2_file_name) {
        await b2.authorize();
        // Find fileId for the file to delete
        const fileVersions = await b2.listFileVersions({
          bucketId: B2_BUCKET_ID,
          startFileName: row.b2_file_name,
          maxFileCount: 1
        });
        const file = fileVersions.data.files.find(f => f.fileName === row.b2_file_name);
        if (file) {
          await b2.deleteFileVersion({
            fileId: file.fileId,
            fileName: row.b2_file_name
          });
        }
      }
      // Delete metadata from SQLite
      const query = 'DELETE FROM csv_sessions WHERE id = ?';
      db.run(query, [id], function(err) {
        if (err) {
          console.error('Error deleting session:', err);
          return res.status(500).json({ error: 'Failed to delete session' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Session not found' });
        }
        res.json({
          message: 'Session deleted successfully'
        });
      });
    } catch (err) {
      console.error('Error deleting session or B2 file:', err);
      return res.status(500).json({ error: 'Failed to delete session or B2 file', details: err && err.message ? err.message : err });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database file: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
}); 