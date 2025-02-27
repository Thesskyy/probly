# Python Analysis in Probly

Probly integrates Python data analysis capabilities directly in your spreadsheet using Pyodide, a WebAssembly port of Python.

## How It Works

When you request Python analysis through the AI assistant:

1. The AI generates appropriate Python code based on your request
2. The code is executed in a secure sandbox using Pyodide
3. Your spreadsheet data is converted to a pandas DataFrame
4. The analysis results are returned to your spreadsheet

## Available Libraries

Probly comes pre-loaded with popular data science libraries:

- **pandas**: For data manipulation and analysis
- **numpy**: For numerical computing
- **matplotlib**: For creating visualizations (results returned as data)

## Example Use Cases

### Data Cleaning

Ask the AI to clean your data:
