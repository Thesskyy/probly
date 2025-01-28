import Sandbox, { runCode } from "@e2b/code-interpreter";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

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

const isAnalysisRequest = (message) => {
  const lowerCaseMessage = message.toLowerCase();
  return lowerCaseMessage.includes("sort");
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

async function handleLLMRequest(message, spreadsheetData, res) {
  try {
    const data = formatSpreadsheetData(spreadsheetData);
    const spreadsheetContext = spreadsheetData?.length
      ? `Current spreadsheet data:\n${data}\n`
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

    const response = JSON.parse(completion.choices[0]?.message?.content);
    let pythonCode = "";

    // Run Python code in the sandbox
    if (isAnalysisRequest(message)) {
      //construct the python script with the function call to analysis.py
      pythonCode = `
        import pandas as pd
        import os

        # Load the data from the string passed from node, and make sure empty strings are converted to null values
        data = ${data};
        df = pd.DataFrame(data).replace('', None)

        print(df.columns.tolist())
        `;
      const sbx = await Sandbox.create();
      const result = await sbx.runCode(pythonCode);
      const { stdout, stderr, error, results } = result;
      console.log(result.logs);
      console.log("python output:", stdout, stderr);

      if (error) {
        res.write(
          `data: ${JSON.stringify({ error: `Error running python code: ${error} ${stderr} ${stdout}` })}\n\n`,
        );
        return;
      }
    }

    if (isChartRequest(message) && response.chartData) {
      // Send chart data as a complete JSON object
      res.write(
        `data: ${JSON.stringify({ chartData: response.chartData })}\n\n`,
      );
    } else if (response.updates) {
      res.write(`data: ${JSON.stringify({ updates: response.updates })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({})}\n\n`);
    }
  } catch (error) {
    console.error("LLM API error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.end();
  }
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const { message, spreadsheetData } = req.body;
      await handleLLMRequest(message, spreadsheetData, res);
    } catch (error) {
      console.error("Error processing LLM request:", error);
      res.write(
        `data: ${JSON.stringify({ error: "Failed to process request" })}\n\n`,
      );
      res.end();
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
