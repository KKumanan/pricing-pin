import Papa from 'papaparse';

export const processCSVData = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('Error parsing CSV: ' + results.errors[0].message));
        } else {
          const processedData = results.data.map(row => ({
            ...row,
            // Clean and parse numeric values
            'List Price': parsePrice(row['List Price']),
            'Close Price': parsePrice(row['Close Price']),
            'Above Grade Finished SQFT': parseNumber(row['Above Grade Finished SQFT']),
            'Price/SqFt': parsePrice(row['Price/SqFt']),
            'Below Grade Finished SQFT': parseNumber(row['Below Grade Finished SQFT']),
            'Beds': parseNumber(row['Beds']),
            'Baths': parseBaths(row['Baths']),
            'Year Built': parseNumber(row['Year Built']),
            'DOM': parseNumber(row['DOM']),
            'CDOM': parseNumber(row['CDOM']),
            // Calculate additional fields
            'Total SQFT': (parseNumber(row['Above Grade Finished SQFT']) || 0) + (parseNumber(row['Below Grade Finished SQFT']) || 0),
            'Price Difference': parsePrice(row['Close Price']) - parsePrice(row['List Price']),
            'Price Difference %': parsePrice(row['Close Price']) && parsePrice(row['List Price']) 
              ? ((parsePrice(row['Close Price']) - parsePrice(row['List Price'])) / parsePrice(row['List Price']) * 100).toFixed(2)
              : null,
            'Zillow Link': generateZillowLink(row['Address'], row['City']),
            // Initialize editable fields
            'Status Contractual': row['Status Contractual'] || '',
            'Long Text': row['Long Text'] || '',
            'Upgrades': row['Upgrades'] || '',
            'Parking': row['Parking'] || '',
            'BR up1': row['BR up1'] || '',
            'FB up1': row['FB up1'] || '',
            'Main Level BR': row['Main Level BR'] || '',
            'Main Level Full Bath': row['Main Level Full Bath'] || '',
            // Split Kitchen Exterior into separate fields
            'KITCHEN': row['KITCHEN'] || '',
            'EXTERIOR': row['EXTERIOR'] || '',
            'PRIMARY BATHROOM': row['PRIMARY BATHROOM'] || '',
            // Combine garage spaces
            'GARAGE SPACES': combineGarageSpaces(row['Attached Garage # of Spaces'], row['Detached Garage # of Spaces']),
            // Add lot size in square feet
            'LOT SQFT': parseLotSize(row['Acres/Lot SF']),
            // Add below grade square footage
            'BELOW GRADE SQFT': parseNumber(row['Below Grade Finished SQFT']),
            // Add subdivision name
            'SUBDIVISION': row['Subdivision/Neighborhood'] || '',
          }));
          resolve(processedData);
        }
      },
      error: (error) => {
        reject(new Error('Error parsing CSV: ' + error.message));
      }
    });
  });
};

export const calculateComparisons = (data) => {
  if (data.length === 0) return data;

  // Find the EXP property to use as reference
  const expProperty = data.find(prop => prop['Status'] === 'EXP');
  
  if (!expProperty) {
    console.warn('No EXP property found in data. Skipping comparison calculations.');
    return data;
  }

  console.log('Using EXP property as reference:', expProperty['Address']);

  return data.map(property => {
    const sqftDiff = (property['Above Grade Finished SQFT'] || 0) - (expProperty['Above Grade Finished SQFT'] || 0);
    const lotDiff = parseLotSize(property['Acres/Lot SF']) - parseLotSize(expProperty['Acres/Lot SF']);
    
    return {
      ...property,
      'Sq Ft Difference vs EXP': sqftDiff,
      'Lot Difference vs EXP': lotDiff,
      'Price vs EXP': property['List Price'] && expProperty['List Price'] 
        ? property['List Price'] - expProperty['List Price']
        : null,
      'Price vs EXP %': property['List Price'] && expProperty['List Price']
        ? ((property['List Price'] - expProperty['List Price']) / expProperty['List Price'] * 100).toFixed(2)
        : null,
      'Is Reference Property': property['Status'] === 'EXP',
    };
  });
};

export const generateSummaryStats = (data) => {
  const closedProperties = data.filter(prop => prop['Status'] === 'CLS' && prop['Close Price']);
  const activeProperties = data.filter(prop => prop['Status'] === 'ACT');
  const pendingProperties = data.filter(prop => prop['Status'] === 'PND');

  const avgListPrice = data.reduce((sum, prop) => sum + (prop['List Price'] || 0), 0) / data.length;
  const avgClosePrice = closedProperties.length > 0 
    ? closedProperties.reduce((sum, prop) => sum + (prop['Close Price'] || 0), 0) / closedProperties.length
    : 0;
  const avgPricePerSqFt = data.reduce((sum, prop) => sum + (prop['Price/SqFt'] || 0), 0) / data.length;
  const avgDaysOnMarket = data.reduce((sum, prop) => sum + (prop['DOM'] || 0), 0) / data.length;

  return {
    totalProperties: data.length,
    closedProperties: closedProperties.length,
    activeProperties: activeProperties.length,
    pendingProperties: pendingProperties.length,
    avgListPrice: avgListPrice.toFixed(2),
    avgClosePrice: avgClosePrice.toFixed(2),
    avgPricePerSqFt: avgPricePerSqFt.toFixed(2),
    avgDaysOnMarket: avgDaysOnMarket.toFixed(0),
    avgPriceDifference: closedProperties.length > 0 
      ? (closedProperties.reduce((sum, prop) => sum + (prop['Price Difference'] || 0), 0) / closedProperties.length).toFixed(2)
      : 0,
  };
};

// Helper functions
const parsePrice = (priceStr) => {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const parseNumber = (numStr) => {
  if (!numStr) return null;
  const cleaned = numStr.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const parseBaths = (bathsStr) => {
  if (!bathsStr) return null;
  // Handle formats like "3", "1-Feb", "Mar-00"
  if (bathsStr.includes('-')) {
    const parts = bathsStr.split('-');
    const first = parseFloat(parts[0]);
    const second = parseFloat(parts[1]);
    if (!isNaN(first) && !isNaN(second)) {
      return first + second;
    }
  }
  return parseNumber(bathsStr);
};

const parseLotSize = (lotStr) => {
  if (!lotStr) return 0;
  // Extract the square feet value from formats like "0.21 / 9365"
  const match = lotStr.match(/(\d+\.?\d*)\s*\/\s*(\d+)/);
  return match ? parseFloat(match[2]) : 0; // Return the square feet value (second number)
};

const combineGarageSpaces = (attachedSpaces, detachedSpaces) => {
  const attached = parseNumber(attachedSpaces) || 0;
  const detached = parseNumber(detachedSpaces) || 0;
  const total = attached + detached;
  return total > 0 ? total : null;
};

const generateZillowLink = (address, city) => {
  if (!address || !city) return null;
  
  // Clean and format the address for Zillow URL
  const cleanAddress = address
    .replace(/[^\w\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase();
  
  const cleanCity = city
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return `https://www.zillow.com/homes/${cleanAddress}-${cleanCity}-MD`;
};

export const exportToCSV = (data, filename = 'processed_data.csv') => {
  // Create a copy of data without the Zillow Link column for CSV export
  const exportData = data.map(row => {
    const { 'Zillow Link': zillowLink, ...rest } = row;
    return {
      ...rest,
      'Zillow URL': zillowLink // Rename to avoid issues with CSV parsing
    };
  });
  
  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 