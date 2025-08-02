# Pricing Pin - Real Estate Data Analysis

A modern web application for analyzing real estate CSV data with advanced features including data visualization, market analysis, and session management.

## Features

- **CSV Data Processing**: Upload and process real estate CSV files
- **Interactive Data Tables**: View and edit data with sorting and filtering
- **Market Analysis**: Comprehensive analytics and insights
- **Data Export**: Export processed data to CSV format
- **Session Management**: Save and load analysis sessions using SQLite database
- **Real-time Statistics**: Dynamic calculation of market metrics

## Database Features

The application uses B2 Backblaze cloud storage for robust and scalable session management:

- **Save Sessions**: Save your current analysis with a name and description
- **Load Sessions**: Retrieve and load previously saved sessions
- **Session History**: View all saved sessions with metadata
- **Delete Sessions**: Remove unwanted sessions from the database
- **Cloud Storage**: All sessions are stored securely in B2 Backblaze
- **Backup & Restore**: Automatic backup and restore functionality
- **Scalable**: No local database files, fully cloud-based

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pricing-pin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the React frontend (port 3000) and the Express backend server (port 3001) concurrently.

## Usage

### Starting the Application

- **Development mode**: `npm run dev` (starts both frontend and backend)
- **Frontend only**: `npm start` (requires backend to be running separately)
- **Backend only**: `npm run server`

### Using Session Management

1. **Upload and Process Data**: Upload your CSV file and process the data
2. **Save Session**: Click "Save Current Session" in the "Saved Sessions" tab
3. **Name Your Session**: Provide a name and optional description
4. **Load Sessions**: View and load previously saved sessions
5. **Manage Sessions**: Delete unwanted sessions as needed

### Database Configuration

The application uses B2 Backblaze cloud storage. See `B2_SETUP.md` for detailed setup instructions.

Required environment variables:
```env
B2_KEY_ID=your_b2_key_id
B2_APP_KEY=your_b2_application_key
B2_BUCKET_ID=your_b2_bucket_id
B2_BUCKET_NAME=your_b2_bucket_name
```

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/sessions` - Get all saved sessions
- `GET /api/sessions/:id` - Get a specific session by ID
- `POST /api/sessions` - Save a new session
- `PUT /api/sessions/:id` - Update an existing session
- `DELETE /api/sessions/:id` - Delete a session
- `GET /api/health` - Health check endpoint

## Data Structure

### B2 Session Schema

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

### B2 File Structure

- `sessions-index.json` - Main index file containing session metadata
- `session-data-{timestamp}-{random}.json` - Individual session data files
- `backup-sessions-index-{timestamp}.json` - Backup files

## Development

### Project Structure

```
pricing-pin/
├── src/
│   ├── components/
│   │   ├── SessionManager.js    # Session management component
│   │   └── ...
│   ├── utils/
│   │   ├── apiService.js        # API communication service
│   │   └── ...
│   └── App.js                   # Main application component
├── server/
│   └── index.js                 # Express.js backend server with B2 integration
├── B2_SETUP.md                 # B2 Backblaze setup guide
└── package.json
```

### Adding New Features

1. **Frontend**: Add components in `src/components/`
2. **Backend**: Add routes in `server/index.js`
3. **API**: Update `src/utils/apiService.js` for new endpoints
4. **Database**: Add new tables in the database initialization section

## Troubleshooting

### Common Issues

1. **Backend not starting**: Ensure port 3001 is available
2. **B2 configuration errors**: Check environment variables and B2 credentials
3. **CORS errors**: Verify the backend is running on the correct port
4. **Session not saving**: Check browser console for API errors
5. **B2 authentication errors**: Verify B2 credentials and bucket permissions

### Database Reset

To reset the database (deletes all saved sessions):
1. Delete the `sessions-index.json` file from your B2 bucket
2. Restart the server - it will recreate the index automatically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 