import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import SummaryStats from './components/SummaryStats';
import { processCSVData, calculateComparisons, generateSummaryStats, exportToCSV } from './utils/csvProcessor';
import { BarChart3, FileSpreadsheet, TrendingUp } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      setActiveTab('overview');
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'data', label: 'Data Table', icon: FileSpreadsheet },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp },
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
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data.length ? (
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
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Market Overview
                    </h2>
                    <p className="text-gray-600">
                      Key insights and statistics from your real estate data
                    </p>
                  </div>
                  
                  {stats && <SummaryStats stats={stats} />}
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Property Data
                      </h2>
                      <p className="text-gray-600">
                        Detailed view of all properties with sorting and filtering capabilities
                      </p>
                    </div>
                    <button
                      onClick={() => handleExport(processedData)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export All Data</span>
                    </button>
                  </div>
                  
                  <DataTable data={processedData} onExport={handleExport} />
                </div>
              )}

                             {activeTab === 'analysis' && (
                 <div className="space-y-6">
                   <div>
                     <h2 className="text-2xl font-bold text-gray-900 mb-2">
                       Market Analysis
                     </h2>
                     <p className="text-gray-600">
                       Advanced analytics and market insights
                     </p>
                   </div>
                   
                   {/* Reference Property Info */}
                   {processedData.find(p => p['Status'] === 'EXP') && (
                     <div className="card bg-blue-50 border-blue-200">
                       <h3 className="text-lg font-semibold text-blue-900 mb-2">Reference Property</h3>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                         <div>
                           <span className="text-blue-700 font-medium">Address:</span>
                           <p className="text-blue-900">{processedData.find(p => p['Status'] === 'EXP')['Address']}</p>
                         </div>
                         <div>
                           <span className="text-blue-700 font-medium">List Price:</span>
                           <p className="text-blue-900">${parseInt(processedData.find(p => p['Status'] === 'EXP')['List Price'] || 0).toLocaleString()}</p>
                         </div>
                         <div>
                           <span className="text-blue-700 font-medium">Square Feet:</span>
                           <p className="text-blue-900">{parseInt(processedData.find(p => p['Status'] === 'EXP')['Above Grade Finished SQFT'] || 0).toLocaleString()}</p>
                         </div>
                         <div>
                           <span className="text-blue-700 font-medium">Zillow:</span>
                           <p className="text-blue-900">
                             {processedData.find(p => p['Status'] === 'EXP')['Zillow Link'] && (
                               <a 
                                 href={processedData.find(p => p['Status'] === 'EXP')['Zillow Link']}
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-blue-600 hover:text-blue-700 underline font-medium inline-flex items-center gap-1"
                               >
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                 </svg>
                                 View on Zillow
                               </a>
                             )}
                           </p>
                         </div>
                       </div>
                       <p className="text-blue-700 text-sm mt-2">
                         All comparisons are calculated relative to this expired listing.
                       </p>
                     </div>
                   )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Price Analysis */}
                    <div className="card">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Analysis</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Properties above list price:</span>
                          <span className="font-semibold">
                            {processedData.filter(p => p['Price Difference'] > 0).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Properties below list price:</span>
                          <span className="font-semibold">
                            {processedData.filter(p => p['Price Difference'] < 0).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Average price difference:</span>
                          <span className={`font-semibold ${
                            stats?.avgPriceDifference > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stats?.avgPriceDifference > 0 ? '+' : ''}${parseInt(stats?.avgPriceDifference || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Market Trends */}
                    <div className="card">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fastest selling:</span>
                          <span className="font-semibold">
                            {Math.min(...processedData.map(p => p['DOM'] || Infinity))} days
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Slowest selling:</span>
                          <span className="font-semibold">
                            {Math.max(...processedData.map(p => p['DOM'] || 0))} days
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Average days on market:</span>
                          <span className="font-semibold">{stats?.avgDaysOnMarket} days</span>
                        </div>
                      </div>
                    </div>

                    {/* Property Types */}
                    <div className="card">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Distribution</h3>
                      <div className="space-y-4">
                        {['3', '4', '5', '6'].map(beds => {
                          const count = processedData.filter(p => p['Beds'] === parseInt(beds)).length;
                          return (
                            <div key={beds} className="flex justify-between items-center">
                              <span className="text-gray-600">{beds} Bedroom:</span>
                              <span className="font-semibold">{count} properties</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                                         {/* EXP Property Comparisons */}
                     <div className="card">
                       <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparisons vs EXP Property</h3>
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <span className="text-gray-600">Properties larger than EXP:</span>
                           <span className="font-semibold">
                             {processedData.filter(p => p['Sq Ft Difference vs EXP'] > 0).length}
                           </span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-gray-600">Properties smaller than EXP:</span>
                           <span className="font-semibold">
                             {processedData.filter(p => p['Sq Ft Difference vs EXP'] < 0).length}
                           </span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-gray-600">Properties with larger lots:</span>
                           <span className="font-semibold">
                             {processedData.filter(p => p['Lot Difference vs EXP'] > 0).length}
                           </span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-gray-600">Properties with smaller lots:</span>
                           <span className="font-semibold">
                             {processedData.filter(p => p['Lot Difference vs EXP'] < 0).length}
                           </span>
                         </div>
                       </div>
                     </div>

                     {/* Neighborhood Analysis */}
                     <div className="card">
                       <h3 className="text-lg font-semibold text-gray-900 mb-4">Neighborhood Analysis</h3>
                       <div className="space-y-4">
                         {Array.from(new Set(processedData.map(p => p['Subdivision/Neighborhood'])))
                           .filter(Boolean)
                           .slice(0, 5)
                           .map(neighborhood => {
                             const properties = processedData.filter(p => p['Subdivision/Neighborhood'] === neighborhood);
                             const avgPrice = properties.reduce((sum, p) => sum + (p['List Price'] || 0), 0) / properties.length;
                             return (
                               <div key={neighborhood} className="flex justify-between items-center">
                                 <span className="text-gray-600 text-sm">{neighborhood}:</span>
                                 <span className="font-semibold text-sm">
                                   ${parseInt(avgPrice).toLocaleString()}
                                 </span>
                               </div>
                             );
                           })}
                       </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 