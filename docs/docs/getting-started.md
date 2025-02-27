# Getting Started with Probly

This guide will help you get up and running with Probly, the AI-powered spreadsheet tool.

## Installation

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- An internet connection

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PragmaticMachineLearning/probly.git
   cd probly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Basic Usage

### Spreadsheet Interface

The main interface is a familiar spreadsheet grid where you can:

- Enter data directly into cells
- Use formulas with the `=` prefix
- Format cells using the toolbar
- Import and export data

### AI Assistant

Access the AI assistant by pressing `Ctrl+Shift+/` or clicking the chat icon.

You can ask the assistant to:
- Create formulas
- Analyze data
- Generate charts
- Run Python code

### Example Interactions

Try asking the AI assistant:

- "Calculate the average sales for each quarter"
- "Create a bar chart showing monthly revenue"
- "Find outliers in this dataset"
- "Run a linear regression on columns A and B"

## Importing and Exporting Data

### Import

1. Click the Import button in the toolbar
2. Select an Excel (.xlsx) file from your computer
3. Your data will be loaded into the spreadsheet

### Export

1. Click the Export button in the toolbar
2. Your spreadsheet will be downloaded as an Excel file

## Next Steps

- Explore the [Features](features/overview.md) section to learn more about what Probly can do
- Check out the [Python Analysis](features/python-analysis.md) guide for advanced data analysis
- See the [Charts](features/charts.md) documentation for visualization options
