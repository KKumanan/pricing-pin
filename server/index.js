const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Backblaze B2 SDK setup
const B2 = require('backblaze-b2');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // Load .env from parent directory

// Backblaze B2 credentials (use environment variables for security)
const B2_KEY_ID = process.env.B2_KEY_ID || '0050f4552dcab570000000001';
const B2_APP_KEY = process.env.B2_APP_KEY || 'K005jwgio1jqZwiOMF2yPQvtEYYPnWk';
const B2_BUCKET_ID = process.env.B2_BUCKET_ID || '';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || '';

console.log('Environment variables loaded:');
console.log('B2_KEY_ID:', B2_KEY_ID ? 'Set' : 'Not set');
console.log('B2_APP_KEY:', B2_APP_KEY ? 'Set' : 'Not set');
console.log('B2_BUCKET_ID:', B2_BUCKET_ID ? 'Set' : 'Not set');
console.log('B2_BUCKET_NAME:', B2_BUCKET_NAME ? 'Set' : 'Not set');

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

// In-memory storage for session metadata (in production, you'd use a proper database)
let sessions = [];
let nextSessionId = 1;

// API Routes

// Get all CSV sessions
app.get('/api/sessions', (req, res) => {
  try {
    const sessionsList = sessions.map(session => ({
      id: session.id,
      name: session.name,
      description: session.description,
      created_at: session.created_at,
      updated_at: session.updated_at,
      stats: session.stats
    }));
    
    res.json(sessionsList);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get a specific CSV session by ID
app.get('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if B2 is properly configured
    if (!B2_BUCKET_ID) {
      return res.status(500).json({ 
        error: 'Backblaze B2 not configured. Please set B2_BUCKET_ID environment variable.' 
      });
    }

    const session = sessions.find(s => s.id == id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Download session data from B2
    await b2.authorize();
    const fileResponse = await b2.downloadFileByName({
      bucketName: B2_BUCKET_NAME,
      fileName: session.b2_file_name,
      responseType: 'text',
    });
    
    const sessionData = JSON.parse(fileResponse.data);
    
    const fullSession = {
      ...session,
      data: sessionData,
      starredPropertyId: session.starredPropertyId
    };
    
    console.log('Returning session with starredPropertyId:', session.starredPropertyId);
    res.json(fullSession);
  } catch (err) {
    console.error('Error loading session data:', err);
    return res.status(500).json({ error: 'Failed to load session data', details: err && err.message ? err.message : err });
  }
});

// Save a new CSV session
app.post('/api/sessions', async (req, res) => {
  const { name, description, data, stats, starredPropertyId } = req.body;

  console.log('Received session data:', { name, description, starredPropertyId });

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

    // 5. Store metadata in memory
    const session = {
      id: nextSessionId++,
      name,
      description,
      stats,
      starredPropertyId,
      b2_file_name: fileName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    sessions.push(session);
    
    console.log('Saving session with starredPropertyId:', starredPropertyId);
    console.log('Session metadata:', session);
    
    res.json({
      id: session.id,
      message: 'Session saved successfully',
      b2_file_name: fileName
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

  console.log('Updating session data:', { id, name, description, starredPropertyId });

  if (!name || !data) {
    return res.status(400).json({ error: 'Name and data are required' });
  }

  // Check if B2 is properly configured
  if (!B2_BUCKET_ID) {
    return res.status(500).json({ 
      error: 'Backblaze B2 not configured. Please set B2_BUCKET_ID environment variable.' 
    });
  }

  const sessionIndex = sessions.findIndex(s => s.id == id);
  if (sessionIndex === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const session = sessions[sessionIndex];
  
  try {
    // Update file in B2
    await b2.authorize();
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId: B2_BUCKET_ID });
    const uploadUrl = uploadUrlResponse.data.uploadUrl;
    const uploadAuthToken = uploadUrlResponse.data.authorizationToken;
    const fileData = Buffer.from(JSON.stringify(data), 'utf8');
    
    await b2.uploadFile({
      uploadUrl,
      uploadAuthToken,
      fileName: session.b2_file_name,
      data: fileData,
      mime: 'application/json'
    });

    // Update metadata in memory
    sessions[sessionIndex] = {
      ...session,
      name,
      description,
      stats,
      starredPropertyId,
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating session with starredPropertyId:', starredPropertyId);
    console.log('Updated session metadata:', sessions[sessionIndex]);
    
    res.json({
      message: 'Session updated successfully'
    });
  } catch (err) {
    console.error('Error updating session or B2 file:', err);
    return res.status(500).json({ error: 'Failed to update session or B2 file', details: err && err.message ? err.message : err });
  }
});

// Delete a CSV session
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;

  const sessionIndex = sessions.findIndex(s => s.id == id);
  if (sessionIndex === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const session = sessions[sessionIndex];

  try {
    if (session.b2_file_name) {
      await b2.authorize();
      // Find fileId for the file to delete
      const fileVersions = await b2.listFileVersions({
        bucketId: B2_BUCKET_ID,
        startFileName: session.b2_file_name,
        maxFileCount: 1
      });
      const file = fileVersions.data.files.find(f => f.fileName === session.b2_file_name);
      if (file) {
        await b2.deleteFileVersion({
          fileId: file.fileId,
          fileName: session.b2_file_name
        });
      }
    }
    
    // Remove from memory
    sessions.splice(sessionIndex, 1);
    
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting session:', err);
    return res.status(500).json({ error: 'Failed to delete session', details: err && err.message ? err.message : err });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`B2 Bucket ID: ${B2_BUCKET_ID ? 'Configured' : 'Not configured'}`);
  console.log(`B2 Bucket Name: ${B2_BUCKET_NAME ? 'Configured' : 'Not configured'}`);
}); 