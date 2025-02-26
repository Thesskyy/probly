import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Formats 2D array data into a structured XML-like string representation
 * @param data - 2D array of spreadsheet data
 * @returns Formatted string with cell references
 */
export function formatSpreadsheetData(data: any[][]): string {
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

/**
 * Structures raw analysis output into a clean tabular format using LLM
 * @param rawOutput - The raw output from Python analysis
 * @param analysisGoal - The goal/context of the analysis
 * @returns Promise<string> - Structured CSV-like output with headers
 */
export async function structureAnalysisOutput(rawOutput: string, analysisGoal: string): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `Convert the following analysis output into a clean tabular format. 
      Each row should be comma-separated values, with the first row being headers.
      Ensure numbers are properly formatted and aligned.
      The output should be ready to insert into a spreadsheet.`
    },
    {
      role: "user", 
      content: `Analysis Goal: ${analysisGoal}\n\nRaw Output:\n${rawOutput}\n\nConvert this into comma-separated rows with headers.`
    }
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.1,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Parses structured output into cell updates
 * @param structuredOutput - The CSV-like structured output
 * @param startCell - Starting cell reference (e.g. 'A1')
 * @returns Array of cell updates
 */
export function generateCellUpdates(structuredOutput: string, startCell: string) {
  const outputRows = structuredOutput.trim().split('\n')
    .map(row => row.split(',').map(cell => cell.trim()));
  
  const colLetter = startCell.match(/[A-Z]+/)?.[0] || 'A';
  const rowNumber = parseInt(startCell.match(/\d+/)?.[0] || '1');

  return outputRows.map((row, rowIndex) => 
    row.map((value, colIndex) => ({
      target: `${String.fromCharCode(colLetter.charCodeAt(0) + colIndex)}${rowNumber + rowIndex}`,
      formula: value.toString()
    }))
  );
} 