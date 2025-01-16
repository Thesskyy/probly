"use client";
import { MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import ChatBox from "@/components/ChatBox";
import { useState, useEffect, useRef } from "react";
import {
  SpreadsheetProvider,
  useSpreadsheet,
} from "@/context/SpreadsheetContext";
import { CellUpdate, ChatMessage } from "@/types/api";
import type { SpreadsheetRef } from "@/components/Spreadsheet";
import path from "path";
import { fileImport } from "@/lib/file/import";
import { fileExport } from "@/lib/file/export";

const Spreadsheet = dynamic(() => import("@/components/Spreadsheet"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 h-full flex items-center justify-center bg-gray-50 border rounded-lg">
      <div className="text-gray-500">Loading spreadsheet...</div>
    </div>
  ),
});

const SpreadsheetApp = () => {
  const [spreadsheetData, setSpreadsheetData] = useState<any[][]>([]);
  const { setFormulas, setChartData } = useSpreadsheet();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const spreadsheetRef = useRef<SpreadsheetRef>(null);

  // Keyboard shortcut for chat toggle
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "?") {
        setIsChatOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Load chat open state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("chatOpen");
    if (savedState) {
      setIsChatOpen(JSON.parse(savedState));
    }
  }, []);

  // Save chat open state to localStorage
  useEffect(() => {
    localStorage.setItem("chatOpen", JSON.stringify(isChatOpen));
  }, [isChatOpen]);

  // Load chat history from localStorage
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

  // Save chat history to localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleSend = async (message: string) => {
    try {
      console.log("Using Web API...");
      const fetchResponse = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          spreadsheetData,
        }),
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }
      const response = await fetchResponse.json();
      let updates, chartData;
      if (response.updates) {
        updates = response.updates;
      } else if (response.chartData) {
        chartData = response.chartData;
      }

      const formattedResponse = updates
        ? updates
            .map((update) => `${update.target}: ${update.formula}`)
            .join("\n")
        : chartData
          ? "Chart generated"
          : "No updates available";

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        response: formattedResponse,
        timestamp: new Date(),
        status: "pending",
        updates: updates,
      };

      setChatHistory((prev) => [...prev, newMessage]);
      if (updates) {
        return updates;
      } else if (chartData) {
        setChartData(chartData);
      }
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

  const handleAccept = (updates: CellUpdate[], messageId: string) => {
    setFormulas(updates);
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "accepted" } : msg,
      ),
    );
  };

  const handleReject = (messageId: string) => {
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "rejected" } : msg,
      ),
    );
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("chatHistory");
  };

  const handleDataChange = (data: any[][]) => {
    setSpreadsheetData(data);
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Title bar */}
      <div className="h-10 border-b border-gray-200 bg-white flex items-center justify-between px-4">
        <div className="text-sm font-medium text-gray-600">
          Magic Spreadsheet
        </div>
        <div className="flex items-center gap-2"></div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="flex gap-4 h-full relative">
          <div className="flex-1 bg-white rounded-lg shadow-sm">
            <Spreadsheet ref={spreadsheetRef} onDataChange={handleDataChange} />
          </div>
          {/* Chat sidebar */}
          <div
            className={`fixed right-4 top-[5.5rem] bottom-16 w-96 transition-transform duration-300 transform ${
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
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-2"></div>
        <button
          onClick={() => setIsChatOpen((prev) => !prev)}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Toggle Chat (Ctrl+Shift+/)"
        >
          <MessageCircle size={20} />
        </button>
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
