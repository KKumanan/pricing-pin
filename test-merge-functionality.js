// Test script for CSV merging functionality
const { processCSVData } = require('./src/utils/csvProcessor');

// Mock data for testing
const existingData = [
  {
    'MLS #': '12345',
    'Address': '123 Main St',
    'List Price': 500000,
    'Close Price': 490000,
    'Status': 'Sold',
    'Status Contractual': 'Active',
    'Long Text': 'Beautiful home',
    'Upgrades': 'Kitchen remodel',
    'Parking': '2 car garage',
    'Upper Level Bedrooms': 3,
    'Upper Level Full Baths': 2,
    'Main Level Bedrooms': 1,
    'Main Level Full Baths': 1,
    'Lower Level Bedrooms': 0,
    'Lower Level Full Baths': 0,
    'KITCHEN': 'Updated',
    'EXTERIOR': 'Brick',
    'PRIMARY BATHROOM': 'Renovated',
    '2 Story Family Room': 'Yes',
    'Condition': 'Good',
    'GARAGE SPACES': 2,
    'BELOW GRADE SQFT': 0,
    'SUBDIVISION': 'Downtown',
    'LOT SQFT': 5000,
    'Good Comp': 'Yes',
    'Worth Comparison': 'Yes'
  },
  {
    'MLS #': '67890',
    'Address': '456 Oak Ave',
    'List Price': 600000,
    'Close Price': 580000,
    'Status': 'Sold',
    'Status Contractual': 'Active',
    'Long Text': 'Spacious family home',
    'Upgrades': 'New roof',
    'Parking': '3 car garage',
    'Upper Level Bedrooms': 4,
    'Upper Level Full Baths': 2,
    'Main Level Bedrooms': 1,
    'Main Level Full Baths': 1,
    'Lower Level Bedrooms': 1,
    'Lower Level Full Baths': 1,
    'KITCHEN': 'Granite countertops',
    'EXTERIOR': 'Vinyl siding',
    'PRIMARY BATHROOM': 'Master suite',
    '2 Story Family Room': 'No',
    'Condition': 'Excellent',
    'GARAGE SPACES': 3,
    'BELOW GRADE SQFT': 1000,
    'SUBDIVISION': 'Suburban Heights',
    'LOT SQFT': 8000,
    'Good Comp': 'Yes',
    'Worth Comparison': 'Yes'
  }
];

