export const tools = [
  {
    type: "function" as const,
    function: {
      name: "set_spreadsheet_cells",
      description: "Set values to specified spreadsheet cells",
      parameters: {
        type: "object",
        properties: {
          cellUpdates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                formula: { type: "string" },
                target: { type: "string" },
              },
              required: ["formula", "target"],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      },
      required: ["cellUpdates"],
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_chart",
      description:
        "Create a chart in the spreadsheet based on the type of chart specified by the user",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["line", "bar", "pie", "scatter"],
            description: "The type of chart to create",
          },
          title: {
            type: "string",
            description: "The title of the chart",
          },
          data: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: ["string", "number"],
              },
            },
            description:
              "The data for the chart, first row should contain headers",
          },
        },
        required: ["type", "title", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_python_code",
      description:
        "Execute Python code for complex data analysis and return results as cell updates",
      parameters: {
        type: "object",
        properties: {
          analysis_goal: {
            type: "string",
            description: "Description of what the analysis aims to achieve",
          },
          suggested_code: {
            type: "string",
            description: "Python code to execute the analysis",
          },
          cell_updates: {
            type: "array",
            description:
              "Array of target cell locations where the Python output should be placed. DO NOT include computed values, only target locations.",
            items: {
              type: "object",
              properties: {
                target: {
                  type: "string",
                  description:
                    "Target cell reference (e.g., 'A1') where results should be placed",
                },
                formula: {
                  type: "string",
                  description:
                    "Leave empty or use placeholder. Actual values will be populated from Python execution results.",
                },
              },
              required: ["target", "formula"],
            },
          },
        },
        required: ["analysis_goal", "suggested_code", "cell_updates"],
      },
    },
  },
];
