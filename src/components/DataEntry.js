import React, { useState } from 'react';
import { Home, ExternalLink, Save, Edit3, ChevronUp, ChevronDown } from 'lucide-react';
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
    { key: 'Upper Level Bedrooms', label: 'Upper Level Bedrooms', type: 'number' },
    { key: 'Upper Level Full Baths', label: 'Upper Level Full Baths', type: 'number' },
    { key: 'Main Level Bedrooms', label: 'Main Level Bedrooms', type: 'number' },
    { key: 'Main Level Full Baths', label: 'Main Level Full Baths', type: 'number' },
    { key: 'Lower Level Bedrooms', label: 'Lower Level Bedrooms', type: 'number' },
    { key: 'Lower Level Full Baths', label: 'Lower Level Full Baths', type: 'number' },
    { key: 'KITCHEN', label: 'KITCHEN', type: 'text' },
    { key: 'EXTERIOR', label: 'EXTERIOR', type: 'text' },
    { key: 'PRIMARY BATHROOM', label: 'PRIMARY BATHROOM', type: 'text' },
    { key: 'Remarks', label: 'Remarks', type: 'text' },
    { key: 'Condition', label: 'Condition', type: 'text' },
    { key: 'GARAGE SPACES', label: 'Garage Spaces', type: 'number' },
    { key: 'BELOW GRADE SQFT', label: 'BELOW GRADE SQFT', type: 'number' },
    { key: 'Subdivision', label: 'Subdivision', type: 'text' },
    { key: 'LOT SQFT', label: 'LOT SQFT', type: 'number' },
    { key: 'Best Comp', label: 'Best Comp', type: 'select' },
    { key: 'Worth Comparison', label: 'Worth Comparison', type: 'select' }
  ];

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    setFormData({
      'Status Contractual': property['Status Contractual'] || '',
      'Long Text': property['Long Text'] || '',
      'Upgrades': property['Upgrades'] || '',
      'Parking': property['Parking'] || '',
      'Upper Level Bedrooms': property['Upper Level Bedrooms'] || '',
      'Upper Level Full Baths': property['Upper Level Full Baths'] || '',
      'Main Level Bedrooms': property['Main Level Bedrooms'] || '',
      'Main Level Full Baths': property['Main Level Full Baths'] || '',
      'Lower Level Bedrooms': property['Lower Level Bedrooms'] || '',
      'Lower Level Full Baths': property['Lower Level Full Baths'] || '',
      'KITCHEN': property['KITCHEN'] || '',
      'EXTERIOR': property['EXTERIOR'] || '',
      'PRIMARY BATHROOM': property['PRIMARY BATHROOM'] || '',
      'Remarks': property['Remarks'] || '',
      'Condition': property['Condition'] || '',
      'GARAGE SPACES': property['GARAGE SPACES'] || '',
      'BELOW GRADE SQFT': property['BELOW GRADE SQFT'] || '',
      'Subdivision': property['Subdivision'] || '',
      'LOT SQFT': property['LOT SQFT'] || '',
      Rating: property.Rating || 0,
      'Best Comp': property['Best Comp'] || 'NO',
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
          'Best Comp': formData['Best Comp'] || 'NO',
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
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
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
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Close Price</div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              {(() => {
                                const closePrice = parseFloat(selectedProperty['Close Price']);
                                const listPrice = parseFloat(selectedProperty['List Price']);
                                if (!isNaN(closePrice) && !isNaN(listPrice)) {
                                  if (closePrice > listPrice) {
                                    return <span className="text-green-700 font-semibold flex items-center gap-1">{formatValue(selectedProperty['Close Price'], 'Close Price')}<ChevronUp className="inline w-4 h-4 text-green-500" /></span>;
                                  } else if (closePrice < listPrice) {
                                    return <span className="text-red-700 font-semibold flex items-center gap-1">{formatValue(selectedProperty['Close Price'], 'Close Price')}<ChevronDown className="inline w-4 h-4 text-red-500" /></span>;
                                  }
                                }
                                return <span>{formatValue(selectedProperty['Close Price'], 'Close Price')}</span>;
                              })()}
                            </div>
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

                {/* Edit/Save Button - positioned above Property Rating */}
                <div className="mb-4">
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

                    {/* Second row - Upper Level Bedrooms, Upper Level Full Baths, Main Level Bedrooms, Main Level Full Baths */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upper Level Bedrooms
                        </label>
                        <input
                          type="number"
                          value={formData['Upper Level Bedrooms'] || ''}
                          onChange={(e) => handleInputChange('Upper Level Bedrooms', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upper Level Full Baths
                        </label>
                        <input
                          type="number"
                          value={formData['Upper Level Full Baths'] || ''}
                          onChange={(e) => handleInputChange('Upper Level Full Baths', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Main Level Bedrooms
                        </label>
                        <input
                          type="number"
                          value={formData['Main Level Bedrooms'] || ''}
                          onChange={(e) => handleInputChange('Main Level Bedrooms', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Main Level Full Baths
                        </label>
                        <input
                          type="number"
                          value={formData['Main Level Full Baths'] || ''}
                          onChange={(e) => handleInputChange('Main Level Full Baths', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Third row - Lower Level Bedrooms, Lower Level Full Baths, KITCHEN, EXTERIOR, PRIMARY BATHROOM, Remarks */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lower Level Bedrooms
                        </label>
                        <input
                          type="number"
                          value={formData['Lower Level Bedrooms'] || ''}
                          onChange={(e) => handleInputChange('Lower Level Bedrooms', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lower Level Full Baths
                        </label>
                        <input
                          type="number"
                          value={formData['Lower Level Full Baths'] || ''}
                          onChange={(e) => handleInputChange('Lower Level Full Baths', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          KITCHEN
                        </label>
                        <input
                          type="text"
                          value={formData['KITCHEN'] || ''}
                          onChange={(e) => handleInputChange('KITCHEN', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter kitchen details..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          EXTERIOR
                        </label>
                        <input
                          type="text"
                          value={formData['EXTERIOR'] || ''}
                          onChange={(e) => handleInputChange('EXTERIOR', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter exterior details..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PRIMARY BATHROOM
                        </label>
                        <input
                          type="text"
                          value={formData['PRIMARY BATHROOM'] || ''}
                          onChange={(e) => handleInputChange('PRIMARY BATHROOM', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter primary bathroom details..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks
                        </label>
                        <input
                          type="text"
                          value={formData['Remarks'] || ''}
                          onChange={(e) => handleInputChange('Remarks', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Yes/No"
                        />
                      </div>
                    </div>

                    {/* Fourth row - Condition, Attached Garage, Detached Garage */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condition
                        </label>
                        <input
                          type="text"
                          value={formData['Condition'] || ''}
                          onChange={(e) => handleInputChange('Condition', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter condition..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Garage Spaces
                        </label>
                        <input
                          type="number"
                          value={formData['GARAGE SPACES'] || ''}
                          onChange={(e) => handleInputChange('GARAGE SPACES', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BELOW GRADE SQFT
                        </label>
                        <input
                          type="number"
                          value={formData['BELOW GRADE SQFT'] || ''}
                          onChange={(e) => handleInputChange('BELOW GRADE SQFT', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subdivision
                        </label>
                        <input
                          type="text"
                          value={formData['Subdivision'] || ''}
                          onChange={(e) => handleInputChange('Subdivision', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="Enter subdivision..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LOT SQFT
                        </label>
                        <input
                          type="number"
                          value={formData['LOT SQFT'] || ''}
                          onChange={(e) => handleInputChange('LOT SQFT', e.target.value)}
                          disabled={!isEditing}
                          className={`input-field disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            !isEditing ? 'border-gray-300 border-dashed' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Best Comp, Worth Comparison, and Property Rating row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Best Comp
                        </label>
                        <select
                          value={formData['Best Comp'] || 'NO'}
                          onChange={(e) => handleInputChange('Best Comp', e.target.value)}
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
                          <option value="About the Same">About the Same</option>
                          <option value="Worth Less">Worth Less</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Rating
                        </label>
                        <div className="flex items-center h-10 px-3 py-2 border border-gray-300 rounded-md bg-white">
                          <StarRating
                            value={formData.Rating || selectedProperty.Rating || 0}
                            onChange={isEditing ? handleRatingChange : undefined}
                            editable={isEditing}
                            size={20}
                          />
                        </div>
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
