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
    type: "function" as const,
    function: {
      name: "execute_python_code",
      description:
        "Generate and execute Python code for data analysis using pandas and numpy. The code will be generated based on the user's request.",
      parameters: {
        type: "object",
        properties: {
          analysis_goal: {
            type: "string",
            description:
              "Clear description of what analysis needs to be performed",
          },
          suggested_code: {
            type: "string",
            description:
              "The Python code to execute. Should use pandas and numpy appropriately.",
          },
        },
        required: ["analysis_goal", "suggested_code"],
        additionalProperties: false,
      },
    },
  },
];
