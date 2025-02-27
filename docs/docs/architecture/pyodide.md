## Data Flow

* **User Input**:
  * Direct spreadsheet interaction
  * AI assistant queries

* **Processing**:
  * Spreadsheet calculations via HyperFormula
  * AI processing via OpenAI API
  * Python analysis via Pyodide

* **Output**:
  * Updated spreadsheet cells
  * Generated charts
  * AI responses

## Key Interactions

### Spreadsheet to AI

The AI assistant has access to:
    - Current spreadsheet data
    - Chat history
    - User queries

### AI to Tools

The AI can invoke specialized tools:
    - `set_spreadsheet_cells`: Update spreadsheet cells
    - `create_chart`: Generate data visualizations
    - `execute_python_code`: Run Python analysis

### Python to Spreadsheet

Python analysis results flow back to the spreadsheet:
    1. Spreadsheet data is converted to CSV
    2. Python code processes the data
    3. Results are formatted as cell updates
    4. Updates are applied to the spreadsheet

## Context Management

The SpreadsheetContext provides:
    - Formula queue management
    - Cell value tracking
    - Chart data handling

This context allows components to communicate and share state without direct coupling.

## For more details:

    - [Pyodide Integration](pyodide.md)
    - [API Reference](../api-reference.md)
