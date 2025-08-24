import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, ExternalLink, Save, X, Star, GripVertical, Trash2, AlertTriangle, Settings, Eye, EyeOff, Plus, ChevronLeft, ChevronRight, Link } from 'lucide-react';
import { generateZillowLink } from '../utils/csvProcessor';

const EditableDataTable = ({ data, onExport, onDataUpdate, starredPropertyId, onStarProperty }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  const [showEditableInfo, setShowEditableInfo] = useState(true);
  
  // Zillow link update state
  const [showZillowModal, setShowZillowModal] = useState(false);
  const [selectedRowForZillow, setSelectedRowForZillow] = useState(null);
  const [zillowLinkInput, setZillowLinkInput] = useState('');
  
  // Bulk edit missing values state
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditColumn, setBulkEditColumn] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [bulkEditRows, setBulkEditRows] = useState([]);
  
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
  
  // Horizontal scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showScrollNav, setShowScrollNav] = useState(true);
  const tableContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  
  const [selectedColumns, setSelectedColumns] = useState([
    'Address', 'Status', 'List Price', 'Close Price', 'Worth Comparison',
    'Above Grade Finished SQFT', 'Price/SqFt', 'LOT SQFT', 'Sq Ft Difference vs EXP', 'Lot Difference vs EXP',
    'Beds', 'Baths', 'Year Built', 'DOM', 'Status Contractual', 'Long Text', 'Upgrades', 
    'Parking', 'Upper Level Bedrooms', 'Upper Level Full Baths', 'Main Level Bedrooms', 'Main Level Full Baths', 'Lower Level Bedrooms', 'Lower Level Full Baths',
    'KITCHEN', 'EXTERIOR', 'PRIMARY BATHROOM', '2 Story Family Room', 'Condition', 'GARAGE SPACES', 'BELOW GRADE SQFT', 'Neighborhood',
    'Rating', 'Good Comp'
  ]);

  // Editable fields configuration - now includes all fields
  const editableFields = useMemo(() => {
    if (localData.length === 0) return [];
    return Object.keys(localData[0]);
  }, [localData]);

  // Zillow link update functions
  const openZillowModal = (row) => {
    setSelectedRowForZillow(row);
    setZillowLinkInput(row['Zillow Link'] || '');
    setShowZillowModal(true);
  };

  const updateZillowLink = () => {
    if (!selectedRowForZillow || !zillowLinkInput.trim()) return;
    
    const updatedData = [...localData];
    const rowIndex = updatedData.findIndex(row => row['MLS #'] === selectedRowForZillow['MLS #']);
    
    if (rowIndex !== -1) {
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        'Zillow Link': zillowLinkInput.trim()
      };
      
      setLocalData(updatedData);
      if (onDataUpdate) {
        onDataUpdate(updatedData);
      }
    }
    
    closeZillowModal();
  };

  const closeZillowModal = () => {
    setShowZillowModal(false);
    setSelectedRowForZillow(null);
    setZillowLinkInput('');
  };

  // Bulk edit missing values functions
  const openBulkEditModal = (column) => {
    const rowsWithMissingValues = localData.filter(row => 
      row[column] === null || row[column] === undefined || row[column] === ''
    );
    
    setBulkEditColumn(column);
    setBulkEditValue('');
    setBulkEditRows(rowsWithMissingValues);
    setShowBulkEditModal(true);
  };

  const applyBulkEdit = () => {
    if (!bulkEditColumn || !bulkEditValue.trim()) return;
    
    const updatedData = [...localData];
    let updatedCount = 0;
    
    bulkEditRows.forEach(row => {
      const rowIndex = updatedData.findIndex(r => r['MLS #'] === row['MLS #']);
      if (rowIndex !== -1) {
        updatedData[rowIndex] = {
          ...updatedData[rowIndex],
          [bulkEditColumn]: bulkEditValue.trim()
        };
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      setLocalData(updatedData);
      if (onDataUpdate) {
        onDataUpdate(updatedData);
      }
    }
    
    closeBulkEditModal();
  };

  const closeBulkEditModal = () => {
    setShowBulkEditModal(false);
    setBulkEditColumn('');
    setBulkEditValue('');
    setBulkEditRows([]);
  };

// Function to add a new row
  const addNewRow = () => {
    if (localData.length === 0) return;
    
    // Create a new row with default values based on the first row structure
    const firstRow = localData[0];
    const newRow = {};
    
    // Copy all keys from the first row and set default values
    Object.keys(firstRow).forEach(key => {
      if (key === 'MLS #') {
        // Generate a unique MLS number
        const existingMlsNumbers = localData.map(row => row['MLS #']).filter(mls => mls);
        const maxMls = Math.max(...existingMlsNumbers.map(mls => parseInt(mls) || 0), 0);
        newRow[key] = (maxMls + 1).toString();
      } else if (key === 'Rating') {
        newRow[key] = 0;
      } else if (key === 'Good Comp') {
        newRow[key] = 'NO';
      } else if (key === 'Worth Comparison') {
        newRow[key] = 'Not Set';
      } else {
        newRow[key] = '';
      }
    });
    
    // We'll add the Zillow Link after the user enters an address and city
    // This will be handled in the handleCellEdit function
    
    const updatedData = [newRow, ...localData];
    setLocalData(updatedData);
    if (onDataUpdate) {
      onDataUpdate(updatedData);
    }
    
    // Reset to first page to show the new row
    setCurrentPage(1);
  };

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
      'Neighborhood': row['SUBDIVISION'] === undefined || row['SUBDIVISION'] === null ? '' : row['SUBDIVISION'],
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
          const statusOrder = { 'EXP': 1, 'CLS': 2, 'ACT': 3, 'PND': 4, 'CS': 5 };
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

  // Continuous scrolling handlers
  const startContinuousScroll = (direction) => {
    const scrollStep = direction === 'left' ? -20 : 20;
    const scrollInterval = () => {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollBy({
          left: scrollStep,
          behavior: 'auto'
        });
      }
    };
    
    // Start immediate scroll
    scrollInterval();
    
    // Set up continuous scrolling
    scrollIntervalRef.current = setInterval(scrollInterval, 16); // ~60fps for smoother scrolling
  };

  const stopContinuousScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

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

  const startEditing = (rowIndex, column, value) => {
    // Allow editing of all fields except special ones that have their own UI and calculated fields
    if (column === 'Rating' || column === 'Good Comp' || column === 'Worth Comparison' || column === 'Status' ||
        column === 'Sq Ft Difference vs EXP' || column === 'Lot Difference vs EXP' ||
        column === 'Price vs EXP' || column === 'Price vs EXP %' || column === 'Is Reference Property' ||
        column === 'Price/SqFt') return;
    
    // Special handling for Address field - allow editing but don't show the clickable styling
    if (column === 'Address') {
      setEditingCell({ rowIndex, column });
      setEditValue(value || '');
      return;
    }
    
    setEditingCell({ rowIndex, column });
    
    // For price fields, extract the numeric value from formatted currency
    if (column.includes('Price')) {
      const numericValue = value ? value.toString().replace(/[^\d]/g, '') : '';
      setEditValue(numericValue);
    } 
    // For SQFT fields, extract the numeric value from formatted number
    else if (column.includes('SQFT')) {
      const numericValue = value ? value.toString().replace(/[^\d]/g, '') : '';
      setEditValue(numericValue);
    } else {
      // Handle missing values - start with empty string for editing
      setEditValue(value || '');
    }
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
      let valueToSave = editValue;
      
      // For price fields, convert to number
      if (column.includes('Price')) {
        const numericValue = parseInt(editValue, 10);
        valueToSave = isNaN(numericValue) ? 0 : numericValue;
      }
      // For SQFT fields, convert to number (strip commas)
      else if (column.includes('SQFT')) {
        const cleanedValue = editValue.toString().replace(/,/g, '');
        const numericValue = parseFloat(cleanedValue);
        valueToSave = isNaN(numericValue) ? 0 : numericValue;
      }
      
      updatedData[originalIndex] = {
        ...updatedData[originalIndex],
        [column]: valueToSave
      };
      
      // If the address or city was edited, update the Zillow link
      if (column === 'Address' || column === 'City') {
        const address = column === 'Address' ? valueToSave : updatedData[originalIndex]['Address'];
        const city = column === 'City' ? valueToSave : updatedData[originalIndex]['City'];
        
        // Only generate the link if both address and city are available
        if (address && city) {
          updatedData[originalIndex]['Zillow Link'] = generateZillowLink(address, city);
        }
      }
      
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
    // Check if this cell is being edited
    const isEditing = editingCell && editingCell.rowIndex === rowIndex && editingCell.column === key;
    
    // Handle missing values - allow editing for most fields
    const isMissingValue = value === null || value === undefined || value === '';
    
    if (isEditing) {
      // Special handling for price fields
      if (key.includes('Price')) {
        const formatPriceInput = (input) => {
          // Remove all non-digit characters
          const numbersOnly = input.replace(/[^\d]/g, '');
          if (numbersOnly === '') return '';
          
          // Convert to number and format
          const number = parseInt(numbersOnly, 10);
          if (isNaN(number)) return '';
          
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(number);
        };

        const handlePriceChange = (e) => {
          const rawValue = e.target.value;
          // Remove formatting for processing
          const numbersOnly = rawValue.replace(/[^\d]/g, '');
          setEditValue(numbersOnly);
        };

        return (
          <input
            type="text"
            value={editValue ? formatPriceInput(editValue) : ''}
            onChange={handlePriceChange}
            onKeyDown={handleKeyPress}
            onBlur={saveEdit}
            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
            autoFocus
            placeholder="Enter amount..."
          />
        );
      }
      
      // Special handling for SQFT fields
      if (key.includes('SQFT')) {
        const formatSqftInput = (input) => {
          // Remove all non-digit characters
          const numbersOnly = input.replace(/[^\d]/g, '');
          if (numbersOnly === '') return '';
          
          // Convert to number and format
          const number = parseInt(numbersOnly, 10);
          if (isNaN(number)) return '';
          
          return new Intl.NumberFormat('en-US').format(number);
        };

        const handleSqftChange = (e) => {
          const rawValue = e.target.value;
          // Remove formatting for processing
          const numbersOnly = rawValue.replace(/[^\d]/g, '');
          setEditValue(numbersOnly);
        };

        return (
          <input
            type="text"
            value={editValue ? formatSqftInput(editValue) : ''}
            onChange={handleSqftChange}
            onKeyDown={handleKeyPress}
            onBlur={saveEdit}
            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
            autoFocus
            placeholder="Enter square feet..."
          />
        );
      }

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
    
    // Make Address a hyperlink to Zillow with update button
    if (key === 'Address' && typeof value === 'string') {
      // Check if this cell is being edited
      const isEditing = editingCell && editingCell.rowIndex === rowIndex && editingCell.column === key;
      
      if (isEditing) {
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={saveEdit}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
              placeholder="Enter address..."
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveEdit();
              }}
              className="flex-shrink-0 p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
              title="Save address"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        );
      }
      
      const zillowLink = data.find(row => row['Address'] === value)?.['Zillow Link'];
      const row = paginatedData[rowIndex];
      
      return (
        <div className="flex items-center gap-2">
          <span 
            className="flex-1 min-w-0 cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200"
            onClick={() => startEditing(rowIndex, key, value)}
            title="Click to edit address"
          >
            {zillowLink ? (
              <a 
                href={zillowLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {value}
              </a>
            ) : (
              <span className="text-gray-900">{value}</span>
            )}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openZillowModal(row);
            }}
            className="flex-shrink-0 p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Update Zillow link"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>
      );
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
            <div 
              className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
              onClick={() => startEditing(rowIndex, key, value)}
              title="Click to edit"
            >
              <span className="text-green-700 font-semibold flex items-center gap-1">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(closePrice)}
                <ChevronUp className="inline w-4 h-4 text-green-500" />
              </span>
            </div>
          );
        } else if (closePrice < listPrice) {
          return (
            <div 
              className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
              onClick={() => startEditing(rowIndex, key, value)}
              title="Click to edit"
            >
              <span className="text-red-700 font-semibold flex items-center gap-1">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(closePrice)}
                <ChevronDown className="inline w-4 h-4 text-red-500" />
              </span>
            </div>
          );
        }
      }
      // If equal or not a number, show normal
      return (
        <div 
          className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
          onClick={() => startEditing(rowIndex, key, value)}
          title="Click to edit"
        >
          <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}</span>
        </div>
      );
    }

    // Special handling for Price/SqFt (non-editable, calculated field)
    if (key === 'Price/SqFt' && typeof value === 'number') {
      return (
        <div className="px-2 py-1">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)}
        </div>
      );
    }

    if (key.includes('Price') && typeof value === 'number') {
      return (
        <div 
          className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
          onClick={() => startEditing(rowIndex, key, value)}
          title="Click to edit"
        >
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)}
        </div>
      );
    }
    
    if (key.includes('SQFT') && typeof value === 'number') {
      return (
        <div 
          className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
          onClick={() => startEditing(rowIndex, key, value)}
          title="Click to edit"
        >
          {new Intl.NumberFormat('en-US').format(value)}
        </div>
      );
    }
    
    if (key.includes('Lot') && typeof value === 'number') {
      return (
        <div 
          className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
          onClick={() => startEditing(rowIndex, key, value)}
          title="Click to edit"
        >
          {new Intl.NumberFormat('en-US').format(value)}
        </div>
      );
    }
    
    if (key === 'LOT SQFT' && typeof value === 'number') {
      return (
        <div 
          className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
          onClick={() => startEditing(rowIndex, key, value)}
          title="Click to edit"
        >
          {new Intl.NumberFormat('en-US').format(value)}
        </div>
      );
    }
    
    if (key === 'BELOW GRADE SQFT' && typeof value === 'number') {
      return (
        <div 
          className={`cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border border-gray-200`}
          onClick={() => startEditing(rowIndex, key, value)}
          title="Click to edit"
        >
          {new Intl.NumberFormat('en-US').format(value)}
        </div>
      );
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

    // Special handling for Status column
    if (key === 'Status') {
      const getStatusColor = (statusValue) => {
        switch (statusValue) {
          case 'EXP':
            return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
          case 'CLS':
            return 'bg-green-100 text-green-800 hover:bg-green-200';
          case 'ACT':
            return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
          case 'PND':
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
          case 'CS':
            return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
          default:
            return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
        }
      };

      const cycleStatus = (currentValue) => {
        switch (currentValue) {
          case 'EXP':
            return 'CLS';
          case 'CLS':
            return 'ACT';
          case 'ACT':
            return 'PND';
          case 'PND':
            return 'CS';
          case 'CS':
            return 'EXP';
          default:
            return 'EXP';
        }
      };

      return (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${getStatusColor(value)}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newValue = cycleStatus(value);
              const actualRowIndex = (currentPage - 1) * itemsPerPage + rowIndex;
              const updatedData = [...localData];
              
              // Find the actual row in the original data
              const rowToUpdate = filteredAndSortedData[actualRowIndex];
              const originalIndex = localData.findIndex(row => row['MLS #'] === rowToUpdate['MLS #']);
              
              if (originalIndex !== -1) {
                updatedData[originalIndex] = {
                  ...updatedData[originalIndex],
                  'Status': newValue
                };
                
                setLocalData(updatedData);
                if (onDataUpdate) {
                  onDataUpdate(updatedData);
                }
              }
            }}
          >
            {value || 'EXP'}
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
    
    // For editable fields, make them clickable (all fields except special ones and calculated fields)
    if (!['Rating', 'Good Comp', 'Worth Comparison', 'Status', 'Sq Ft Difference vs EXP', 'Lot Difference vs EXP', 
           'Price vs EXP', 'Price vs EXP %', 'Is Reference Property', 'Price/SqFt'].includes(key)) {
      // Don't make Address clickable since it has its own special handling with the Zillow link button
      if (key === 'Address') {
        return value || '';
      }
      
      return (
        <div 
          className={`group relative cursor-pointer hover:bg-gray-100 hover:border-primary-300 px-2 py-1 rounded -mx-2 -my-1 transition-colors border ${
            value ? 'border-gray-200' : 'border-gray-300 border-dashed'
          } ${isMissingValue ? 'bg-gray-50 hover:bg-gray-100' : ''}`}
          onClick={() => startEditing(rowIndex, key, value)}
          title={isMissingValue ? "Click to add value" : "Click to edit"}
        >
          {isMissingValue ? (
            <span></span>
          ) : (
            <span className="flex items-center justify-between">
              <span className="flex-1">{value}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Clear the value by setting it to empty string
                  const actualRowIndex = (currentPage - 1) * itemsPerPage + rowIndex;
                  const updatedData = [...localData];
                  const rowToUpdate = filteredAndSortedData[actualRowIndex];
                  const originalIndex = localData.findIndex(row => row['MLS #'] === rowToUpdate['MLS #']);
                  
                  if (originalIndex !== -1) {
                    updatedData[originalIndex] = {
                      ...updatedData[originalIndex],
                      [key]: ''
                    };
                    
                    setLocalData(updatedData);
                    if (onDataUpdate) {
                      onDataUpdate(updatedData);
                    }
                  }
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                title="Clear value"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      );
    }
    
    return value.toString();
  };

  const getDisplayName = (columnName) => {
    // Map display names to ensure they match actual data fields
    const displayNames = {
      // Fix misaligned column names
      'Sq Ft Difference vs EXP': 'Sqft Difference',
      'Lot Difference vs EXP': 'Lot sqft Difference',
      'LOT SQFT': 'Lot sqft',
      'BELOW GRADE SQFT': 'Below Grade SQFT',
      'SUBDIVISION': 'Subdivision',
      'Price/SqFt': 'Price Per sqft',
      'Above Grade Finished SQFT': 'Aboe Grade sqft',
      'Worth Comparison': 'Worth Comparison',
      'Status Contractual': 'Status Contractual',
      'GARAGE SPACES': 'Garage Spaces',
      'PRIMARY BATHROOM': 'Primary Bathroom',
      '2 Story Family Room': '2 Story Family Room',
      'Good Comp': 'Good Comp',
      'Subdivision/Neighborhood': 'Neighborhood'
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
        <div className="flex flex-col gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          

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

          <button
            onClick={addNewRow}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Row
          </button>
        </div>
      </div>



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
      <div className="table-container" ref={tableContainerRef}>
        <table className="table">
          <thead className="sticky top-0 z-30 bg-gray-50">
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
                      if (col === 'Neighborhood') return 'min-w-[160px]';
                      if (col === 'Rating' || col === 'Good Comp' || col === 'Worth Comparison') return 'min-w-[100px]';
                    return '';
                  };
                
                return (
                <th
                  key={column}
                  className={`table-header group cursor-pointer hover:bg-gray-100 transition-colors ${getColumnWidth(column)} ${
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
                    
                    {/* Bulk edit button for columns with missing values */}
                    {!['Rating', 'Good Comp', 'Worth Comparison', 'Status', 'Sq Ft Difference vs EXP', 'Lot Difference vs EXP', 
                        'Price vs EXP', 'Price vs EXP %', 'Is Reference Property', 'Price/SqFt'].includes(column) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openBulkEditModal(column);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`Bulk edit missing values for ${getDisplayName(column)}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => {
              const isStarredProperty = starredPropertyId === row['MLS #'];
              if (rowIndex === 0) {
                console.log('EditableDataTable starredPropertyId:', starredPropertyId, 'isStarredProperty for first row:', isStarredProperty);
              }
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
                      if (col === 'Neighborhood') return 'min-w-[160px]';
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
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[80vh] overflow-hidden">
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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

      {/* Zillow Link Update Modal */}
      {showZillowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Zillow Link</h3>
              <button
                onClick={closeZillowModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Address
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                {selectedRowForZillow?.['Address'] || 'N/A'}
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zillow Link
              </label>
              <input
                type="url"
                value={zillowLinkInput}
                onChange={(e) => setZillowLinkInput(e.target.value)}
                placeholder="https://www.zillow.com/homedetails/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeZillowModal}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={updateZillowLink}
                className="btn-primary"
                disabled={!zillowLinkInput.trim()}
              >
                Update Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Missing Values Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bulk Edit Missing Values</h3>
              <button
                onClick={closeBulkEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Column: {bulkEditColumn}
              </label>
              <p className="text-sm text-gray-600">
                {bulkEditRows.length} properties have missing values for this field
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Value
              </label>
              <input
                type="text"
                value={bulkEditValue}
                onChange={(e) => setBulkEditValue(e.target.value)}
                placeholder={`Enter value for ${bulkEditColumn}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
            
            <div className="mb-4 max-h-32 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Properties to update:</p>
              <div className="space-y-1">
                {bulkEditRows.slice(0, 10).map((row, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {row['Address'] || `Property ${index + 1}`}
                  </div>
                ))}
                {bulkEditRows.length > 10 && (
                  <div className="text-sm text-gray-500 italic">
                    ... and {bulkEditRows.length - 10} more
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeBulkEditModal}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkEdit}
                className="btn-primary"
                disabled={!bulkEditValue.trim()}
              >
                Update {bulkEditRows.length} Properties
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

      {/* Floating Horizontal Scroll Navigation */}
      {visibleColumns.length > 0 && showScrollNav && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1 relative">
            <button
              onClick={handleScrollLeft}
              onMouseDown={() => startContinuousScroll('left')}
              onMouseUp={stopContinuousScroll}
              onMouseLeave={stopContinuousScroll}
              onTouchStart={() => startContinuousScroll('left')}
              onTouchEnd={stopContinuousScroll}
              disabled={!canScrollLeft}
              className="floating-scroll-button"
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollRight}
              onMouseDown={() => startContinuousScroll('right')}
              onMouseUp={stopContinuousScroll}
              onMouseLeave={stopContinuousScroll}
              onTouchStart={() => startContinuousScroll('right')}
              onTouchEnd={stopContinuousScroll}
              disabled={!canScrollRight}
              className="floating-scroll-button"
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowScrollNav(false)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              title="Hide scroll navigation"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Show scroll navigation button when hidden */}
      {visibleColumns.length > 0 && !showScrollNav && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowScrollNav(true)}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
            title="Show scroll navigation"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableDataTable;
