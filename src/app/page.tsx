"use client";
import { X, Minus, Maximize2, MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import ChatBox from "@/components/ChatBox";
import { useState, useEffect } from "react";
import {
  SpreadsheetProvider,
  useSpreadsheet,
} from "@/context/SpreadsheetContext";
import { CellUpdate, ChatMessage } from "@/types/api";
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

      const formattedResponse = Array.isArray(updates)
        ? updates
            .map((update) => `${update.target}: ${update.formula}`)
            .join("\n")
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
      {/* Header Bar */}
      <div className="h-10 border-b border-gray-200 bg-white flex items-center justify-between px-4">
        <div className="text-sm font-medium text-gray-600">
          Magic Spreadsheet
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Minus size={16} />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Maximize2 size={16} />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded text-red-500">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="flex gap-4 h-full relative">
          <div className="flex-1 bg-white rounded-lg shadow-sm">
            <Spreadsheet onDataChange={handleDataChange} />
          </div>
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

      {/* Footer Bar */}
      <div className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Add other footer tools here */}
        </div>
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
