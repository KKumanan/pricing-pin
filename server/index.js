const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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
      stats TEXT
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
app.get('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'SELECT * FROM csv_sessions WHERE id = ?';
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ error: 'Failed to fetch session' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Parse data and stats JSON
    const session = {
      ...row,
      data: JSON.parse(row.data),
      stats: row.stats ? JSON.parse(row.stats) : null
    };
    
    res.json(session);
  });
});

// Save a new CSV session
app.post('/api/sessions', (req, res) => {
  const { name, description, data, stats } = req.body;
  
  if (!name || !data) {
    return res.status(400).json({ error: 'Name and data are required' });
  }
  
  const query = `
    INSERT INTO csv_sessions (name, description, data, stats, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  const dataJson = JSON.stringify(data);
  const statsJson = stats ? JSON.stringify(stats) : null;
  
  db.run(query, [name, description, dataJson, statsJson], function(err) {
    if (err) {
      console.error('Error saving session:', err);
      return res.status(500).json({ error: 'Failed to save session' });
    }
    
    res.json({
      id: this.lastID,
      message: 'Session saved successfully'
    });
  });
});

// Update an existing CSV session
app.put('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, data, stats } = req.body;
  
  if (!name || !data) {
    return res.status(400).json({ error: 'Name and data are required' });
  }
  
  const query = `
    UPDATE csv_sessions 
    SET name = ?, description = ?, data = ?, stats = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  const dataJson = JSON.stringify(data);
  const statsJson = stats ? JSON.stringify(stats) : null;
  
  db.run(query, [name, description, dataJson, statsJson, id], function(err) {
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
});

// Delete a CSV session
app.delete('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  
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