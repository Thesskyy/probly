import { OpenAI } from "openai";
import { system_message } from "@/constants/messages";
import { Sandbox } from "@e2b/code-interpreter";
import { convertToCSV } from "@/utils/dataUtils";
import dotenv from "dotenv";
import { tools } from "@/constants/tools";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});
const model = "gpt-4o";

function formatSpreadsheetData(data: any[][]): string {
  if (!data || !Array.isArray(data)) return "";

  const getColumnRef = (index: number): string => {
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

async function handleLLMRequest(
  message: string,
  spreadsheetData: any[][],
  chatHistory: { role: string; content: string }[],
  res: any,
): Promise<void> {
  try {
    const data = formatSpreadsheetData(spreadsheetData);
    const spreadsheetContext = spreadsheetData?.length
      ? `Current spreadsheet data:\n${data}\n`
      : "";

    const userMessage = `${spreadsheetContext}User question: ${message}`;
    const messages = [
      { role: "system", content: system_message },
      ...chatHistory.slice(-10),
      { role: "user", content: userMessage },
    ];
    // First, try a streaming call without tools
    const stream = await openai.chat.completions.create({
      messages: messages,
      model: model,
      stream: true,
    });

    let accumulatedContent = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        accumulatedContent += content;
        res.write(
          `data: ${JSON.stringify({
            response: content,
            streaming: true,
          })}\n\n`,
        );
      }
    }

    // After streaming text, check if we need tool calls
    const toolCompletion = await openai.chat.completions.create({
      messages: [
        ...messages,
        { role: "assistant", content: accumulatedContent },
      ],
      model: model,
      tools: tools,
      stream: false,
    });

    const assistantMessage = toolCompletion.choices[0]?.message;
    const toolCalls = assistantMessage?.tool_calls;
    console.log("Assistant message>>>", assistantMessage);
    console.log("Tool Calls>>>", toolCalls);
    if (toolCalls?.length) {
      const toolCall = toolCalls[0];
      let toolData: any = {
        response: accumulatedContent,
      };

      if (toolCall.function.name === "set_spreadsheet_cells") {
        const updates = JSON.parse(toolCall.function.arguments).cellUpdates;
        toolData.updates = updates;

        // Add formatted tool data to the response
        toolData.response +=
          "\n\nSpreadsheet Updates:\n" +
          updates
            .map((update) => `${update.target}: ${update.formula}`)
            .join("\n");
      } else if (toolCall.function.name === "create_chart") {
        const args = JSON.parse(toolCall.function.arguments);
        toolData.chartData = {
          type: args.type,
          options: { title: args.title, data: args.data },
        };

        // Add formatted chart data to the response
        toolData.response +=
          "\n\nChart Data:\n" +
          `Type: ${args.type}\n` +
          `Title: ${args.title}\n` +
          `Data:\n${args.data.map((row) => row.join(", ")).join("\n")}`;
      } else if (toolCall.function.name === "execute_python_code") {
        const sandbox = await Sandbox.create();
        const dirname = "/home/user";

        //parse the tool call args
        const { analysis_goal, suggested_code } = JSON.parse(
          toolCall.function.arguments,
        );

        const csvData = convertToCSV(spreadsheetData);

        // write data file
        await sandbox.files.write(`${dirname}/data.csv`, csvData);

        // create python script with suggested code
        const pythonScript = `
          import pandas as pd
          import numpy as np

          # Read the data
          df = pd.read_csv('/home/user/data.csv')

          # Execute analysis
          ${suggested_code}
          `;
        console.log("Python Script", pythonScript);

        const execution = await sandbox.runCode(pythonScript, {
          onResult: (result) => console.log("result:", result),
        });

        console.log("Code execution finished!");

        toolData = {
          response: `Analysis: ${analysis_goal}\n\nResults:\n${execution.logs.stdout}`,
          analysis: {
            goal: analysis_goal,
            output: execution.logs.stdout,
            error: execution.logs.stderr,
          },
        };
      }

      res.write(
        `data: ${JSON.stringify({
          ...toolData,
          streaming: false,
        })}\n\n`,
      );
    } else {
      res.write(
        `data: ${JSON.stringify({
          response: accumulatedContent,
          streaming: false,
        })}\n\n`,
      );
    }
  } catch (error: any) {
    console.error("LLM API error:", error);
    res.write(
      `data: ${JSON.stringify({ error: error.message || "Unknown error" })}\n\n`,
    );
  } finally {
    res.end();
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method === "POST") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const { message, spreadsheetData, chatHistory } = req.body;
      await handleLLMRequest(message, spreadsheetData, chatHistory, res);
    } catch (error: any) {
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
