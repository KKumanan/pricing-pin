const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Backblaze B2 SDK setup
const B2 = require('backblaze-b2');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production (same domain)
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// B2 Database Architecture
class B2Database {
  constructor() {
    this.b2 = b2;
    this.bucketId = B2_BUCKET_ID;
    this.bucketName = B2_BUCKET_NAME;
    this.sessionsIndexFile = 'sessions-index.json';
    this.isAuthorized = false;
  }

  async authorize() {
    if (!this.isAuthorized) {
      await this.b2.authorize();
      this.isAuthorized = true;
    }
  }

  // Initialize the database by creating the sessions index if it doesn't exist
  async initialize() {
    try {
      await this.authorize();
      
      // Check if sessions index exists
      try {
        await this.b2.downloadFileByName({
          bucketName: this.bucketName,
          fileName: this.sessionsIndexFile,
          responseType: 'text'
        });
      } catch (error) {
        // Sessions index doesn't exist, create it
        console.log('Creating sessions index file...');
        await this.createSessionsIndex();
      }
      
      console.log('B2 Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize B2 Database:', error);
      throw error;
    }
  }

  // Create the sessions index file
  async createSessionsIndex() {
    const sessionsIndex = {
      sessions: [],
      nextId: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this.uploadFile(this.sessionsIndexFile, sessionsIndex);
  }

  // Upload a file to B2
  async uploadFile(fileName, data) {
    await this.authorize();
    
    const uploadUrlResponse = await this.b2.getUploadUrl({ bucketId: this.bucketId });
    const uploadUrl = uploadUrlResponse.data.uploadUrl;
    const uploadAuthToken = uploadUrlResponse.data.authorizationToken;
    
    const fileData = Buffer.from(JSON.stringify(data), 'utf8');
    
    await this.b2.uploadFile({
      uploadUrl,
      uploadAuthToken,
      fileName,
      data: fileData,
      mime: 'application/json'
    });
  }

  // Download a file from B2
  async downloadFile(fileName) {
    await this.authorize();
    
    const response = await this.b2.downloadFileByName({
      bucketName: this.bucketName,
      fileName,
      responseType: 'text'
    });
    
    return JSON.parse(response.data);
  }

  // Get sessions index
  async getSessionsIndex() {
    try {
      return await this.downloadFile(this.sessionsIndexFile);
    } catch (error) {
      console.error('Error getting sessions index:', error);
      return { sessions: [], nextId: 1 };
    }
  }

  // Update sessions index
  async updateSessionsIndex(sessionsIndex) {
    sessionsIndex.updated_at = new Date().toISOString();
    await this.uploadFile(this.sessionsIndexFile, sessionsIndex);
  }

  // Get all sessions
  async getAllSessions() {
    const sessionsIndex = await this.getSessionsIndex();
    return sessionsIndex.sessions.map(session => ({
      id: session.id,
      name: session.name,
      description: session.description,
      created_at: session.created_at,
      updated_at: session.updated_at,
      stats: session.stats,
      starredPropertyId: session.starredPropertyId
    }));
  }

  // Get a specific session
  async getSession(id) {
    const sessionsIndex = await this.getSessionsIndex();
    const session = sessionsIndex.sessions.find(s => s.id == id);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Download session data
    const sessionData = await this.downloadFile(session.dataFileName);
    
    return {
      ...session,
      data: sessionData
    };
  }

  // Create a new session
  async createSession(sessionData) {
    const { name, description, data, stats, starredPropertyId } = sessionData;
    
    if (!name || !data) {
      throw new Error('Name and data are required');
    }

    const sessionsIndex = await this.getSessionsIndex();
    
    // Generate unique file name for session data
    const dataFileName = `session-data-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.json`;
    
    // Upload session data
    await this.uploadFile(dataFileName, data);
    
    // Create session metadata
    const newSession = {
      id: sessionsIndex.nextId++,
      name,
      description: description || '',
      dataFileName,
      stats,
      starredPropertyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to sessions index
    sessionsIndex.sessions.push(newSession);
    await this.updateSessionsIndex(sessionsIndex);
    
    return {
      id: newSession.id,
      message: 'Session saved successfully',
      dataFileName
    };
  }

  // Update an existing session
  async updateSession(id, sessionData) {
    const { name, description, data, stats, starredPropertyId } = sessionData;
    
    if (!name || !data) {
      throw new Error('Name and data are required');
    }

    const sessionsIndex = await this.getSessionsIndex();
    const sessionIndex = sessionsIndex.sessions.findIndex(s => s.id == id);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    const session = sessionsIndex.sessions[sessionIndex];
    
    // Update session data file
    await this.uploadFile(session.dataFileName, data);
    
    // Update session metadata
    sessionsIndex.sessions[sessionIndex] = {
      ...session,
      name,
      description: description || session.description,
      stats,
      starredPropertyId,
      updated_at: new Date().toISOString()
    };
    
    await this.updateSessionsIndex(sessionsIndex);
    
    return {
      message: 'Session updated successfully'
    };
  }

  // Delete a session
  async deleteSession(id) {
    const sessionsIndex = await this.getSessionsIndex();
    const sessionIndex = sessionsIndex.sessions.findIndex(s => s.id == id);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    const session = sessionsIndex.sessions[sessionIndex];
    
    try {
      // Delete session data file from B2
      const fileVersions = await this.b2.listFileVersions({
        bucketId: this.bucketId,
        startFileName: session.dataFileName,
        maxFileCount: 1
      });
      
      const file = fileVersions.data.files.find(f => f.fileName === session.dataFileName);
      if (file) {
        await this.b2.deleteFileVersion({
          fileId: file.fileId,
          fileName: session.dataFileName
        });
      }
    } catch (error) {
      console.error('Error deleting session data file:', error);
      // Continue with deletion even if file deletion fails
    }
    
    // Remove from sessions index
    sessionsIndex.sessions.splice(sessionIndex, 1);
    await this.updateSessionsIndex(sessionsIndex);
    
    return {
      message: 'Session deleted successfully'
    };
  }

  // Backup sessions index
  async backupSessionsIndex() {
    const sessionsIndex = await this.getSessionsIndex();
    const backupFileName = `backup-sessions-index-${Date.now()}.json`;
    await this.uploadFile(backupFileName, sessionsIndex);
    return backupFileName;
  }

  // Restore sessions index from backup
  async restoreSessionsIndex(backupFileName) {
    const backupData = await this.downloadFile(backupFileName);
    await this.updateSessionsIndex(backupData);
    return backupData;
  }
}

// Initialize B2 Database
const b2db = new B2Database();

// Initialize database on startup
b2db.initialize().catch(console.error);

// API Routes

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await b2db.getAllSessions();
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions', details: err.message });
  }
});

