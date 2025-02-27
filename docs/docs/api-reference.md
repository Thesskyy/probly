# API Reference

This document provides details on the internal architecture and interfaces used in Probly. This information is primarily useful for developers who want to contribute to or extend the application.

## Internal Architecture

Probly is structured around several key components that work together to provide its functionality.

## Core Components

### SpreadsheetContext

The SpreadsheetContext is a React context that manages the state of the spreadsheet and provides methods for interacting with it.

<div class="method-table" markdown>

| Method | Description |
|--------|-------------|
| `setFormula(target: string, formula: string)` | Queue a formula update for a specific cell |
| `setFormulas(updates: CellUpdate[])` | Queue multiple formula updates |
| `clearFormula(target: string)` | Remove a formula from the queue |
| `setChartData(chartData: any)` | Queue chart data for rendering |
| `setCellValues(updates: Map<string, any>)` | Update cell values |
| `clearCellValues(target: string)` | Clear a specific cell value |

</div>

<div class="property-table" markdown>

| Property | Type | Description |
|----------|------|-------------|
| `formulaQueue` | `Map<string, string>` | Queue of pending formula updates |
| `cellValues` | `Map<string, any>` | Current cell values |

</div>

### PyodideSandbox

The PyodideSandbox class provides a secure environment for executing Python code in the browser.

<div class="method-table" markdown>

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the Pyodide runtime |
| `runDataAnalysis(code: string, csvData: string, timeout?: number)` | Execute Python code with the provided data |
| `destroy()` | Clean up resources |

</div>

#### SandboxResult

<div class="property-table" markdown>

| Property | Type | Description |
|----------|------|-------------|
| `stdout` | `string` | Standard output from Python execution |
| `stderr` | `string` | Standard error output |
| `result` | `any` | Return value from the Python code |

</div>

## Backend API Endpoints

Probly includes a backend API that handles communication with external services like OpenAI.

### LLM API

The LLM API handles communication with the OpenAI API for AI-powered features.

**Endpoint:** `POST /api/llm`

**Request Body:**

<div class="api-table" markdown>

| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | User message |
| `spreadsheetData` | `any[][]` | Current spreadsheet data |
| `chatHistory` | `ChatCompletionMessageParam[]` | Previous chat messages |

</div>

**Response:**

Server-sent events with the following data structure:

<div class="api-table" markdown>

| Field | Type | Description |
|-------|------|-------------|
| `response` | `string` | AI response text |
| `streaming` | `boolean` | Whether more content is coming |
| `updates` | `CellUpdate[]` | Optional cell updates |
| `chartData` | `object` | Optional chart data |
| `analysis` | `object` | Optional analysis results |

</div>

## Data Structures

### CellUpdate

Represents an update to a cell in the spreadsheet.

<div class="property-table" markdown>

| Property | Type | Description |
|----------|------|-------------|
| `target` | `string` | Cell reference (e.g., "A1") |
| `formula` | `string` | Formula or value to set |

</div>

### ChartData

Represents data for creating a chart.

<div class="property-table" markdown>

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | Chart type (bar, line, pie, scatter) |
| `options` | `object` | Chart configuration |
| `options.title` | `string` | Chart title |
| `options.data` | `any[][]` | Chart data |

</div>

### AnalysisData

Represents the result of a Python analysis.

<div class="property-table" markdown>

| Property | Type | Description |
|----------|------|-------------|
| `goal` | `string` | Description of the analysis |
| `output` | `string` | CSV output from analysis |
| `error` | `string` | Any error messages |

</div>

## AI Tools

Probly extends the AI's capabilities through a set of specialized tools.

### set_spreadsheet_cells

Updates cells in the spreadsheet based on AI suggestions.

### create_chart

Creates a chart visualization based on spreadsheet data.

### execute_python_code

Executes Python code for data analysis and returns the results.

## UI Components

### Spreadsheet Component

The main spreadsheet interface component.

<div class="property-table" markdown>

| Prop | Type | Description |
|------|------|-------------|
| `onDataChange` | `(data: any[][]) => void` | Callback when data changes |
| `initialData` | `any[][]` | Initial spreadsheet data |

</div>

### ChatBox Component

The AI chat interface component.

<div class="property-table" markdown>

| Prop | Type | Description |
|------|------|-------------|
| `onSend` | `(message: string) => Promise<void>` | Send a message |
| `onStop` | `() => void` | Stop generation |
| `onAccept` | `(updates: CellUpdate[], messageId: string) => void` | Accept suggested changes |
| `onReject` | `(messageId: string) => void` | Reject suggested changes |
| `chatHistory` | `ChatMessage[]` | Chat message history |
| `clearHistory` | `() => void` | Clear chat history |

</div>
