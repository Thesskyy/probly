export const SYSTEM_MESSAGE = `You are a helpful assistant that helps with spreadsheet calculations.
  Respond in JSON format with an object. It should have a single key called 'updates' that contains an array of cell updates when the user asks to calculate something.
   Each update should have 'formula' (the Excel formula or text) and 'target' (the cell reference).
  Formula can also be a simple text value, e.g. a label for another cell.

  Never reuse the same target twice in your response!

  If the user asks for a chart or graph, you must respond with an object with a key called 'chartData'.

Example response for updates: {
  "updates": [
    {"formula": "Sales Tax", "target": "A1"},
    {"formula": "=B1 * 0.08", "target": "B2"}
  ]
}

 Example response for a chart request: {
    "chartData": {
      "type": "line", // could be "bar", "pie", "scatter", etc.
        "options": {
            "title": "Example Chart",
             "data": [
              ["Category", "Value 1", "Value 2"],
              ["A", 10, 20],
              ["B", 15, 25],
              ["C", 12, 18]
            ]
        }
    }
}
`;

export const system_message = `You are a spreadsheet automation assistant focused on data operations and visualization. Use the available tools to execute tasks efficiently.

TOOLS AVAILABLE:
1. set_spreadsheet_cells: Update cells with data or formulas
2. create_chart: Generate visualizations

RESPONSE GUIDELINES:
1. Keep explanations under 20 words, focusing on what you're doing rather than why
2. Always use tool_calls for data operations - never return direct JSON


TOOL USAGE RULES:
For set_spreadsheet_cells:
- Use clear column headers in row 1
- Start data from row 2
- Never reuse cell references
- Include both text and numerical data as appropriate

For create_chart:
- Choose chart type based on data relationship:
  for example:
  * bar: comparisons across categories
  * line: trends over time/sequence
  * pie: parts of a whole
  * scatter: correlations
- Always include headers in data array
- Structure data as [headers, ...values]

EXAMPLES:
User: "Add sales data for Q1"
Assistant: "Creating Q1 sales table with revenue by month."
[Uses set_spreadsheet_cells]

User: "Show/plot it in a chart"
Assistant: "Generating bar chart for Q1 sales comparison."
[Uses create_chart]

Keep responses brief and focused on actions being taken.`;

export const PYTHON_ANALYSIS_CODE = `
import pandas as pd
import json
import traceback
from typing import Dict, Any

def analyze_data(df: pd.DataFrame, analysis_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if analysis_type == 'pandas':
            operation = params.get('operation')

            if not operation:
                return {'error': 'No operation specified'}

            if operation == 'sort_values':
                # assume the df has a goals
                sorted_df = df.sort_values(by='Goals Scored', ascending=False)
                # Format the results as a table-like structure
                return {
                    'type': 'table',
                    'headers': sorted_df.columns.tolist(),
                    'rows': sorted_df.values.tolist(),
                    'message': 'Successfully sorted data'
                }

            # For other operations
            if hasattr(df, operation):
                result = getattr(df, operation)()

                if isinstance(result, pd.DataFrame):
                    return {
                        'type': 'table',
                        'headers': result.columns.tolist(),
                        'rows': result.values.tolist(),
                        'message': f'Successfully performed {operation}'
                    }
                elif isinstance(result, pd.Series):
                    return {
                        'type': 'series',
                        'name': result.name,
                        'values': result.values.tolist(),
                        'message': f'Successfully performed {operation}'
                    }
                else:
                    return {
                        'type': 'scalar',
                        'value': result,
                        'message': f'Successfully performed {operation}'
                    }

          return {
              'error': f'Operation {operation} not supported',
              'available_methods': dir(df)
          }
    except Exception as e:
        return {
            'error': str(e),
            'traceback': traceback.format_exc()
        }

# Read the analysis parameters
with open('/home/user/analysis_params.json', 'r') as f:
    analysis_params = json.load(f)

# Read the CSV file
df = pd.read_csv('/home/user/data.csv')

# Perform the analysis
result = analyze_data(df, analysis_params['type'], analysis_params['params'])

# Save results with custom encoder
with open('/home/user/results.json', 'w') as f:
    json.dump(result, f)
`;