// Get a specific session by ID
app.get('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const session = await b2db.getSession(id);
    res.json(session);
  } catch (err) {
    console.error('Error loading session:', err);
    if (err.message === 'Session not found') {
      res.status(404).json({ error: 'Session not found' });
    } else {
      res.status(500).json({ error: 'Failed to load session', details: err.message });
    }
  }
});

// Save a new session
app.post('/api/sessions', async (req, res) => {
  const { name, description, data, stats, starredPropertyId } = req.body;

  console.log('Received session data:', { name, description, starredPropertyId });

  try {
    const result = await b2db.createSession({
      name,
      description,
      data,
      stats,
      starredPropertyId
    });
    
    console.log('Session saved with starredPropertyId:', starredPropertyId);
    res.json(result);
  } catch (err) {
    console.error('Error saving session:', err);
    res.status(500).json({ error: 'Failed to save session', details: err.message });
  }
});

// Update an existing session
app.put('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, data, stats, starredPropertyId } = req.body;

  console.log('Updating session data:', { id, name, description, starredPropertyId });

  try {
    const result = await b2db.updateSession(id, {
      name,
      description,
      data,
      stats,
      starredPropertyId
    });
    
    console.log('Session updated with starredPropertyId:', starredPropertyId);
    res.json(result);
  } catch (err) {
    console.error('Error updating session:', err);
    if (err.message === 'Session not found') {
      res.status(404).json({ error: 'Session not found' });
    } else {
      res.status(500).json({ error: 'Failed to update session', details: err.message });
    }
  }
});

// Delete a session
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await b2db.deleteSession(id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting session:', err);
    if (err.message === 'Session not found') {
      res.status(404).json({ error: 'Session not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete session', details: err.message });
    }
  }
});

// Backup sessions index
app.post('/api/backup', async (req, res) => {
  try {
    const backupFileName = await b2db.backupSessionsIndex();
    res.json({ message: 'Backup created successfully', backupFileName });
  } catch (err) {
    console.error('Error creating backup:', err);
    res.status(500).json({ error: 'Failed to create backup', details: err.message });
  }
});

// Restore sessions index from backup
app.post('/api/restore/:backupFileName', async (req, res) => {
  const { backupFileName } = req.params;
  
  try {
    const restoredData = await b2db.restoreSessionsIndex(backupFileName);
    res.json({ message: 'Backup restored successfully', restoredData });
  } catch (err) {
    console.error('Error restoring backup:', err);
    res.status(500).json({ error: 'Failed to restore backup', details: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    b2Configured: !!(B2_BUCKET_ID && B2_BUCKET_NAME),
    databaseType: 'B2 Backblaze'
  });
});

// Export for Vercel serverless
module.exports = app; 