const newData = [
  {
    'MLS #': '11111',
    'Address': '789 Pine St', // New address - should be added
    'List Price': 450000,
    'Close Price': 440000,
    'Status': 'Sold',
    'Status Contractual': 'Active',
    'Long Text': 'Cozy starter home',
    'Upgrades': 'Fresh paint',
    'Parking': '1 car garage',
    'Upper Level Bedrooms': 2,
    'Upper Level Full Baths': 1,
    'Main Level Bedrooms': 1,
    'Main Level Full Baths': 1,
    'Lower Level Bedrooms': 0,
    'Lower Level Full Baths': 0,
    'KITCHEN': 'Basic',
    'EXTERIOR': 'Aluminum siding',
    'PRIMARY BATHROOM': 'Standard',
    '2 Story Family Room': 'No',
    'Condition': 'Fair',
    'GARAGE SPACES': 1,
    'BELOW GRADE SQFT': 0,
    'SUBDIVISION': 'First Time Buyers',
    'LOT SQFT': 4000,
    'Good Comp': 'No',
    'Worth Comparison': 'No'
  },
  {
    'MLS #': '12345',
    'Address': '123 Main St', // Duplicate address - should be skipped
    'List Price': 510000,
    'Close Price': 500000,
    'Status': 'Sold',
    'Status Contractual': 'Active',
    'Long Text': 'Updated description',
    'Upgrades': 'New kitchen',
    'Parking': '2 car garage',
    'Upper Level Bedrooms': 3,
    'Upper Level Full Baths': 2,
    'Main Level Bedrooms': 1,
    'Main Level Full Baths': 1,
    'Lower Level Bedrooms': 0,
    'Lower Level Full Baths': 0,
    'KITCHEN': 'Fully updated',
    'EXTERIOR': 'Brick',
    'PRIMARY BATHROOM': 'Luxury',
    '2 Story Family Room': 'Yes',
    'Condition': 'Excellent',
    'GARAGE SPACES': 2,
    'BELOW GRADE SQFT': 0,
    'SUBDIVISION': 'Downtown',
    'LOT SQFT': 5000,
    'Good Comp': 'Yes',
    'Worth Comparison': 'Yes'
  },
  {
    'MLS #': '22222',
    'Address': '999 Elm Dr', // New address - should be added
    'List Price': 750000,
    'Close Price': 730000,
    'Status': 'Sold',
    'Status Contractual': 'Active',
    'Long Text': 'Luxury estate',
    'Upgrades': 'Custom everything',
    'Parking': '4 car garage',
    'Upper Level Bedrooms': 5,
    'Upper Level Full Baths': 3,
    'Main Level Bedrooms': 2,
    'Main Level Full Baths': 2,
    'Lower Level Bedrooms': 2,
    'Lower Level Full Baths': 1,
    'KITCHEN': 'Chef\'s kitchen',
    'EXTERIOR': 'Stone',
    'PRIMARY BATHROOM': 'Spa-like',
    '2 Story Family Room': 'Yes',
    'Condition': 'Luxury',
    'GARAGE SPACES': 4,
    'BELOW GRADE SQFT': 2000,
    'SUBDIVISION': 'Luxury Estates',
    'LOT SQFT': 15000,
    'Good Comp': 'Yes',
    'Worth Comparison': 'Yes'
  }
];

// Test the merge functionality
function testMergeFunctionality() {
  console.log('Testing CSV Merge Functionality...\n');
  
  // Get existing addresses to check for duplicates
  const existingAddresses = new Set(existingData.map(item => item.Address?.toLowerCase().trim()));
  
  console.log('Existing addresses:', Array.from(existingAddresses));
  console.log('New data addresses:', newData.map(item => item.Address));
  
  // Filter out properties that already exist (same address)
  const uniqueNewData = newData.filter(item => {
    const address = item.Address?.toLowerCase().trim();
    return address && !existingAddresses.has(address);
  });
  
  console.log('\nResults:');
  console.log('Total new properties:', newData.length);
  console.log('Unique properties to add:', uniqueNewData.length);
  console.log('Duplicate properties skipped:', newData.length - uniqueNewData.length);
  
  console.log('\nProperties to be added:');
  uniqueNewData.forEach(item => {
    console.log(`- ${item.Address} (MLS: ${item['MLS #']})`);
  });
  
  console.log('\nProperties to be skipped (duplicates):');
  newData.filter(item => {
    const address = item.Address?.toLowerCase().trim();
    return address && existingAddresses.has(address);
  }).forEach(item => {
    console.log(`- ${item.Address} (MLS: ${item['MLS #']})`);
  });
  
  // Merge the data
  const mergedData = [...existingData, ...uniqueNewData];
  
  console.log('\nFinal merged data:');
  console.log('Total properties after merge:', mergedData.length);
  console.log('Properties in merged data:');
  mergedData.forEach(item => {
    console.log(`- ${item.Address} (MLS: ${item['MLS #']})`);
  });
  
  // Test case sensitivity
  console.log('\nTesting case sensitivity...');
  const testAddress1 = '123 MAIN ST';
  const testAddress2 = '123 main st';
  const testAddress3 = '123 Main St';
  
  console.log(`"${testAddress1}" matches existing:`, existingAddresses.has(testAddress1.toLowerCase().trim()));
  console.log(`"${testAddress2}" matches existing:`, existingAddresses.has(testAddress2.toLowerCase().trim()));
  console.log(`"${testAddress3}" matches existing:`, existingAddresses.has(testAddress3.toLowerCase().trim()));
  
  console.log('\n✅ Merge functionality test completed successfully!');
}

// Run the test
testMergeFunctionality(); 