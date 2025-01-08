const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const isChartRequest = (message) => {
  const lowerCaseMessage = message.toLowerCase();
  return (
    lowerCaseMessage.includes("chart") ||
    lowerCaseMessage.includes("graph") ||
    lowerCaseMessage.includes("plot")
  );
};

function formatSpreadsheetData(data) {
  if (!data || !Array.isArray(data)) return "";

  const getColumnRef = (index) => {
    let columnRef = "";
    while (index >= 0) {
      columnRef = String.fromCharCode((index % 26) + 65) + columnRef;
      index = Math.floor(index / 26) - 1;
    }
    return columnRef;
  };

  return data.reduce((acc, row, rowIndex) => {
    return (
      acc +
      row.reduce((rowAcc, cell, colIndex) => {
        const cellRef = `${getColumnRef(colIndex)}${rowIndex + 1}`;
        return rowAcc + `<${cellRef}>${cell}</${cellRef}>`;
      }, "") +
      "\n"
    );
  }, "");
}

async function handleLLMRequest(message, spreadsheetData) {
  try {
    const spreadsheetContext = spreadsheetData?.length
      ? `Current spreadsheet data:\n${formatSpreadsheetData(spreadsheetData)}\n`
      : "";

    console.log("Spreadsheet context:", spreadsheetContext);

    let systemMessage = `You are a helpful assistant that helps with spreadsheet calculations.
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

    const userMessage = `${spreadsheetContext}User question: ${message}`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(
      completion.choices[0]?.message?.content || '{"updates": []}',
    );

    if (isChartRequest(message) && response.chartData) {
      return { chartData: response.chartData };
    }

    return response.updates ? { updates: response.updates } : {};
  } catch (error) {
    console.error("LLM API error:", error);
    throw error;
  }
}

module.exports = {
  handleLLMRequest,
};
