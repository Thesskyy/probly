import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
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
          },
        },
        required: ["cellUpdates"],
      },
    },
  },
  {
    type: "function",
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
          start_cell: {
            type: "string",
            description:
              "Start cell reference (e.g., 'A1') where the results should begin.",
          },
        },
        required: ["analysis_goal", "suggested_code", "start_cell"],
      },
    },
  },
];
