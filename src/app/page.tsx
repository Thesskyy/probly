"use client";

import dynamic from "next/dynamic";
import ChatBox from "@/components/ChatBox";
import { useState, useEffect } from "react";
import {
  SpreadsheetProvider,
  useSpreadsheet,
} from "@/context/SpreadsheetContext";

const Spreadsheet = dynamic(() => import("@/components/Spreadsheet"), {
  ssr: false,
  loading: () => <div>Loading spreadsheet...</div>,
});

const SpreadsheetApp = () => {
  const [spreadsheetData, setSpreadsheetData] = useState<any[][]>([]);
  const { setFormulas } = useSpreadsheet();
  const [isElectron, setIsElectron] = useState(false);
  const [electronAPIAvailable, setElectronAPIAvailable] = useState(false);

  useEffect(() => {
    // Check for Electron API availability after component mounts
    const checkElectronAvailability = () => {
      const hasElectronAPI = typeof window !== "undefined" && !!window.electron;
      setElectronAPIAvailable(hasElectronAPI);
      setIsElectron(hasElectronAPI);

      if (hasElectronAPI) {
        console.log("Electron environment detected!");
        // Test the connection
        window.electron
          .invoke("test-connection", { test: true })
          .then((result) => console.log("Electron test successful:", result))
          .catch((err) => console.error("Electron test failed:", err));
      } else {
        console.log("Web environment detected");
      }
    };

    checkElectronAvailability();
  }, []);

  const handleSend = async (message: string) => {
    console.log("Environment check:", {
      isElectron,
      hasElectronAPI: electronAPIAvailable,
    });

    try {
      let updates;

      if (isElectron && window?.electron) {
        console.log("Using Electron IPC...");
        updates = await window.electron.invoke("llm-request", {
          message,
          spreadsheetData,
        });
      } else {
        console.log("Using Web API...");
        const response = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            spreadsheetData,
          }),
        });
        updates = await response.json();
      }

      console.log("Received updates:", updates);

      if (Array.isArray(updates)) {
        setFormulas(updates);
      }

      return updates;
    } catch (error) {
      console.error("Error in handleSend:", error);
      throw error;
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Magic Spreadsheet</h1>
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
