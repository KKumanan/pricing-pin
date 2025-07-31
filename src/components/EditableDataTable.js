import React, { useState, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, ExternalLink, Save, X, Star, GripVertical, Trash2, AlertTriangle, Settings, Eye, EyeOff } from 'lucide-react';

const EditableDataTable = ({ data, onExport, onDataUpdate, starredPropertyId, onStarProperty }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'Status', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  const [showEditableInfo, setShowEditableInfo] = useState(true);
  
  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Row deletion state
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
  const [rowsToDelete, setRowsToDelete] = useState([]);
  
  // Column management state
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [goodCompFilter, setGoodCompFilter] = useState('ALL'); // 'ALL', 'YES', 'NO'
  const [statusFilter, setStatusFilter] = useState(new Set()); // Set of statuses to exclude
  
  const [selectedColumns, setSelectedColumns] = useState([
    'Address', 'Status', 'List Price', 'Close Price', 'Worth Comparison',
    'Above Grade Finished SQFT', 'Price/SqFt', 'LOT SQFT', 'Sq Ft Difference vs EXP', 'Lot Difference vs EXP',
    'Beds', 'Baths', 'Year Built', 'DOM', 'Status Contractual', 'Long Text', 'Upgrades', 
    'Parking', 'Upper Level Bedrooms', 'Upper Level Full Baths', 'Main Level Bedrooms', 'Main Level Full Baths', 'Lower Level Bedrooms', 'Lower Level Full Baths',
    'KITCHEN', 'EXTERIOR', 'PRIMARY BATHROOM', '2 Story Family Room', 'Condition', 'GARAGE SPACES', 'BELOW GRADE SQFT', 'SUBDIVISION',
    'Rating', 'Good Comp'
  ]);

  // Editable fields configuration
  const editableFields = [
    'Status Contractual', 'Long Text', 'Upgrades', 'Parking', 
    'Upper Level Bedrooms', 'Upper Level Full Baths', 'Main Level Bedrooms', 'Main Level Full Baths', 'Lower Level Bedrooms', 'Lower Level Full Baths',
    'KITCHEN', 'EXTERIOR', 'PRIMARY BATHROOM', '2 Story Family Room', 'Condition', 'GARAGE SPACES', 'BELOW GRADE SQFT', 'SUBDIVISION', 'LOT SQFT',
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
      'KITCHEN': row['KITCHEN'] === undefined || row['KITCHEN'] === null ? '' : row['KITCHEN'],
      'EXTERIOR': row['EXTERIOR'] === undefined || row['EXTERIOR'] === null ? '' : row['EXTERIOR'],
      'PRIMARY BATHROOM': row['PRIMARY BATHROOM'] === undefined || row['PRIMARY BATHROOM'] === null ? '' : row['PRIMARY BATHROOM'],
      '2 Story Family Room': row['2 Story Family Room'] === undefined || row['2 Story Family Room'] === null ? '' : row['2 Story Family Room'],
      'Condition': row['Condition'] === undefined || row['Condition'] === null ? '' : row['Condition'],
      'GARAGE SPACES': row['GARAGE SPACES'] === undefined || row['GARAGE SPACES'] === null ? '' : row['GARAGE SPACES'],
      'BELOW GRADE SQFT': row['BELOW GRADE SQFT'] === undefined || row['BELOW GRADE SQFT'] === null ? '' : row['BELOW GRADE SQFT'],
      'SUBDIVISION': row['SUBDIVISION'] === undefined || row['SUBDIVISION'] === null ? '' : row['SUBDIVISION'],
      'LOT SQFT': row['LOT SQFT'] === undefined || row['LOT SQFT'] === null ? '' : row['LOT SQFT']
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
    let filtered = localData.filter(item => {
      // Search term filter
      const matchesSearch = Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Good Comp filter
      const matchesGoodComp = goodCompFilter === 'ALL' || 
        (goodCompFilter === 'YES' && item['Good Comp'] === 'YES') ||
        (goodCompFilter === 'NO' && item['Good Comp'] === 'NO');
      
      // Status filter (exclude selected statuses)
      const matchesStatus = !statusFilter.has(item['Status']);
      
      return matchesSearch && matchesGoodComp && matchesStatus;
    });

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
  }, [localData, searchTerm, sortConfig, goodCompFilter, statusFilter]);

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

  // Drag and drop handlers
  const handleDragStart = (e, column) => {
    setDraggedColumn(column);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', column);
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (column !== draggedColumn) {
      setDragOverColumn(column);
    }
  };

  const handleDragEnter = (e, column) => {
    e.preventDefault();
    if (column !== draggedColumn) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    if (draggedColumn && targetColumn && draggedColumn !== targetColumn) {
      const newColumns = [...selectedColumns];
      const draggedIndex = newColumns.indexOf(draggedColumn);
      const targetIndex = newColumns.indexOf(targetColumn);
      
      // Remove dragged column from its current position
      newColumns.splice(draggedIndex, 1);
      // Insert dragged column at target position
      newColumns.splice(targetIndex, 0, draggedColumn);
      
      setSelectedColumns(newColumns);
    }
    setDraggedColumn(null);
    setDragOverColumn(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
    setIsDragging(false);
  };

  // Row deletion handlers
  const handleRowSelect = (rowIndex) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowIndex)) {
      newSelectedRows.delete(rowIndex);
    } else {
      newSelectedRows.add(rowIndex);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, index) => index)));
    }
  };

  const handleDeleteSelected = () => {
    const selectedData = Array.from(selectedRows).map(index => paginatedData[index]);
    setRowsToDelete(selectedData);
    setShowDeleteConfirm(true);
    setDeleteConfirmStep(1);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
    } else {
      // Final confirmation - delete the rows
      const rowsToDeleteIndexes = rowsToDelete.map(row => 
        localData.findIndex(item => item['Address'] === row['Address'])
      );
      
      const newData = localData.filter((_, index) => !rowsToDeleteIndexes.includes(index));
      setLocalData(newData);
      onDataUpdate(newData);
      
      // Reset state
      setSelectedRows(new Set());
      setShowDeleteConfirm(false);
      setDeleteConfirmStep(1);
      setRowsToDelete([]);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmStep(1);
    setRowsToDelete([]);
  };

  // Column management handlers
  const handleToggleColumn = (column) => {
    const newHiddenColumns = new Set(hiddenColumns);
    if (newHiddenColumns.has(column)) {
      newHiddenColumns.delete(column);
    } else {
      newHiddenColumns.add(column);
    }
    setHiddenColumns(newHiddenColumns);
  };

  const handleShowAllColumns = () => {
    setHiddenColumns(new Set());
  };

  const handleHideAllColumns = () => {
    setHiddenColumns(new Set(allColumns));
  };

  // Filter handlers
  const handleGoodCompFilterChange = (value) => {
    setGoodCompFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleStatusFilterToggle = (status) => {
    const newStatusFilter = new Set(statusFilter);
    if (newStatusFilter.has(status)) {
      newStatusFilter.delete(status);
    } else {
      newStatusFilter.add(status);
    }
    setStatusFilter(newStatusFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setGoodCompFilter('ALL');
    setStatusFilter(new Set());
    setCurrentPage(1);
  };

  // Get unique statuses for filter options
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    localData.forEach(item => {
      if (item['Status']) {
        statuses.add(item['Status']);
      }
    });
    return Array.from(statuses).sort();
  }, [localData]);

  // Get visible columns (excluding hidden ones)
  const visibleColumns = useMemo(() => {
    return selectedColumns.filter(column => !hiddenColumns.has(column));
  }, [selectedColumns, hiddenColumns]);

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
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={saveEdit}
          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
          autoFocus
        />
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
    
    if (key.includes('Lot') && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    if (key === 'LOT SQFT' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    if (key === 'BELOW GRADE SQFT' && typeof value === 'number') {
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
          case 'About the Same':
            return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
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
            return 'About the Same';
          case 'About the Same':
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

  const getDisplayName = (columnName) => {
    const displayNames = {
      'Sq Ft Difference vs EXP': 'SQFT DIFFERENCE',
      'Lot Difference vs EXP': 'LOT SQFT DIFFERENCE',
      'LOT SQFT': 'LOT SQFT',
      'BELOW GRADE SQFT': 'BELOW GRADE SQFT',
      'SUBDIVISION': 'SUBDIVISION',
    };
    return displayNames[columnName] || columnName;
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
        <div className="relative flex-1">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(goodCompFilter !== 'ALL' || statusFilter.size > 0) && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                {(goodCompFilter !== 'ALL' ? 1 : 0) + statusFilter.size}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowColumnManager(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Columns
          </button>
          
          {selectedRows.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedRows.size})
            </button>
          )}
          
          <button
            onClick={() => onExport(localData)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All Data
          </button>
        </div>
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
              Click on <strong>Worth Comparison</strong> buttons to cycle through Not Set → Worth More → About the Same → Worth Less
            </p>
            <p className="text-sm text-blue-700 mb-2">
              Click the <strong>star icon</strong> next to any property to set it as the reference property for comparisons
            </p>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <div className="w-4 h-4 border border-gray-300 border-dashed rounded"></div>
          <span>Empty editable field</span>
          <div className="w-4 h-4 border border-gray-200 rounded ml-4"></div>
          <span>Field with data</span>
        </div>
      </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Good Comp Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Good Comp Filter
              </label>
              <select
                value={goodCompFilter}
                onChange={(e) => handleGoodCompFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">Show All</option>
                <option value="YES">Show Only YES</option>
                <option value="NO">Show Only NO</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclude Status
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueStatuses.map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={statusFilter.has(status)}
                      onChange={() => handleStatusFilterToggle(status)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredAndSortedData.length} of {localData.length} properties
              {goodCompFilter !== 'ALL' && ` (Good Comp: ${goodCompFilter})`}
              {statusFilter.size > 0 && ` (Excluding: ${Array.from(statusFilter).join(', ')})`}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {/* Checkbox column for row selection */}
              <th className="table-header w-12 px-4 py-3">
                <div className="flex items-center justify-center">
                  <Star className="w-4 h-4 text-gray-400" />
                </div>
              </th>
              <th className="table-header w-12 px-4 py-3">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                </div>
              </th>
              {visibleColumns.map(column => {
                                  const getColumnWidth = (col) => {
                    if (col === 'Address') return 'sticky left-0 bg-gray-50 z-20 shadow-sm min-w-[180px]';
                    if (col === 'Long Text') return 'min-w-[200px]';
                    if (col === 'Upgrades') return 'min-w-[180px]';
                                          if (col === 'Upper Level Bedrooms' || col === 'Upper Level Full Baths' || col === 'Main Level Bedrooms' || col === 'Main Level Full Baths') return 'min-w-[130px]';
                      if (col === 'Lower Level Bedrooms' || col === 'Lower Level Full Baths') return 'min-w-[130px]';
                      if (col === 'KITCHEN' || col === 'EXTERIOR' || col === 'PRIMARY BATHROOM' || col === '2 Story Family Room') return 'min-w-[120px]';
                      if (col === 'Condition') return 'min-w-[100px]';
                    if (col === 'GARAGE SPACES') return 'min-w-[140px]';
                    if (col === 'BELOW GRADE SQFT') return 'min-w-[140px]';
                    if (col === 'SUBDIVISION') return 'min-w-[160px]';
                    if (col === 'Rating' || col === 'Good Comp' || col === 'Worth Comparison') return 'min-w-[100px]';
                    return '';
                  };
                
                return (
                <th
                  key={column}
                  className={`table-header cursor-pointer hover:bg-gray-100 transition-colors ${getColumnWidth(column)} ${
                    draggedColumn === column ? 'opacity-50' : ''
                  } ${
                    dragOverColumn === column ? 'bg-blue-100 border-l-2 border-blue-500' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, column)}
                  onDragOver={(e) => handleDragOver(e, column)}
                  onDragEnter={(e) => handleDragEnter(e, column)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-gray-400 cursor-grab hover:text-gray-600 mr-1" />
                    {getDisplayName(column)}
                    {getSortIcon(column)}
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => {
              const isStarredProperty = starredPropertyId === row['MLS #'];
              return (
                <tr 
                  key={rowIndex} 
                  className={`table-row ${
                    isStarredProperty 
                      ? 'bg-yellow-50 border-l-4 border-l-yellow-500 hover:bg-yellow-100' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Star cell for reference property */}
                  <td className="table-cell w-12 px-4 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onStarProperty && onStarProperty(row['MLS #'])}
                        className={`p-1 rounded-full transition-colors ${
                          starredPropertyId === row['MLS #']
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                        title={starredPropertyId === row['MLS #'] ? 'Remove as Reference Property' : 'Set as Reference Property'}
                      >
                        <Star className={`w-4 h-4 ${starredPropertyId === row['MLS #'] ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </td>
                  {/* Checkbox cell for row selection */}
                  <td className="table-cell w-12 px-4 py-3">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => handleRowSelect(rowIndex)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                    </div>
                  </td>
                  {visibleColumns.map(column => {
                    const getColumnWidth = (col) => {
                      if (col === 'Address') return `sticky left-0 z-10 shadow-sm ${
                        isStarredProperty ? 'bg-yellow-50' : 'bg-white'
                      } min-w-[180px]`;
                      if (col === 'Long Text') return 'min-w-[200px]';
                      if (col === 'Upgrades') return 'min-w-[180px]';
                      if (col === 'Upper Level Bedrooms' || col === 'Upper Level Full Baths' || col === 'Main Level Bedrooms' || col === 'Main Level Full Baths') return 'min-w-[130px]';
                      if (col === 'Lower Level Bedrooms' || col === 'Lower Level Full Baths') return 'min-w-[130px]';
                      if (col === 'KITCHEN' || col === 'EXTERIOR' || col === 'PRIMARY BATHROOM' || col === '2 Story Family Room') return 'min-w-[120px]';
                      if (col === 'Condition') return 'min-w-[100px]';
                      if (col === 'GARAGE SPACES') return 'min-w-[140px]';
                      if (col === 'BELOW GRADE SQFT') return 'min-w-[140px]';
                      if (col === 'SUBDIVISION') return 'min-w-[160px]';
                      if (col === 'Rating' || col === 'Good Comp' || col === 'Worth Comparison') return 'min-w-[100px]';
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {deleteConfirmStep === 1 ? 'Confirm Deletion' : 'Final Confirmation'}
                </h3>
                <p className="text-sm text-gray-500">
                  {deleteConfirmStep === 1 
                    ? `Are you sure you want to delete ${rowsToDelete.length} selected row${rowsToDelete.length > 1 ? 's' : ''}?`
                    : 'This action cannot be undone. Are you absolutely sure?'
                  }
                </p>
              </div>
            </div>
            
            {deleteConfirmStep === 1 && (
              <div className="mb-4 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected properties:</p>
                {rowsToDelete.map((row, index) => (
                  <div key={index} className="text-sm text-gray-600 py-1 border-b border-gray-100">
                    {row['Address'] || `Property ${index + 1}`}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`btn-danger ${deleteConfirmStep === 2 ? 'bg-red-700 hover:bg-red-800' : ''}`}
              >
                {deleteConfirmStep === 1 ? 'Delete' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Management Modal */}
      {showColumnManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Column Management</h3>
              <button
                onClick={() => setShowColumnManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleShowAllColumns}
                  className="btn-secondary text-sm"
                >
                  Show All
                </button>
                <button
                  onClick={handleHideAllColumns}
                  className="btn-secondary text-sm"
                >
                  Hide All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allColumns.map(column => (
                  <div
                    key={column}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      hiddenColumns.has(column)
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleColumn(column)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {hiddenColumns.has(column) ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-600" />
                      )}
                      <span className={`text-sm ${
                        hiddenColumns.has(column) ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {getDisplayName(column)}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {visibleColumns.length} of {allColumns.length} columns visible
              </div>
              <button
                onClick={() => setShowColumnManager(false)}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-base text-gray-700">
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
            
            <span className="flex items-center px-3 py-2 text-base text-gray-700">
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