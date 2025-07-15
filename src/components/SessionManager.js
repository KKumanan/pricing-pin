import React, { useState, useEffect } from 'react';
import { FolderOpen, Trash2, Clock, FileText, AlertCircle } from 'lucide-react';
import apiService from '../utils/apiService';

const SessionManager = ({ 
  currentData, 
  currentStats, 
  onLoadSession, 
  isVisible = false 
}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load sessions on component mount
  useEffect(() => {
    if (isVisible) {
      loadSessions();
    }
  }, [isVisible]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getSessions();
      setSessions(data);
    } catch (err) {
      setError('Failed to load saved sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async (sessionId) => {
    setLoading(true);
    setError(null);

    try {
      const session = await apiService.getSession(sessionId);
      onLoadSession(session.data, session.stats, session.id, session.name);
    } catch (err) {
      setError('Failed to load session');
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setError(null);

    try {
      await apiService.deleteSession(sessionId);
      await loadSessions(); // Refresh the list
    } catch (err) {
      setError('Failed to delete session');
      console.error('Error deleting session:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatStats = (stats) => {
    if (!stats) return 'No stats available';
    
    const propertyCount = stats.totalProperties || 'N/A';
    const avgPrice = stats.avgListPrice ? `$${parseInt(stats.avgListPrice).toLocaleString()}` : 'N/A';
    
    return `${propertyCount} properties, Avg: ${avgPrice}`;
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Sessions</h2>
          <p className="text-gray-600">Manage your saved CSV analysis sessions</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved sessions</h3>
            <p className="text-gray-600">Save your first CSV analysis session to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {session.id}
                      </span>
                    </div>
                    
                    {session.description && (
                      <p className="text-gray-600 mb-3">{session.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Updated: {formatDate(session.updated_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{formatStats(session.stats)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLoadSession(session.id)}
                      className="btn-secondary flex items-center space-x-1"
                      title="Load session"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Load</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="btn-danger flex items-center space-x-1"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager; 