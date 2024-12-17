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
  loading: () => (
    <div className="flex-1 h-[70vh] flex items-center justify-center bg-gray-50 border rounded-lg">
      <div className="text-gray-500">Loading spreadsheet...</div>
    </div>
  ),
});

interface ChatMessage {
  id: string;
  text: string;
  response: string;
  timestamp: Date;
}

const SpreadsheetApp = () => {
  const [spreadsheetData, setSpreadsheetData] = useState<any[][]>([]);
  const { setFormulas } = useSpreadsheet();
  const [isElectron, setIsElectron] = useState(false);
  const [electronAPIAvailable, setElectronAPIAvailable] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setChatHistory(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        );
      } catch (error) {
        console.error("Error loading chat history:", error);
        localStorage.removeItem("chatHistory");
      }
    }
  }, []);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    // Check for Electron API availability after component mounts
    const checkElectronAvailability = () => {
      const hasElectronAPI = typeof window !== "undefined" && !!window.electron;
      setElectronAPIAvailable(hasElectronAPI);
      setIsElectron(hasElectronAPI);

      if (hasElectronAPI) {
        console.log("Electron environment detected!");
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        updates = await response.json();
      }

      console.log("Received updates:", updates);

      if (Array.isArray(updates)) {
        setFormulas(updates);

        const formattedResponse = updates
          .map((update) => `${update.target}: ${update.formula}`)
          .join("\n");

        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text: message,
          response: formattedResponse,
          timestamp: new Date(),
        };

        setChatHistory((prev) => [...prev, newMessage]);
      }

      return updates;
    } catch (error) {
      console.error("Error in handleSend:", error);

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        response: `Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, errorMessage]);
      throw error;
    }
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("chatHistory");
  };

  const handleDataChange = (data: any[][]) => {
    setSpreadsheetData(data);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-[1800px] mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Magic Spreadsheet
        </h1>
        <div className="flex gap-4">
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <Spreadsheet onDataChange={handleDataChange} />
          </div>
          <div className="w-96">
            <ChatBox
              onSend={handleSend}
              chatHistory={chatHistory}
              clearHistory={handleClearHistory}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

const HomePage = () => {
  return (
    <SpreadsheetProvider>
      <SpreadsheetApp />
    </SpreadsheetProvider>
  );
};

export default HomePage;
