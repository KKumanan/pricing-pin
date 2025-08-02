const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    // Use environment variable for production, fallback to localhost for development
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app/api')
      : API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all CSV sessions
  async getSessions() {
    return this.request('/sessions');
  }

  // Get a specific CSV session by ID
  async getSession(id) {
    const result = await this.request(`/sessions/${id}`);
    console.log('Received session from server:', result);
    return result;
  }

  // Save a new CSV session
  async saveSession(sessionData) {
    console.log('Sending session data to server:', sessionData);
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Update an existing CSV session
  async updateSession(id, sessionData) {
    console.log('Sending update session data to server:', { id, sessionData });
    return this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  // Delete a CSV session
  async deleteSession(id) {
    return this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService(); 