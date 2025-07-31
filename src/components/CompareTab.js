import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Home, ExternalLink, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

const CompareTab = ({ comps = [], referenceProperty, onDataUpdate, starredPropertyId, onStarProperty }) => {
  const [selectedComp, setSelectedComp] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Escape key closes popup
  useEffect(() => {
    if (!showPopup) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowPopup(false);
        setSelectedComp(null);
        setComparisonResult(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPopup]);

  const handleCardClick = (comp) => {
    setSelectedComp(comp);
    setShowPopup(true);
    
    // Set the comparison result based on existing worth comparison
    if (comp['Worth Comparison'] === 'Worth More') {
      setComparisonResult('more');
    } else if (comp['Worth Comparison'] === 'About the Same') {
      setComparisonResult('same');
    } else if (comp['Worth Comparison'] === 'Worth Less') {
      setComparisonResult('less');
    } else {
      setComparisonResult(null);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedComp(null);
    setComparisonResult(null);
  };

  const handleWorthComparison = (comparisonType) => {
    let worthValue;
    let resultType;
    
    switch (comparisonType) {
      case 'more':
        worthValue = 'Worth More';
        resultType = 'more';
        break;
      case 'same':
        worthValue = 'About the Same';
        resultType = 'same';
        break;
      case 'less':
        worthValue = 'Worth Less';
        resultType = 'less';
        break;
      default:
        return;
    }
    
    setComparisonResult(resultType);
    
    // Update the data with the worth comparison
    if (selectedComp && onDataUpdate) {
      const updatedComps = comps.map(comp => {
        if (comp['MLS #'] === selectedComp['MLS #']) {
          return {
            ...comp,
            'Worth Comparison': worthValue
          };
        }
        return comp;
      });
      
      // Find the reference property and add it back to the data
      const updatedData = updatedComps.concat([referenceProperty]);
      onDataUpdate(updatedData);
    }
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined || value === '') return '-';
    
    if (key.includes('Price') && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    if (key.includes('SQFT') && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    if (key.includes('Lot') && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    if (key === 'LOT SQFT' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    if (key === 'BELOW GRADE SQFT' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    return value.toString();
  };

  const comparisonFields = [
  { key: 'List Price', label: 'List Price' },
    { key: 'Close Price', label: 'Close Price' },
      { key: 'Above Grade Finished SQFT', label: 'Square Feet' },
    { key: 'Price/SqFt', label: 'Price/SqFt' },
    { key: 'LOT SQFT', label: 'LOT SQFT' },
    { key: 'BELOW GRADE SQFT', label: 'BELOW GRADE SQFT' },
    { key: 'SUBDIVISION', label: 'SUBDIVISION' },
  { key: 'Beds', label: 'Beds' },
  { key: 'Baths', label: 'Baths' },
    { key: 'Year Built', label: 'Year Built' },
    { key: 'DOM', label: 'Days on Market' },
    { key: 'KITCHEN', label: 'KITCHEN' },
    { key: 'EXTERIOR', label: 'EXTERIOR' },
    { key: 'PRIMARY BATHROOM', label: 'PRIMARY BATHROOM' },
    { key: 'Sq Ft Difference vs EXP', label: 'SQFT DIFFERENCE' },
    { key: 'Lot Difference vs EXP', label: 'LOT SQFT DIFFERENCE' },
    { key: 'Rating', label: 'Rating' },
    { key: 'Good Comp', label: 'Good Comp' }
  ];

  if (!referenceProperty) {
    return (
      <div className="text-center py-12">
        <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reference Property Set</h3>
        <p className="text-gray-600 mb-4">Please select a reference property by clicking the star icon next to any property in the data table.</p>
        <div className="flex items-center justify-center gap-2 text-yellow-600">
          <Star className="w-5 h-5" />
          <span className="text-sm">Click the star to set as reference property</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare Properties</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Click on any property card to see a detailed side-by-side comparison with the reference property.
        </p>
      </div>

      {/* Reference Property Summary */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 fill-current" />
          Reference Property
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-yellow-700 font-medium">Address:</span>
            <p className="text-yellow-900">{referenceProperty['Address']}</p>
          </div>
          <div>
            <span className="text-yellow-700 font-medium">List Price:</span>
            <p className="text-yellow-900">{formatValue(referenceProperty['List Price'], 'List Price')}</p>
          </div>
          <div>
            <span className="text-yellow-700 font-medium">Square Feet:</span>
            <p className="text-yellow-900">{formatValue(referenceProperty['Above Grade Finished SQFT'], 'Above Grade Finished SQFT')}</p>
          </div>
          <div>
            <span className="text-yellow-700 font-medium">Beds/Baths:</span>
            <p className="text-yellow-900">{referenceProperty['Beds']} bed, {referenceProperty['Baths']} bath</p>
          </div>
        </div>
      </div>

      {/* Property Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comps.map((comp) => (
          <div 
            key={comp['MLS #']} 
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCardClick(comp)}
          >
            {/* No image or icon */}
            <div className="mb-4"></div>

            {/* Property Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900">{comp['Address']}</h3>
              <p className="text-base text-gray-600">MLS: {comp['MLS #']} • {comp['Status']}</p>
              
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <span className="text-gray-500">List Price:</span>
                  <p className="font-medium text-gray-900">{formatValue(comp['List Price'], 'List Price')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Close Price:</span>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    {(() => {
                      const closePrice = parseFloat(comp['Close Price']);
                      const listPrice = parseFloat(comp['List Price']);
                      if (!isNaN(closePrice) && !isNaN(listPrice)) {
                        if (closePrice > listPrice) {
                          return <span className="text-green-700 font-semibold flex items-center gap-1">{formatValue(comp['Close Price'], 'Close Price')}<ChevronUp className="inline w-4 h-4 text-green-500" /></span>;
                        } else if (closePrice < listPrice) {
                          return <span className="text-red-700 font-semibold flex items-center gap-1">{formatValue(comp['Close Price'], 'Close Price')}<ChevronDown className="inline w-4 h-4 text-red-500" /></span>;
                        }
                      }
                      return <span>{formatValue(comp['Close Price'], 'Close Price')}</span>;
                    })()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Square Feet:</span>
                  <p className="font-medium text-gray-900">{formatValue(comp['Above Grade Finished SQFT'], 'Above Grade Finished SQFT')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Beds/Baths:</span>
                  <p className="font-medium text-gray-900">{comp['Beds']} bed, {comp['Baths']} bath</p>
                </div>
                <div>
                  <span className="text-gray-500">Below Grade:</span>
                  <p className="font-medium text-gray-900">{formatValue(comp['BELOW GRADE SQFT'], 'BELOW GRADE SQFT')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Subdivision:</span>
                  <p className="font-medium text-gray-900">{comp['SUBDIVISION'] || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rating:</span>
                  <p className="font-medium text-gray-900">{comp['Rating'] || 0} stars</p>
                </div>
              </div>

              {/* Zillow Link Indicator */}
              {comp['Zillow Link'] && (
                                  <div className="flex items-center gap-2 text-primary-600 text-base">
                    <ExternalLink className="w-4 h-4" />
                    <span>Zillow listing available</span>
                  </div>
              )}

              {/* Worth Comparison Status */}
              {comp['Worth Comparison'] && comp['Worth Comparison'] !== 'Not Set' && (
                <div className={`text-center pt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  comp['Worth Comparison'] === 'Worth More' 
                    ? 'bg-green-100 text-green-800' 
                    : comp['Worth Comparison'] === 'About the Same'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {comp['Worth Comparison']}
                </div>
              )}
              
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Popup */}
      {showPopup && selectedComp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto relative">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-900">Property Comparison</h3>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600"
                style={{ position: 'sticky', top: 0, right: 0, zIndex: 20 }}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Zillow Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reference Property Zillow */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 fill-current text-yellow-500" />
                    Reference Property - {referenceProperty['Address']}
                  </h4>
                  {referenceProperty['Zillow Link'] ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <a
                          href={referenceProperty['Zillow Link']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in Zillow
                        </a>
                      </div>
                      <iframe
                        src={referenceProperty['Zillow Link']}
                        title="Reference Property Zillow"
                        className="w-full h-64"
                        frameBorder="0"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                      <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No Zillow link available</p>
                    </div>
                  )}
                </div>

                {/* Selected Property Zillow */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Selected Property - {selectedComp['Address']}
                  </h4>
                  {selectedComp['Zillow Link'] ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <a
                          href={selectedComp['Zillow Link']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in Zillow
                        </a>
                      </div>
                      <iframe
                        src={selectedComp['Zillow Link']}
                        title="Selected Property Zillow"
                        className="w-full h-64"
                        frameBorder="0"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                      <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No Zillow link available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Side-by-Side Data Comparison */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Property Data Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-base font-medium text-gray-700">Field</th>
                        <th className="px-4 py-3 text-left text-base font-medium text-gray-700">Seller's Home</th>
                        <th className="px-4 py-3 text-left text-base font-medium text-gray-700">Selected Property</th>
                        <th className="px-4 py-3 text-left text-base font-medium text-gray-700">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {comparisonFields.map((field) => {
                        const sellerValue = referenceProperty[field.key];
                        const compValue = selectedComp[field.key];
                        const difference = typeof sellerValue === 'number' && typeof compValue === 'number' 
                          ? compValue - sellerValue 
                          : null;
                        
                        return (
                          <tr key={field.key} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-base font-medium text-gray-900">{field.label}</td>
                            <td className="px-4 py-3 text-base text-gray-700">{formatValue(sellerValue, field.key)}</td>
                            <td className="px-4 py-3 text-base text-gray-700">{formatValue(compValue, field.key)}</td>
                                                          <td className="px-4 py-3 text-base">
                                {difference !== null ? (
                                  <span className={`font-medium ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {difference > 0 ? '+' : ''}{formatValue(difference, field.key)}
                                  </span>
                                ) : '-'}
                              </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Worth Comparison */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Worth Comparison</h4>
                <p className="text-gray-600 mb-4">
                  Based on your analysis, is the selected property worth more, about the same, or less than the reference property?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleWorthComparison('more')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      comparisonResult === 'more'
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Worth More
                  </button>
                  <button
                    onClick={() => handleWorthComparison('same')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      comparisonResult === 'same'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Minus className="w-5 h-5" />
                    About the Same
                  </button>
                  <button
                    onClick={() => handleWorthComparison('less')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      comparisonResult === 'less'
                        ? 'bg-red-100 text-red-800 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    Worth Less
                  </button>
                </div>
                {comparisonResult && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-blue-800 font-medium">
                      You selected: The selected property is worth {comparisonResult === 'more' ? 'more' : comparisonResult === 'same' ? 'about the same as' : 'less'} than the reference property.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareTab; 