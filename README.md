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

The application now includes SQLite database functionality to save and manage your CSV analysis sessions:

- **Save Sessions**: Save your current analysis with a name and description
- **Load Sessions**: Retrieve and load previously saved sessions
- **Session History**: View all saved sessions with metadata
- **Delete Sessions**: Remove unwanted sessions from the database
- **Persistent Storage**: All sessions are stored locally in SQLite

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

### Database Location

The SQLite database file is automatically created at:
```
server/database.sqlite
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

### CSV Session Schema

```sql
CREATE TABLE csv_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  data TEXT NOT NULL,
  stats TEXT
);
```

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
│   └── index.js                 # Express.js backend server
├── database.sqlite              # SQLite database (auto-created)
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
2. **Database errors**: Check file permissions for `server/database.sqlite`
3. **CORS errors**: Verify the backend is running on the correct port
4. **Session not saving**: Check browser console for API errors

### Database Reset

To reset the database (deletes all saved sessions):
```bash
rm server/database.sqlite
npm run server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 