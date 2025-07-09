# Pricing Pin - Real Estate Data Analysis Web App

A modern, sleek web application for analyzing real estate CSV data with advanced calculations, visualizations, and insights.

## Features

### 📊 **Data Processing**
- Upload CSV files with drag-and-drop functionality
- Automatic parsing and cleaning of real estate data
- Smart handling of various data formats (prices, square footage, etc.)

### 📈 **Advanced Calculations**
- **Automatic EXP Property Reference**: Uses the property with status "EXP" as the reference for all comparisons
- Price difference analysis (Close vs List Price)
- Square footage comparisons vs EXP property
- Lot size analysis vs EXP property
- Days on market statistics
- Price per square foot calculations

### 🎨 **Modern UI/UX**
- Clean, responsive design with Tailwind CSS
- Interactive data tables with sorting and filtering
- Real-time search functionality
- Pagination for large datasets
- Beautiful statistics cards with icons

### 📋 **Data Visualization**
- **Overview Tab**: Key market metrics and insights
- **Data Table Tab**: Detailed property information with advanced filtering and Zillow links
- **Analysis Tab**: Market trends and property distribution analysis

### 💾 **Export Functionality**
- Export processed data to CSV
- Filtered data export
- Custom filename support
- Zillow URLs included in exports

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Usage

1. **Upload Data**: Drag and drop your CSV file or click to browse
2. **View Overview**: See key statistics and market insights
3. **Explore Data**: Use the interactive table to sort, filter, and search
4. **Analyze Trends**: Check the analysis tab for detailed market insights
5. **Export Results**: Download processed data as CSV

## Data Format

The app is designed to work with real estate CSV data containing columns like:

- `MLS #` - Property identifier
- `Status` - Property status (ACT, CLS, PND, EXP)
- `Address` - Property address
- `List Price` - Original listing price
- `Close Price` - Final sale price
- `Above Grade Finished SQFT` - Square footage
- `Price/SqFt` - Price per square foot
- `Beds` - Number of bedrooms
- `Baths` - Number of bathrooms
- `Year Built` - Construction year
- `DOM` - Days on market
- `Subdivision/Neighborhood` - Location information
- `Zillow Link` - Direct link to property on Zillow

## Example Data

The app includes example files:
- `bright-input.csv` - Sample input data
- `output.csv` - Sample processed output

## Key Calculations

### Price Analysis
- **Price Difference**: Close Price - List Price
- **Price Difference %**: (Close Price - List Price) / List Price × 100
- **Average Price Trends**: Market-wide price analysis

### Market Metrics
- **Days on Market**: Average time properties stay listed
- **Price per Square Foot**: Market rate analysis
- **Property Distribution**: Breakdown by bedrooms, neighborhoods

### Comparative Analysis
- **Square Footage Difference vs EXP**: Compared to the expired listing
- **Lot Size Difference vs EXP**: Lot size comparisons to the expired listing
- **Price vs EXP**: Relative pricing analysis compared to the expired listing
- **Automatic Reference Detection**: Automatically identifies and uses the EXP property as the baseline

## Technology Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **CSV Processing**: PapaParse
- **Build Tool**: Create React App

## Project Structure

```
src/
├── components/
│   ├── FileUpload.js      # File upload with drag & drop
│   ├── DataTable.js       # Interactive data table
│   └── SummaryStats.js    # Statistics cards
├── utils/
│   └── csvProcessor.js    # CSV parsing and calculations
├── App.js                 # Main application component
├── index.js              # React entry point
└── index.css             # Global styles
```

## Customization

### Adding New Calculations
Edit `src/utils/csvProcessor.js` to add new data processing functions.

### Modifying UI
Update components in `src/components/` and styles in `src/index.css`.

### Adding New Data Fields
Modify the CSV processing logic to handle additional columns.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ for real estate professionals** 