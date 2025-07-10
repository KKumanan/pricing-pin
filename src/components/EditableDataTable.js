import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, ExternalLink, Save, X } from 'lucide-react';

const EditableDataTable = ({ data, onExport, onDataUpdate }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  
  const [selectedColumns, setSelectedColumns] = useState([
    'Address', 'MLS #', 'Status', 'List Price', 'Close Price', 
    'Above Grade Finished SQFT', 'Price/SqFt', 'Sq Ft Difference vs EXP', 'Lot Difference vs EXP',
    'Beds', 'Baths', 'Year Built', 'Status Contractual', 'Long Text', 'Upgrades', 
    'Parking', 'BR up1', 'FB up1', 'Main Level BR', 'Main Level Full Bath'
  ]);

  // Editable fields configuration
  const editableFields = [
    'Status Contractual', 'Long Text', 'Upgrades', 'Parking', 
    'BR up1', 'FB up1', 'Main Level BR', 'Main Level Full Bath'
  ];

  // Update local data when props change
  React.useEffect(() => {
    setLocalData(data);
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
        
        <div className="flex gap-2">
          <select
            value={selectedColumns.join(',')}
            onChange={(e) => setSelectedColumns(e.target.value.split(','))}
            className="input-field max-w-xs"
          >
            {allColumns.map(column => (
              <option key={column} value={[column]}>
                {column}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => onExport(localData)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Editable Fields Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Editable Fields</h3>
        <p className="text-sm text-blue-700 mb-2">
          Click on any cell in these columns to edit: <strong>Status Contractual, Long Text, Upgrades, Parking, BR up1, FB up1, Main Level BR, Main Level Full Bath</strong>
        </p>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <div className="w-4 h-4 border border-gray-300 border-dashed rounded"></div>
          <span>Empty editable field</span>
          <div className="w-4 h-4 border border-gray-200 rounded ml-4"></div>
          <span>Field with data</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {selectedColumns.map(column => (
                <th
                  key={column}
                  className={`table-header cursor-pointer hover:bg-gray-100 transition-colors ${
                    column === 'Address' ? 'sticky left-0 bg-gray-50 z-20 shadow-sm' : ''
                  }`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="table-row">
                {selectedColumns.map(column => (
                  <td 
                    key={column} 
                    className={`table-cell ${
                      column === 'Address' ? 'sticky left-0 bg-white z-10 shadow-sm' : ''
                    }`}
                  >
                    {formatValue(row[column], column, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
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