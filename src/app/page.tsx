'use client';

import dynamic from 'next/dynamic';
import ChatBox from '@/components/ChatBox';
import { useState } from 'react';
import { SpreadsheetProvider, useSpreadsheet } from '@/context/SpreadsheetContext';

const Spreadsheet = dynamic(() => import('@/components/Spreadsheet'), {
  ssr: false,
  loading: () => <div>Loading spreadsheet...</div>
});

const SpreadsheetApp = () => {
  const [spreadsheetData, setSpreadsheetData] = useState<any[][]>([]);
  const { setFormulas } = useSpreadsheet();

  const handleSend = async (message: string) => {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        spreadsheetData
      })
    });
    const updates = await response.json();

    if (Array.isArray(updates)) {
      setFormulas(updates);
    }

    return updates;
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Excel-like Spreadsheet</h1>
      <Spreadsheet onDataChange={setSpreadsheetData} />
      <ChatBox onSend={handleSend} />
    </main>
  );
};

export default function Home() {
  return (
    <SpreadsheetProvider>
      <SpreadsheetApp />
    </SpreadsheetProvider>
  );
}
