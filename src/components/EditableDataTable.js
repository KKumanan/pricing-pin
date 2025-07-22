import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, ExternalLink, Save, X, Star } from 'lucide-react';

const EditableDataTable = ({ data, onExport, onDataUpdate }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'Status', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  const [showEditableInfo, setShowEditableInfo] = useState(true);
  
  const [selectedColumns, setSelectedColumns] = useState([
    'Address', 'MLS #', 'Status', 'List Price', 'Close Price', 
    'Above Grade Finished SQFT', 'Price/SqFt', 'Sq Ft Difference vs EXP', 'Lot Difference vs EXP',
    'Beds', 'Baths', 'Year Built', 'Status Contractual', 'Long Text', 'Upgrades', 
    'Parking', 'Upper Level Bedrooms', 'Upper Level Full Baths', 'Main Level Bedrooms', 'Main Level Full Baths', 'Lower Level Bedrooms', 'Lower Level Full Baths',
    'Kitchen Exterior', '2 Story Family Room', 'Condition', 'Attached Garage Spaces', 'Detached Garage Spaces',
    'Rating', 'Good Comp', 'Worth Comparison'
  ]);

  // Editable fields configuration
  const editableFields = [
    'Status Contractual', 'Long Text', 'Upgrades', 'Parking', 
    'Upper Level Bedrooms', 'Upper Level Full Baths', 'Main Level Bedrooms', 'Main Level Full Baths', 'Lower Level Bedrooms', 'Lower Level Full Baths',
    'Kitchen Exterior', '2 Story Family Room', 'Condition', 'Attached Garage Spaces', 'Detached Garage Spaces',
    'Rating', 'Good Comp', 'Worth Comparison'
  ];

  // Update local data when props change
  React.useEffect(() => {
    // Ensure every row has default values for Rating, Good Comp, Worth Comparison, and new fields
    const dataWithDefaults = data.map(row => ({
      ...row,
      Rating: row.Rating === undefined || row.Rating === null ? 0 : row.Rating,
      'Good Comp': row['Good Comp'] === undefined || row['Good Comp'] === null ? 'NO' : row['Good Comp'],
      'Worth Comparison': row['Worth Comparison'] === undefined || row['Worth Comparison'] === null ? 'Not Set' : row['Worth Comparison'],
      'Upper Level Bedrooms': row['Upper Level Bedrooms'] === undefined || row['Upper Level Bedrooms'] === null ? '' : row['Upper Level Bedrooms'],
      'Upper Level Full Baths': row['Upper Level Full Baths'] === undefined || row['Upper Level Full Baths'] === null ? '' : row['Upper Level Full Baths'],
      'Main Level Bedrooms': row['Main Level Bedrooms'] === undefined || row['Main Level Bedrooms'] === null ? '' : row['Main Level Bedrooms'],
      'Main Level Full Baths': row['Main Level Full Baths'] === undefined || row['Main Level Full Baths'] === null ? '' : row['Main Level Full Baths'],
      'Lower Level Bedrooms': row['Lower Level Bedrooms'] === undefined || row['Lower Level Bedrooms'] === null ? '' : row['Lower Level Bedrooms'],
      'Lower Level Full Baths': row['Lower Level Full Baths'] === undefined || row['Lower Level Full Baths'] === null ? '' : row['Lower Level Full Baths'],
      'Kitchen Exterior': row['Kitchen Exterior'] === undefined || row['Kitchen Exterior'] === null ? '' : row['Kitchen Exterior'],
      '2 Story Family Room': row['2 Story Family Room'] === undefined || row['2 Story Family Room'] === null ? '' : row['2 Story Family Room'],
      'Condition': row['Condition'] === undefined || row['Condition'] === null ? '' : row['Condition'],
      'Attached Garage Spaces': row['Attached Garage Spaces'] === undefined || row['Attached Garage Spaces'] === null ? '' : row['Attached Garage Spaces'],
      'Detached Garage Spaces': row['Detached Garage Spaces'] === undefined || row['Detached Garage Spaces'] === null ? '' : row['Detached Garage Spaces']
    }));
    setLocalData(dataWithDefaults);
  }, [data]);

  // Get all available columns
  const allColumns = useMemo(() => {
    if (localData.length === 0) return [];
    return Object.keys(localData[0]);
  }, [localData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = localData.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        // Special handling for Status column
        if (sortConfig.key === 'Status') {
          const statusOrder = { 'EXP': 1, 'CLS': 2, 'ACT': 3, 'PND': 4 };
          const aOrder = statusOrder[aVal] || 5; // Any other status goes last
          const bOrder = statusOrder[bVal] || 5;
          
          if (sortConfig.direction === 'asc') {
            return aOrder - bOrder;
          } else {
            return bOrder - aOrder;
          }
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = aVal.toString().toLowerCase();
        const bStr = bVal.toString().toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [localData, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const startEditing = (rowIndex, column, value) => {
    if (!editableFields.includes(column)) return;
    
    setEditingCell({ rowIndex, column });
    setEditValue(value || '');
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { rowIndex, column } = editingCell;
    const actualRowIndex = (currentPage - 1) * itemsPerPage + rowIndex;
    const updatedData = [...localData];
    
    // Find the actual row in the original data
    const rowToUpdate = filteredAndSortedData[actualRowIndex];
    const originalIndex = localData.findIndex(row => row['MLS #'] === rowToUpdate['MLS #']);
    
    if (originalIndex !== -1) {
      updatedData[originalIndex] = {
        ...updatedData[originalIndex],
        [column]: editValue
      };
      
      setLocalData(updatedData);
      if (onDataUpdate) {
        onDataUpdate(updatedData);
      }
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleRatingChange = (rowIndex, newRating) => {
    console.log('Rating change requested:', newRating, 'for row:', rowIndex);
    const actualRowIndex = (currentPage - 1) * itemsPerPage + rowIndex;
    const updatedData = [...localData];
    
    // Find the actual row in the original data
    const rowToUpdate = filteredAndSortedData[actualRowIndex];
    const originalIndex = localData.findIndex(row => row['MLS #'] === rowToUpdate['MLS #']);
    
    if (originalIndex !== -1) {
      updatedData[originalIndex] = {
        ...updatedData[originalIndex],
        Rating: newRating
      };
      
      setLocalData(updatedData);
      if (onDataUpdate) {
        onDataUpdate(updatedData);
      }
      console.log('Rating updated successfully');
    }
  };

  // Simple inline star rating component
  const TableStarRating = ({ value, onChange, rowIndex }) => {
    return (
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none hover:scale-110 transition-transform duration-150"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Star clicked:', star, 'for row:', rowIndex);
              onChange(star);
            }}
            style={{ background: 'none', border: 'none', padding: '1px' }}
          >
            <Star
              className={
                star <= value
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }
              size={16}
              fill={star <= value ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatValue = (value, key, rowIndex) => {
    if (value === null || value === undefined) return '-';
    
    // Check if this cell is being edited
    const isEditing = editingCell && editingCell.rowIndex === rowIndex && editingCell.column === key;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={saveEdit}
            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
            autoFocus
          />
          <button
            onClick={saveEdit}
            className="p-1 text-green-600 hover:text-green-700"
            title="Save"
          >
            <Save className="w-3 h-3" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 text-red-600 hover:text-red-700"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }
    
    // Make Address a hyperlink to Zillow
    if (key === 'Address' && typeof value === 'string') {
      const zillowLink = data.find(row => row['Address'] === value)?.['Zillow Link'];
      if (zillowLink) {
        return (
          <a 
            href={zillowLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 underline font-medium"
          >
            {value}
          </a>
        );
      }
    }
    
    // Custom Close Price indicator logic (must come before generic price formatting)
    if (key === 'Close Price') {
      // Find the corresponding List Price for this row
      const row = paginatedData[rowIndex];
      const closePrice = parseFloat(row['Close Price']);
      const listPrice = parseFloat(row['List Price']);
      if (!isNaN(closePrice) && !isNaN(listPrice)) {
        if (closePrice > listPrice) {
          return (
            <span className="text-green-700 font-semibold flex items-center gap-1">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(closePrice)}
              <ChevronUp className="inline w-4 h-4 text-green-500" />
            </span>
          );
        } else if (closePrice < listPrice) {
          return (
            <span className="text-red-700 font-semibold flex items-center gap-1">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(closePrice)}
              <ChevronDown className="inline w-4 h-4 text-red-500" />
            </span>
          );
        }
      }
      // If equal or not a number, show normal
      return <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}</span>;
    }

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
    
    if (key.includes('Difference') && typeof value === 'number') {
      const formatted = new Intl.NumberFormat('en-US').format(Math.abs(value));
      return value >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    
    if (key.includes('%') && typeof value === 'number') {
      return `${value}%`;
    }
    
    // Special handling for Rating column
    if (key === 'Rating') {
      return (
        <div className="flex items-center justify-center py-2">
          <TableStarRating
            value={value || 0}
            onChange={(newRating) => handleRatingChange(rowIndex, newRating)}
            rowIndex={rowIndex}
          />
        </div>
      );
    }
    
    // Special handling for Good Comp column
    if (key === 'Good Comp') {
      const isGoodComp = value === 'YES' || value === true || value === 'yes';
      return (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isGoodComp 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newValue = isGoodComp ? 'NO' : 'YES';
              const actualRowIndex = (currentPage - 1) * itemsPerPage + rowIndex;
              const updatedData = [...localData];
              
              // Find the actual row in the original data
              const rowToUpdate = filteredAndSortedData[actualRowIndex];
              const originalIndex = localData.findIndex(row => row['MLS #'] === rowToUpdate['MLS #']);
              
              if (originalIndex !== -1) {
                updatedData[originalIndex] = {
                  ...updatedData[originalIndex],
                  'Good Comp': newValue
                };
                
                setLocalData(updatedData);
                if (onDataUpdate) {
                  onDataUpdate(updatedData);
                }
              }
            }}
          >
            {isGoodComp ? 'YES' : 'NO'}
          </button>
        </div>
      );
    }

    // Special handling for Worth Comparison column
    if (key === 'Worth Comparison') {
      const getWorthComparisonColor = (worthValue) => {
        switch (worthValue) {
          case 'Worth More':
            return 'bg-green-100 text-green-800 hover:bg-green-200';
          case 'Worth Less':
            return 'bg-red-100 text-red-800 hover:bg-red-200';
          default:
            return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
        }
      };

      const cycleWorthComparison = (currentValue) => {
        switch (currentValue) {
          case 'Not Set':
            return 'Worth More';
          case 'Worth More':
            return 'Worth Less';
          case 'Worth Less':
            return 'Not Set';
          default:
            return 'Not Set';
        }
      };

      return (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${getWorthComparisonColor(value)}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newValue = cycleWorthComparison(value);
              const actualRowIndex = (currentPage - 1) * itemsPerPage + rowIndex;
              const updatedData = [...localData];
              
              // Find the actual row in the original data
              const rowToUpdate = filteredAndSortedData[actualRowIndex];
              const originalIndex = localData.findIndex(row => row['MLS #'] === rowToUpdate['MLS #']);
              
              if (originalIndex !== -1) {
                updatedData[originalIndex] = {
                  ...updatedData[originalIndex],
                  'Worth Comparison': newValue
                };
                
                setLocalData(updatedData);
                if (onDataUpdate) {
                  onDataUpdate(updatedData);
                }
              }
            }}
          >
            {value || 'Not Set'}
          </button>
        </div>
      );
    }
    
    // For editable fields, make them clickable
    if (editableFields.includes(key)) {
      return (
        <div 
          className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border ${
            value ? 'border-gray-200' : 'border-gray-300 border-dashed'
          }`}
          onClick={() => startEditing(rowIndex, key, value)}
          title="Click to edit"
        >
          {value || ''}
        </div>
      );
    }
    
    return value.toString();
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  if (localData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
          
          <button
            onClick={() => onExport(localData)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
          Export All Data
          </button>
      </div>

      {/* Editable Fields Info */}
      {showEditableInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
          <button
            className="absolute top-2 right-2 text-blue-700 hover:text-blue-900"
            onClick={() => setShowEditableInfo(false)}
            aria-label="Close info box"
          >
            <X className="w-4 h-4" />
          </button>
        <h3 className="text-sm font-medium text-blue-900 mb-2">Editable Fields</h3>
        <p className="text-sm text-blue-700 mb-2">
            Click on any cell in these columns to edit: <strong>Status Contractual, Long Text, Upgrades, Parking, Upper Level Bedrooms, Upper Level Full Baths, Main Level Bedrooms, Main Level Full Baths, Lower Level Bedrooms, Lower Level Full Baths, Kitchen Exterior, 2 Story Family Room, Condition, Attached Garage Spaces, Detached Garage Spaces</strong>
          </p>
          <p className="text-sm text-blue-700 mb-2">
            Click on stars in the <strong>Rating</strong> column to rate properties
          </p>
          <p className="text-sm text-blue-700 mb-2">
            Click on <strong>Good Comp</strong> buttons to toggle between YES/NO
          </p>
          <p className="text-sm text-blue-700 mb-2">
            Click on <strong>Worth Comparison</strong> buttons to cycle through Not Set → Worth More → Worth Less
        </p>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <div className="w-4 h-4 border border-gray-300 border-dashed rounded"></div>
          <span>Empty editable field</span>
          <div className="w-4 h-4 border border-gray-200 rounded ml-4"></div>
          <span>Field with data</span>
        </div>
      </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {selectedColumns.map(column => {
                                  const getColumnWidth = (col) => {
                    if (col === 'Address') return 'sticky left-0 bg-gray-50 z-20 shadow-sm min-w-[200px]';
                    if (col === 'Long Text') return 'min-w-[250px]';
                    if (col === 'Upgrades') return 'min-w-[200px]';
                    if (col === 'Upper Level Bedrooms' || col === 'Upper Level Full Baths' || col === 'Main Level Bedrooms' || col === 'Main Level Full Baths') return 'min-w-[150px]';
                    if (col === 'Lower Level Bedrooms' || col === 'Lower Level Full Baths') return 'min-w-[150px]';
                    if (col === 'Kitchen Exterior' || col === '2 Story Family Room') return 'min-w-[140px]';
                    if (col === 'Condition') return 'min-w-[120px]';
                    if (col === 'Attached Garage Spaces' || col === 'Detached Garage Spaces') return 'min-w-[160px]';
                    if (col === 'Rating' || col === 'Good Comp' || col === 'Worth Comparison') return 'min-w-[120px]';
                    return '';
                  };
                
                return (
                <th
                  key={column}
                    className={`table-header cursor-pointer hover:bg-gray-100 transition-colors ${getColumnWidth(column)}`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column}
                    {getSortIcon(column)}
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => {
              const isSellerHome = row['Status'] === 'EXP';
              return (
                <tr 
                  key={rowIndex} 
                  className={`table-row ${
                    isSellerHome 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {selectedColumns.map(column => {
                    const getColumnWidth = (col) => {
                      if (col === 'Address') return `sticky left-0 z-10 shadow-sm ${
                        isSellerHome ? 'bg-blue-50' : 'bg-white'
                      } min-w-[200px]`;
                      if (col === 'Long Text') return 'min-w-[250px]';
                      if (col === 'Upgrades') return 'min-w-[200px]';
                      if (col === 'Upper Level Bedrooms' || col === 'Upper Level Full Baths' || col === 'Main Level Bedrooms' || col === 'Main Level Full Baths') return 'min-w-[150px]';
                      if (col === 'Lower Level Bedrooms' || col === 'Lower Level Full Baths') return 'min-w-[150px]';
                      if (col === 'Kitchen Exterior' || col === '2 Story Family Room') return 'min-w-[140px]';
                      if (col === 'Condition') return 'min-w-[120px]';
                      if (col === 'Attached Garage Spaces' || col === 'Detached Garage Spaces') return 'min-w-[160px]';
                      if (col === 'Rating' || col === 'Good Comp' || col === 'Worth Comparison') return 'min-w-[120px]';
                      return '';
                    };
                    
                    return (
                  <td 
                    key={column} 
                        className={`table-cell ${getColumnWidth(column)} ${
                          column === 'Rating' ? 'relative pointer-events-auto' : ''
                    }`}
                        onClick={(e) => {
                          if (column === 'Rating') {
                            e.stopPropagation();
                          }
                        }}
                  >
                    {formatValue(row[column], column, rowIndex)}
                  </td>
                    );
                  })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} results
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="flex items-center px-3 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableDataTable; 