# Python Analysis in Probly

Probly integrates Python data analysis capabilities directly in your spreadsheet using [Pyodide](https://pyodide.org/en/stable/), a WebAssembly port of Python. It achieves this by using a tool call to automatically generate the Python code based on your request and populate the spreadsheet with the results based on its spatial understanding of the spreadsheet.

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

## When to Use Python Analysis

Python analysis is ideal for complex operations that go beyond standard spreadsheet functions:

- Statistical analysis beyond HyperFormula's capabilities
- Data transformation (pivoting, reshaping, grouping)
- Complex filtering or aggregation
- Time series analysis
- Custom calculations across multiple columns
- Sorting operations
- Machine learning or advanced statistical modeling
- Complex data cleaning operations
- Regular expressions and advanced text processing


