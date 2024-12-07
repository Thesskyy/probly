import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatSpreadsheetData(data: any[][]): string {
  return data.reduce((acc, row, rowIndex) => {
    return acc + row.reduce((rowAcc, cell, colIndex) => {
      const cellRef = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
      return rowAcc + `<${cellRef}>${cell}</${cellRef}>`;
    }, '') + '\n';
  }, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { message, spreadsheetData } = req.body;

    const spreadsheetContext = spreadsheetData?.length
      ? `Current spreadsheet data:\n${formatSpreadsheetData(spreadsheetData)}\n`
      : '';

    console.log('spreadsheetContext', spreadsheetContext);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

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
}`
        },
        {
          role: "user",
          content: `${spreadsheetContext}User question: ${message}`
        }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{"updates": []}');
    console.log('response', response);
    if (!Array.isArray(response.updates)) {
      throw new Error('Expected array response from LLM');
    }

    res.status(200).json(response.updates);

  } catch (error: any) {
    console.error('LLM API error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
