"use client";

import dynamic from "next/dynamic";
import ChatBox from "@/components/ChatBox";
import { useState, useEffect } from "react";
import {
  SpreadsheetProvider,
  useSpreadsheet,
} from "@/context/SpreadsheetContext";
import { MessageCircle } from "lucide-react";

const Spreadsheet = dynamic(() => import("@/components/Spreadsheet"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 h-full flex items-center justify-center bg-gray-50 border rounded-lg">
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "?") {
        setIsChatOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Load chat state
  useEffect(() => {
    const savedState = localStorage.getItem("chatOpen");
    if (savedState) {
      setIsChatOpen(JSON.parse(savedState));
    }
  }, []);

  // Save chat state
  useEffect(() => {
    localStorage.setItem("chatOpen", JSON.stringify(isChatOpen));
  }, [isChatOpen]);

  // Load chat history
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

  // Save chat history
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Check Electron availability
  useEffect(() => {
    const checkElectronAvailability = () => {
      const hasElectronAPI = typeof window !== "undefined" && !!window.electron;
      setElectronAPIAvailable(hasElectronAPI);
      setIsElectron(hasElectronAPI);

      if (hasElectronAPI) {
        console.log("Electron environment detected!");
        window.electron
          ?.invoke("test-connection", { test: true })
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
    <main className="h-screen w-screen bg-gray-50 overflow-hidden">
      <div className="h-full p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Magic Spreadsheet
        </h1>
        <div className="flex gap-4 flex-1 relative">
          <div className="flex-1 bg-white rounded-lg shadow-sm">
            <Spreadsheet onDataChange={handleDataChange} />
          </div>
          {/* Updated ChatBox container */}
          <div
            className={`fixed right-4 top-[5.5rem] bottom-4 w-96 transition-transform duration-300 transform ${
              isChatOpen ? "translate-x-0" : "translate-x-full"
            }`}
            style={{
              backgroundColor: "white",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
              zIndex: 9999,
            }}
          >
            <ChatBox
              onSend={handleSend}
              chatHistory={chatHistory}
              clearHistory={handleClearHistory}
            />
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors z-50"
        title="Toggle Chat (Ctrl+Shift+/)"
      >
        <MessageCircle size={24} />
      </button>
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
