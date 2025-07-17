import React, { useState } from 'react';
import { Home, ExternalLink, Save, Edit3 } from 'lucide-react';
import StarRating from './StarRating';

const DataEntry = ({ data, onDataUpdate }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Editable fields configuration
  const editableFields = [
    { key: 'Status Contractual', label: 'Status Contractual', type: 'text' },
    { key: 'Long Text', label: 'Long Text', type: 'textarea' },
    { key: 'Upgrades', label: 'Upgrades', type: 'textarea' },
    { key: 'Parking', label: 'Parking', type: 'text' },
    { key: 'BR up1', label: 'BR up1', type: 'number' },
    { key: 'FB up1', label: 'FB up1', type: 'number' },
    { key: 'Main Level BR', label: 'Main Level BR', type: 'number' },
    { key: 'Main Level Full Bath', label: 'Main Level Full Bath', type: 'number' },
    { key: 'Good Comp', label: 'Good Comp', type: 'select' },
    { key: 'Worth Comparison', label: 'Worth Comparison', type: 'select' }
  ];

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    setFormData({
      'Status Contractual': property['Status Contractual'] || '',
      'Long Text': property['Long Text'] || '',
      'Upgrades': property['Upgrades'] || '',
      'Parking': property['Parking'] || '',
      'BR up1': property['BR up1'] || '',
      'FB up1': property['FB up1'] || '',
      'Main Level BR': property['Main Level BR'] || '',
      'Main Level Full Bath': property['Main Level Full Bath'] || '',
      Rating: property.Rating || 0,
      'Good Comp': property['Good Comp'] || 'NO',
      'Worth Comparison': property['Worth Comparison'] || 'Not Set',
    });
    setIsEditing(false);
    setIframeLoaded(false);
    setIframeError(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, Rating: rating }));
    if (!isEditing) return;
  };

  const handleSave = () => {
    if (!selectedProperty) return;

    const updatedData = data.map(property => {
      if (property['MLS #'] === selectedProperty['MLS #']) {
        return {
          ...property,
          ...formData,
          Rating: formData.Rating || 0,
          'Good Comp': formData['Good Comp'] || 'NO',
          'Worth Comparison': formData['Worth Comparison'] || 'Not Set',
        };
      }
      return property;
    });

    onDataUpdate(updatedData);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
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
    
    return value.toString();
  };



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Data Entry
        </h2>
        <p className="text-gray-600">
          Select a property to view details and edit data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Property List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Properties
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.map((property, index) => (
                <div
                  key={property['MLS #']}
                  onClick={() => handlePropertySelect(property)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedProperty && selectedProperty['MLS #'] === property['MLS #']
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {property['Address']}
                  </div>
                  <div className="text-sm text-gray-600">
                    MLS: {property['MLS #']} • {property['Status']}
                  </div>
                                     <div className="text-sm text-gray-600">
                     {formatValue(property['List Price'], 'List Price')} • {property['Beds']} bed, {property['Baths']} bath
                   </div>
                   {property['Zillow Link'] && (
                     <div className="text-xs text-primary-600 mt-1">
                       <ExternalLink className="w-3 h-3 inline mr-1" />
                       Zillow available
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Property Details and Form */}
        {selectedProperty && (
          <div className="lg:col-span-3">
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedProperty['Address']}
                  </h3>
                  <p className="text-gray-600">
                    MLS: {selectedProperty['MLS #']} • {selectedProperty['Status']}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Zillow Preview */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Zillow Property Details
                  </h4>
                  {selectedProperty['Zillow Link'] ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                              <Home className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">Zillow Listing</h5>
                              <p className="text-sm text-gray-600">Property Information</p>
                            </div>
                          </div>
                          <a
                            href={selectedProperty['Zillow Link']}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary flex items-center gap-2 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on Zillow
                          </a>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Address</div>
                            <div className="font-medium text-gray-900">{selectedProperty['Address']}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">List Price</div>
                            <div className="font-medium text-gray-900">{formatValue(selectedProperty['List Price'], 'List Price')}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Square Feet</div>
                            <div className="font-medium text-gray-900">{formatValue(selectedProperty['Above Grade Finished SQFT'], 'Above Grade Finished SQFT')}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Price/SqFt</div>
                            <div className="font-medium text-gray-900">{formatValue(selectedProperty['Price/SqFt'], 'Price/SqFt')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                      <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No Zillow link available for this property</p>
                    </div>
                  )}
                </div>

                {/* Zillow iframe */}
                {selectedProperty['Zillow Link'] && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Zillow Live Preview
                    </h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {!iframeLoaded && !iframeError ? 'Loading Zillow page...' : 
                              iframeError ? 'Preview not available' : 'Zillow preview loaded'}
                          </span>
                          <a
                            href={selectedProperty['Zillow Link']}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Open in New Tab
                          </a>
                        </div>
                      </div>
                      <div className="relative">
                        {!iframeError ? (
                          <iframe
                            src={selectedProperty['Zillow Link']}
                            title="Zillow Property Preview"
                            className="w-full h-[600px]"
                            frameBorder="0"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                            onLoad={() => setIframeLoaded(true)}
                            onError={() => setIframeError(true)}
                          />
                        ) : (
                          <div className="h-[600px] bg-gray-50 flex items-center justify-center">
                            <div className="text-center p-6">
                              <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 mb-4">Zillow preview not available</p>
                              <p className="text-sm text-gray-500 mb-4">This may be due to Zillow's security policies</p>
                              <a
                                href={selectedProperty['Zillow Link']}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                              >
                                Open in Zillow
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Star Rating Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Property Rating
                  </h4>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Rate this property:</p>
                        <StarRating
                          value={formData.Rating || selectedProperty.Rating || 0}
                          onChange={isEditing ? handleRatingChange : undefined}
                          editable={isEditing}
                          size={24}
                        />
                      </div>
                      {!isEditing && (
                        <button
                          onClick={handleEdit}
                          className="btn-secondary flex items-center gap-2 text-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit Rating
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Entry Form */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Property Data
                  </h4>
                  <div className="space-y-4">
                    {/* First row - Status Contractual and Parking */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status Contractual
                        </label>
                        <input
                          type="text"
                          value={formData['Status Contractual'] || ''}
                          onChange={(e) => handleInputChange('Status Contractual', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter status contractual..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parking
                        </label>
                        <input
                          type="text"
                          value={formData['Parking'] || ''}
                          onChange={(e) => handleInputChange('Parking', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter parking..."
                        />
                      </div>
                    </div>

                    {/* Second row - BR up1, FB up1, Main Level BR, Main Level Full Bath */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BR up1
                        </label>
                        <input
                          type="number"
                          value={formData['BR up1'] || ''}
                          onChange={(e) => handleInputChange('BR up1', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          FB up1
                        </label>
                        <input
                          type="number"
                          value={formData['FB up1'] || ''}
                          onChange={(e) => handleInputChange('FB up1', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Main Level BR
                        </label>
                        <input
                          type="number"
                          value={formData['Main Level BR'] || ''}
                          onChange={(e) => handleInputChange('Main Level BR', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Main Level Full Bath
                        </label>
                        <input
                          type="number"
                          value={formData['Main Level Full Bath'] || ''}
                          onChange={(e) => handleInputChange('Main Level Full Bath', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Good Comp row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Good Comp
                        </label>
                        <select
                          value={formData['Good Comp'] || 'NO'}
                          onChange={(e) => handleInputChange('Good Comp', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                        >
                          <option value="NO">NO</option>
                          <option value="YES">YES</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Worth Comparison
                        </label>
                        <select
                          value={formData['Worth Comparison'] || 'Not Set'}
                          onChange={(e) => handleInputChange('Worth Comparison', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                        >
                          <option value="Not Set">Not Set</option>
                          <option value="Worth More">Worth More</option>
                          <option value="Worth Less">Worth Less</option>
                        </select>
                      </div>
                    </div>

                    {/* Third row - Long Text and Upgrades (full width) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Long Text
                        </label>
                        <textarea
                          value={formData['Long Text'] || ''}
                          onChange={(e) => handleInputChange('Long Text', e.target.value)}
                          disabled={!isEditing}
                          rows={4}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter long text..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upgrades
                        </label>
                        <textarea
                          value={formData['Upgrades'] || ''}
                          onChange={(e) => handleInputChange('Upgrades', e.target.value)}
                          disabled={!isEditing}
                          rows={4}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter upgrades..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Edit/Save Button - full width below property summary */}
                  <div className="mt-6">
                    {!isEditing && (
                      <button
                        onClick={handleEdit}
                        className="btn-secondary w-full flex items-center justify-center gap-2 text-lg py-3"
                      >
                        <Edit3 className="w-5 h-5" />
                        Edit
                      </button>
                    )}
                    {isEditing && (
                      <button
                        onClick={handleSave}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3"
                      >
                        <Save className="w-5 h-5" />
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Property Selected */}
        {!selectedProperty && (
          <div className="lg:col-span-3">
            <div className="card">
              <div className="text-center py-12">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Property
                </h3>
                <p className="text-gray-600">
                  Choose a property from the list to view details and edit data
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataEntry; 