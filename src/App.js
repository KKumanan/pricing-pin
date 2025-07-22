import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import EditableDataTable from './components/EditableDataTable';
import DataEntry from './components/DataEntry';
import SessionManager from './components/SessionManager';
import { processCSVData, calculateComparisons, generateSummaryStats, exportToCSV } from './utils/csvProcessor';
import apiService from './utils/apiService';
import { BarChart3, FileSpreadsheet, TrendingUp, Edit3, Database } from 'lucide-react';
import CompareTab from './components/CompareTab';

function App() {
  const [data, setData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('data');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionName, setCurrentSessionName] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', description: '' });

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const parsedData = await processCSVData(text);
      
      // Perform calculations using EXP property as reference
      const calculatedData = calculateComparisons(parsedData);
      const summaryStats = generateSummaryStats(calculatedData);
      
      setData(parsedData);
      setProcessedData(calculatedData);
      setStats(summaryStats);
      setCurrentSessionId(null); // Clear current session when uploading new file
      setCurrentSessionName(null);
      setActiveTab('data');
      setShowSaveModal(true); // Automatically show save modal after successful upload
    } catch (err) {
      setError(err.message);
      console.error('Error processing file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (dataToExport) => {
    exportToCSV(dataToExport, 'processed_real_estate_data.csv');
  };

  const handleDataUpdate = async (updatedData) => {
    setProcessedData(updatedData);
    const updatedStats = generateSummaryStats(updatedData);
    setStats(updatedStats);

    // If we're working with a loaded session, automatically save changes back to the database
    if (currentSessionId) {
      try {
        await apiService.updateSession(currentSessionId, {
          name: currentSessionName,
          description: '', // Keep existing description
          data: updatedData,
          stats: updatedStats
        });
        console.log('Session automatically updated in database');
      } catch (err) {
        console.error('Failed to auto-save session:', err);
        // Optionally show an error notification to the user
      }
    }
  };

  const handleLoadSession = (sessionData, sessionStats, sessionId = null, sessionName = null) => {
    setData(sessionData);
    setProcessedData(sessionData);
    setStats(sessionStats);
    setCurrentSessionId(sessionId);
    setCurrentSessionName(sessionName);
    setActiveTab('data');
  };

  const handleSaveSuccess = () => {
    // Could show a success notification here
    console.log('Session saved successfully');
  };

  const handleSaveSession = async () => {
    if (!saveForm.name.trim()) {
      setError('Please enter a session name');
      return;
    }

    try {
      const sessionData = {
        name: saveForm.name.trim(),
        description: saveForm.description.trim(),
        data: processedData,
        stats: stats
      };

      const result = await apiService.saveSession(sessionData);
      
      setShowSaveModal(false);
      setSaveForm({ name: '', description: '' });
      setCurrentSessionId(result.id);
      setCurrentSessionName(sessionData.name);
      
      console.log('Session saved successfully');
    } catch (err) {
      setError('Failed to save session');
      console.error('Error saving session:', err);
    }
  };

  const tabs = [
    { id: 'data', label: 'Data Table', icon: FileSpreadsheet },
    { id: 'data-entry', label: 'Data Entry', icon: Edit3 },
    { id: 'compare', label: 'Compare', icon: TrendingUp },
    { id: 'sessions', label: 'Saved Sessions', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pricing Pin</h1>
              <p className="text-gray-600">Real Estate Data Analysis</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {data.length > 0 && `${data.length} properties loaded`}
                {currentSessionName && (
                  <span className="ml-2 text-primary-600 font-medium">
                    • Session: {currentSessionName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sessions' ? (
          <div className="space-y-8">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Sessions Content */}
            <div className="space-y-6">
              <SessionManager
                currentData={processedData}
                currentStats={stats}
                onLoadSession={handleLoadSession}
                isVisible={true}
                onNewSessionUpload={handleFileUpload}
              />
            </div>
          </div>
        ) : !data.length ? (
          // Upload Section
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Upload Your Real Estate Data
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload a CSV file containing real estate data to analyze market trends, 
                compare properties, and generate insights. The app will automatically 
                calculate key metrics and provide a comprehensive analysis.
              </p>
            </div>
            
            <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
            
            <div className="text-center">
              <button
                className="btn-secondary mt-4"
                onClick={() => setActiveTab('sessions')}
              >
                View Saved Sessions
              </button>
            </div>
            {error && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Data Analysis Section
          <div className="space-y-8">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
              {activeTab === 'data' && (
                <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Property Data
                      </h2>
                      <p className="text-gray-600">
                        Detailed view of all properties with sorting and filtering capabilities
                      </p>
                  </div>
                  
                                                       <EditableDataTable data={processedData} onExport={handleExport} onDataUpdate={handleDataUpdate} />
                </div>
              )}

              {activeTab === 'data-entry' && (
                <div className="space-y-6">
                  <DataEntry data={processedData} onDataUpdate={handleDataUpdate} />
                </div>
              )}



              {activeTab === 'compare' && (
                <CompareTab
                  comps={processedData.filter(p => p['Status'] !== 'EXP')}
                  referenceProperty={processedData.find(p => p['Status'] === 'EXP')}
                  onDataUpdate={handleDataUpdate}
                />
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  <SessionManager
                    currentData={processedData}
                    currentStats={stats}
                    onLoadSession={handleLoadSession}
                    isVisible={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Your Analysis Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter session name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional description"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip
              </button>
              <button
                onClick={handleSaveSession}
                disabled={!saveForm.name.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 