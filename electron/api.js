const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatSpreadsheetData(data) {
  if (!data || !Array.isArray(data)) return "";
  return data.reduce((acc, row, rowIndex) => {
    return (
      acc +
      row.reduce((rowAcc, cell, colIndex) => {
        const cellRef = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
        return rowAcc + `<${cellRef}>${cell}</${cellRef}>`;
      }, "") +
      "\n"
    );
  }, "");
}

async function handleLLMRequest(message, spreadsheetData) {
  console.log("Handling LLM request:", { message, spreadsheetData });
  try {
    const spreadsheetContext = spreadsheetData?.length
      ? `Current spreadsheet data:\n${formatSpreadsheetData(spreadsheetData)}\n`
      : "";

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that helps with spreadsheet calculations.
Respond in JSON format with an array of cell updates. Each update should have 'formula' (the Excel formula or text) and 'target' (the cell reference).
Formula can also be a simple text value, e.g. a label for another cell.

Never reuse the same target twice in your response!

Example response: {
  "updates": [
    {"formula": "Sales Tax", "target": "A1"},
    {"formula": "=B1 * 0.08", "target": "B2"}
  ]
}`,
        },
        {
          role: "user",
          content: `${spreadsheetContext}User question: ${message}`,
        },
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(
      completion.choices[0]?.message?.content || '{"updates": []}',
    );

    return response.updates;
  } catch (error) {
    console.error("LLM API error:", error);
    throw error;
  }
}

module.exports = {
  handleLLMRequest,
};
