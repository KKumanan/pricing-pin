# B2 Backblaze Database Setup Guide

This application now uses B2 Backblaze as the primary database instead of SQLite. Follow these steps to configure your B2 storage:

## 1. Create a Backblaze B2 Account

1. Go to [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Sign up for a free account
3. Verify your email address

## 2. Create a B2 Bucket

1. Log into your B2 account
2. Click "Create Bucket"
3. Choose a unique bucket name (e.g., `pricing-pin-data`)
4. Set the bucket type to "Private"
5. Note down the **Bucket ID** and **Bucket Name**

## 3. Create Application Keys

1. In your B2 account, go to "App Keys" in the left sidebar
2. Click "Add a New Application Key"
3. Give it a name like "Pricing Pin App"
4. Select your bucket from the dropdown
5. Set permissions to "Read and Write"
6. Click "Create New Key"
7. **IMPORTANT**: Copy the **Key ID** and **Application Key** immediately (you won't see the application key again)

## 4. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Backblaze B2 Configuration
B2_KEY_ID=your_key_id_here
B2_APP_KEY=your_application_key_here
B2_BUCKET_ID=your_bucket_id_here
B2_BUCKET_NAME=your_bucket_name_here

# Server Configuration
PORT=3001
```

Replace the placeholder values with your actual B2 credentials.

## 5. Test the Configuration

1. Start the server: `npm run server`
2. Check the console output for:
   - "B2 Database initialized successfully"
   - "B2 Bucket ID: Configured"
   - "B2 Bucket Name: Configured"

## 6. Database Architecture

The new B2-based database uses the following structure:

### Files in B2 Bucket:
- `sessions-index.json` - Main index file containing session metadata
- `session-data-{timestamp}-{random}.json` - Individual session data files
- `backup-sessions-index-{timestamp}.json` - Backup files

### Session Data Structure:
```json
{
  "id": 1,
  "name": "Session Name",
  "description": "Session Description",
  "dataFileName": "session-data-1234567890-abc123.json",
  "stats": { /* session statistics */ },
  "starredPropertyId": "property-123",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## 7. API Endpoints

The server provides these endpoints:

- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get specific session
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/backup` - Create backup
- `POST /api/restore/:filename` - Restore from backup
- `GET /api/health` - Health check

## 8. Troubleshooting

### Common Issues:

1. **"B2 not configured" error**
   - Check that all environment variables are set correctly
   - Verify your B2 credentials are valid

2. **"Session not found" error**
   - The sessions index may be corrupted
   - Try creating a backup and restoring

3. **"Failed to initialize B2 Database"**
   - Check your internet connection
   - Verify B2 credentials have proper permissions

### Reset Database:
If you need to reset the database, simply delete the `sessions-index.json` file from your B2 bucket. The system will recreate it on the next startup.

## 9. Security Notes

- Keep your B2 credentials secure
- Never commit the `.env` file to version control
- Use application keys with minimal required permissions
- Regularly rotate your application keys

## 10. Cost Considerations

B2 Backblaze pricing (as of 2024):
- Storage: $0.005/GB/month
- Downloads: $0.01/GB
- Uploads: Free
- API calls: $0.004/10,000 Class A transactions

For typical usage, costs should be minimal (under $1/month). 