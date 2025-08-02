import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import EditableDataTable from './components/EditableDataTable';
import DataEntry from './components/DataEntry';
import SessionManager from './components/SessionManager';
import MergeCSV from './components/MergeCSV';
import { processCSVData, calculateComparisons, generateSummaryStats, exportToCSV } from './utils/csvProcessor';
import apiService from './utils/apiService';
import { BarChart3, FileSpreadsheet, TrendingUp, Edit3, Database, Star, GitMerge } from 'lucide-react';
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
  const [starredPropertyId, setStarredPropertyId] = useState(null);
  const [showStarConfirmModal, setShowStarConfirmModal] = useState(false);
  const [pendingStarProperty, setPendingStarProperty] = useState(null);

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const parsedData = await processCSVData(text);
      
      // Perform calculations using starred property as reference (initially none)
      const calculatedData = calculateComparisons(parsedData, null);
      const summaryStats = generateSummaryStats(calculatedData);
      
      setData(parsedData);
      setProcessedData(calculatedData);
      setStats(summaryStats);
      setStarredPropertyId(null); // Reset starred property when loading new data
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

  const handleMergeCSV = async (file) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const newData = await processCSVData(text);
      
      // Get existing addresses to check for duplicates
      const existingAddresses = new Set(data.map(item => item.Address?.toLowerCase().trim()));
      
      // Filter out properties that already exist (same address)
      const uniqueNewData = newData.filter(item => {
        const address = item.Address?.toLowerCase().trim();
        return address && !existingAddresses.has(address);
      });
      
      if (uniqueNewData.length === 0) {
        setError('No new properties found. All addresses already exist in the current session.');
        return;
      }
      
      // Merge new data with existing data
      const mergedData = [...data, ...uniqueNewData];
      
      // Recalculate with current starred property
      const recalculatedData = calculateComparisons(mergedData, starredPropertyId);
      const updatedStats = generateSummaryStats(recalculatedData);
      
      setData(mergedData);
      setProcessedData(recalculatedData);
      setStats(updatedStats);
      
      // Auto-save if we're working with a session
      if (currentSessionId) {
        try {
          await apiService.updateSession(currentSessionId, {
            name: currentSessionName,
            description: '', // Keep existing description
            data: recalculatedData,
            stats: updatedStats,
            starredPropertyId: starredPropertyId
          });
          console.log('Session automatically updated with merged data');
        } catch (err) {
          console.error('Failed to auto-save merged session:', err);
        }
      }
      
      // Show success message
      const addedCount = uniqueNewData.length;
      const skippedCount = newData.length - uniqueNewData.length;
      setError(null);
      alert(`Successfully merged CSV data!\n\nAdded: ${addedCount} new properties\nSkipped: ${skippedCount} duplicate addresses`);
      
      // Automatically navigate to data table page
      setActiveTab('data');
      
    } catch (err) {
      setError(err.message);
      console.error('Error merging CSV data:', err);
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
        console.log('Auto-saving session with starredPropertyId:', starredPropertyId);
        await apiService.updateSession(currentSessionId, {
          name: currentSessionName,
          description: '', // Keep existing description
          data: updatedData,
          stats: updatedStats,
          starredPropertyId: starredPropertyId
        });
        console.log('Session automatically updated in database');
      } catch (err) {
        console.error('Failed to auto-save session:', err);
        // Optionally show an error notification to the user
      }
    }
  };

  const handleLoadSession = (sessionData, sessionStats, sessionId = null, sessionName = null, sessionStarredPropertyId = null) => {
    console.log('Loading session with starredPropertyId:', sessionStarredPropertyId);
    setData(sessionData);
    setCurrentSessionId(sessionId);
    setCurrentSessionName(sessionName);
    setActiveTab('data');
    // Restore starred property from session
    setStarredPropertyId(sessionStarredPropertyId);
    
    // Recalculate processed data with the starred property
    if (sessionStarredPropertyId) {
      const recalculatedData = calculateComparisons(sessionData, sessionStarredPropertyId);
      setProcessedData(recalculatedData);
    } else {
      setProcessedData(sessionData);
    }
    
    setStats(sessionStats);
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
        stats: stats,
        starredPropertyId: starredPropertyId
      };
      
      console.log('Saving session with starredPropertyId:', starredPropertyId);

      let result;
      if (currentSessionId) {
        // Update existing session
        result = await apiService.updateSession(currentSessionId, sessionData);
      } else {
        // Create new session
        result = await apiService.saveSession(sessionData);
      }
      setShowSaveModal(false);
      setSaveForm({ name: '', description: '' });
      setCurrentSessionId(result.id || currentSessionId);
      setCurrentSessionName(sessionData.name);
      console.log('Session saved successfully');
    } catch (err) {
      setError('Failed to save session');
      console.error('Error saving session:', err);
    }
  };

  const handleStarProperty = (propertyId) => {
    // If clicking on already starred property, unstar it
    if (starredPropertyId === propertyId) {
      setStarredPropertyId(null);
      
      // Recalculate comparisons with no reference property
      const recalculatedData = calculateComparisons(data, null);
      setProcessedData(recalculatedData);
      
      // Update stats
      const updatedStats = generateSummaryStats(recalculatedData);
      setStats(updatedStats);
      
      // Auto-save if working with a session
      if (currentSessionId) {
        handleDataUpdate(recalculatedData);
      }
      return;
    }
    
    // Show confirmation modal for new star
    const property = data.find(p => p['MLS #'] === propertyId);
    setPendingStarProperty(property);
    setShowStarConfirmModal(true);
    
    // If there's already a starred property, show additional warning
    if (starredPropertyId) {
      const currentStarredProperty = data.find(p => p['MLS #'] === starredPropertyId);
      console.log(`Replacing reference property: ${currentStarredProperty['Address']} with ${property['Address']}`);
    }
  };

  const confirmStarProperty = () => {
    if (!pendingStarProperty) return;
    
    setStarredPropertyId(pendingStarProperty['MLS #']);
    
    // Recalculate comparisons with the new starred property
    const recalculatedData = calculateComparisons(data, pendingStarProperty['MLS #']);
    setProcessedData(recalculatedData);
    
    // Update stats
    const updatedStats = generateSummaryStats(recalculatedData);
    setStats(updatedStats);
    
    // Auto-save if working with a session
    if (currentSessionId) {
      handleDataUpdate(recalculatedData);
    }
    
    // Close modal and reset pending property
    setShowStarConfirmModal(false);
    setPendingStarProperty(null);
  };

  const cancelStarProperty = () => {
    setShowStarConfirmModal(false);
    setPendingStarProperty(null);
  };

  const tabs = [
    { id: 'data', label: 'Data Table', icon: FileSpreadsheet },
    { id: 'data-entry', label: 'Data Entry', icon: Edit3 },
    { id: 'compare', label: 'Compare', icon: TrendingUp },
    { id: 'merge', label: 'Merge CSV', icon: GitMerge },
    { id: 'sessions', label: 'Saved Sessions', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
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

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Property Data
                        </h2>
                        <p className="text-gray-600">
                          Detailed view of all properties with sorting and filtering capabilities
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('merge')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <GitMerge className="w-4 h-4" />
                        <span>Merge CSV</span>
                      </button>
                    </div>
                  
                    <EditableDataTable 
                      data={processedData} 
                      onExport={handleExport} 
                      onDataUpdate={handleDataUpdate}
                      starredPropertyId={starredPropertyId}
                      onStarProperty={handleStarProperty}
                    />
                </div>
              )}

              {activeTab === 'data-entry' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Data Entry
                      </h2>
                      <p className="text-gray-600">
                        Edit property details and view individual property information
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('merge')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <GitMerge className="w-4 h-4" />
                      <span>Merge CSV</span>
                    </button>
                  </div>
                  <DataEntry data={processedData} onDataUpdate={handleDataUpdate} />
                </div>
              )}



              {activeTab === 'compare' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Property Comparison
                      </h2>
                      <p className="text-gray-600">
                        Compare properties against your reference property
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('merge')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <GitMerge className="w-4 h-4" />
                      <span>Merge CSV</span>
                    </button>
                  </div>
                  {console.log('CompareTab props:', { starredPropertyId, referenceProperty: starredPropertyId ? processedData.find(p => p['MLS #'] === starredPropertyId) : null })}
                  <CompareTab
                    comps={processedData.filter(p => p['MLS #'] !== starredPropertyId)}
                    referenceProperty={starredPropertyId ? processedData.find(p => p['MLS #'] === starredPropertyId) : null}
                    onDataUpdate={handleDataUpdate}
                    starredPropertyId={starredPropertyId}
                    onStarProperty={handleStarProperty}
                  />
                </div>
              )}

              {activeTab === 'merge' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Merge Additional CSV Data
                    </h2>
                    <p className="text-gray-600">
                      Add new properties from another CSV file to your current session
                    </p>
                  </div>
                  
                  <MergeCSV 
                    onMergeCSV={handleMergeCSV}
                    isLoading={isLoading}
                    hasExistingData={data.length > 0}
                  />
                </div>
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

      {/* Star Confirmation Modal */}
      {showStarConfirmModal && pendingStarProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Set Reference Property</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-3">
                You are about to set this property as the reference for all comparisons:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="font-medium text-gray-900">{pendingStarProperty['Address']}</p>
                <p className="text-sm text-gray-600">MLS: {pendingStarProperty['MLS #']}</p>
                <p className="text-sm text-gray-600">
                  {pendingStarProperty['List Price'] ? `$${pendingStarProperty['List Price'].toLocaleString()}` : 'No price'} • 
                  {pendingStarProperty['Beds']} bed, {pendingStarProperty['Baths']} bath
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will recalculate all comparison data (price differences, square footage differences, etc.) 
                based on this property as the reference point.
                {starredPropertyId && (
                  <span className="block mt-1">
                    <strong>Warning:</strong> This will replace the current reference property.
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelStarProperty}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStarProperty}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                Set as Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 