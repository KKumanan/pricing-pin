import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, ExternalLink, GripVertical, Settings, Eye, EyeOff, X, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({ data, onExport }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Column management state
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  
  // Horizontal scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableContainerRef = useRef(null);
  
  const [selectedColumns, setSelectedColumns] = useState([
    'Address', 'Status', 'List Price', 'Close Price', 
    'Above Grade Finished SQFT', 'Price/SqFt', 'LOT SQFT', 'Sq Ft Difference vs EXP', 'Lot Difference vs EXP',
    'Beds', 'Baths', 'Year Built', 'DOM'
  ]);

  // Get all available columns
  const allColumns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Get visible columns (excluding hidden ones)
  const visibleColumns = useMemo(() => {
    return selectedColumns.filter(column => !hiddenColumns.has(column));
  }, [selectedColumns, hiddenColumns]);

  // Check scroll position and update navigation buttons
  const checkScrollPosition = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Handle horizontal scroll navigation
  const handleScrollLeft = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollRight = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      // Initial check with a small delay to ensure table is rendered
      setTimeout(checkScrollPosition, 100);
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [visibleColumns]); // Re-check when visible columns change

  // Keyboard navigation for horizontal scrolling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowLeft' && canScrollLeft) {
        e.preventDefault();
        handleScrollLeft();
      } else if (e.key === 'ArrowRight' && canScrollRight) {
        e.preventDefault();
        handleScrollRight();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canScrollLeft, canScrollRight]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item =>
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
  }, [data, searchTerm, sortConfig]);

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

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-';
    
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

  if (data.length === 0) {
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
            onClick={() => setShowColumnManager(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Columns
          </button>
          
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
            onClick={() => onExport(filteredAndSortedData)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container" ref={tableContainerRef}>
        <table className="table">
          <thead>
            <tr>
              {visibleColumns.map(column => (
                <th
                  key={column}
                  className={`table-header cursor-pointer hover:bg-gray-100 transition-colors ${
                    column === 'Address' ? 'sticky left-0 bg-gray-50 z-20 shadow-sm' : ''
                  } ${
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
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="table-row">
                {visibleColumns.map(column => (
                  <td 
                    key={column} 
                    className={`table-cell ${
                      column === 'Address' ? 'sticky left-0 bg-white z-10 shadow-sm' : ''
                    }`}
                  >
                    {formatValue(row[column], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Horizontal Scroll Navigation */}
      {visibleColumns.length > 0 && (
        <div className="flex items-center justify-end mt-4 gap-2">
          <span className="text-sm text-gray-600 mr-2">Scroll:</span>
          <button
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            className="scroll-nav-button"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            className="scroll-nav-button"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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

export default DataTable; 