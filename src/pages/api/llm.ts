import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

import { CellUpdate } from "@/types/api";
import { OpenAI } from "openai";
import { PyodideSandbox } from "@/utils/pyodideSandbox";
import { SYSTEM_MESSAGE } from "@/constants/messages";
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
  chatHistory: ChatCompletionMessageParam[],
  res: any,
): Promise<void> {
  let aborted = false;
  let sandbox: PyodideSandbox | null = null;

  // Set up disconnect handler
  res.on("close", () => {
    aborted = true;
    console.log("Client disconnected");
  });

  try {
    const data = formatSpreadsheetData(spreadsheetData);
    const spreadsheetContext = spreadsheetData?.length
      ? `Current spreadsheet data:\n${data}\n`
      : "";

    const userMessage = `${spreadsheetContext}User question: ${message}`;
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_MESSAGE },
      ...chatHistory.slice(-10),
      { role: "user", content: userMessage },
    ];

    // First streaming call
    const stream = await openai.chat.completions.create({
      messages,
      model: model,
      stream: true,
    });

    let accumulatedContent = "";
    for await (const chunk of stream) {
      // Check if client disconnected
      if (aborted) {
        console.log("Aborting stream processing");
        await stream.controller.abort();
        return;
      }

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

    // Check again before making the tool call
    if (aborted) return;

    // Tool completion call
    const toolCompletion = await openai.chat.completions.create({
      messages: [
        ...messages,
        { role: "assistant", content: accumulatedContent },
      ],
      model: model,
      tools: tools as ChatCompletionTool[],
      stream: false,
    });

    // Check if aborted before processing tool calls
    if (aborted) return;

    const assistantMessage = toolCompletion.choices[0]?.message;
    const toolCalls = assistantMessage?.tool_calls;

    if (toolCalls?.length) {
      const toolCall = toolCalls[0];
      let toolData: any = {
        response: accumulatedContent,
      };

      if (toolCall.function.name === "set_spreadsheet_cells") {
        if (aborted) return;
        const updates = JSON.parse(toolCall.function.arguments).cellUpdates;
        toolData.updates = updates;

        toolData.response +=
          "\n\nSpreadsheet Updates:\n" +
          updates
            .map((update: any) => `${update.target}: ${update.formula}`)
            .join("\n");
      } else if (toolCall.function.name === "create_chart") {
        if (aborted) return;
        const args = JSON.parse(toolCall.function.arguments);
        toolData.chartData = {
          type: args.type,
          options: { title: args.title, data: args.data },
        };

        toolData.response +=
          "\n\nChart Data:\n" +
          `Type: ${args.type}\n` +
          `Title: ${args.title}\n` +
          `Data:\n${args.data.map((row: any[]) => row.join(", ")).join("\n")}`;
      } else if (toolCall.function.name === "execute_python_code") {
        try {
          if (aborted) return;
          sandbox = new PyodideSandbox();
          await sandbox.initialize();

          const { analysis_goal, suggested_code, start_cell } = JSON.parse(
            toolCall.function.arguments,
          );    
          console.log("SUGGESTED CODE >>>", suggested_code);
          console.log("START CELL >>>", start_cell);
          console.log("ANALYSIS GOAL >>>", analysis_goal);

          if (aborted) {
            await sandbox.destroy();
            return;
          }

          const csvData = convertToCSV(spreadsheetData);
          const result = await sandbox.runDataAnalysis(suggested_code, csvData);

          if (aborted) {
            await sandbox.destroy();
            return;
          }

          console.log("RESULT >>>", result);
          // Parse the stdout output to generate cell updates
          const outputRows = result.stdout.trim().split("\n").map((row)=> row.split(","));
          
          console.log("OUTPUT ROWS >>>", outputRows);
          
          const colLetter = start_cell.match(/[A-Z]+/)[0];
          const rowNumber = parseInt(start_cell.match(/\d+/)[0]);

          const generatedUpdates: CellUpdate[][] = outputRows.map(
            (row, rowIndex) => row.map((value, colIndex) => ({
              target: `${String.fromCharCode(colLetter.charCodeAt(0) + colIndex)}${rowNumber + rowIndex}`,
              formula: value.toString()
            }))
          );
          console.log("GENERATED UPDATES >>>", generatedUpdates);
          toolData = {
            response: `Analysis: ${analysis_goal}\n\nResults:\n${result.stdout}`,
            updates: generatedUpdates,
            analysis: {
              goal: analysis_goal,
              output: result.stdout,
              error: result.stderr,
            },
          };
        } catch (error) {
          console.error("Error executing Python code:", error);
          toolData = {
            response: "An error occurred while executing the Python code.",
          };
        } finally {
          if (sandbox) {
            await sandbox.destroy();
          }
        }
      }

      // Only send response if not aborted
      if (!aborted) {
        res.write(
          `data: ${JSON.stringify({
            ...toolData,
            streaming: false,
          })}\n\n`,
        );
      }
    } else if (!aborted) {
      res.write(
        `data: ${JSON.stringify({
          response: accumulatedContent,
          streaming: false,
        })}\n\n`,
      );
    }
  } catch (error: any) {
    if (!aborted) {
      console.error("LLM API error:", error);
      res.write(
        `data: ${JSON.stringify({ error: error.message || "Unknown error" })}\n\n`,
      );
    }
  } finally {
    // Ensure sandbox is destroyed if it exists
    if (sandbox) {
      await sandbox.destroy();
    }
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method === "POST") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Create a promise that resolves when the client disconnects
    const disconnectPromise = new Promise((resolve) => {
      res.on("close", () => {
        resolve(undefined);
      });
    });

    try {
      const { message, spreadsheetData, chatHistory } = req.body;
      // Race between the LLM request and the client disconnecting
      await Promise.race([
        handleLLMRequest(message, spreadsheetData, chatHistory, res),
        disconnectPromise,
      ]);
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