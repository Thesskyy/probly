"use client";
import { X, Minus, Maximize2, MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import ChatBox from "@/components/ChatBox";
import { useState, useEffect, useRef } from "react";
import {
  SpreadsheetProvider,
  useSpreadsheet,
} from "@/context/SpreadsheetContext";
import { CellUpdate, ChatMessage } from "@/types/api";
import type { SpreadsheetRef } from "@/components/Spreadsheet";
import SpreadsheetToolbar from "@/components/SpreadsheetToolbar";
import path from "path";

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
  const [isElectron, setIsElectron] = useState(false);
  const [electronAPIAvailable, setElectronAPIAvailable] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const spreadsheetRef = useRef<SpreadsheetRef>(null);

  // Check for Electron environment and set up file handling
  useEffect(() => {
    if (window.electron) {
      const handleImport = async (filePath: string) => {
        try {
          console.log("Attempting to import file:", filePath);
          const buffer = await window.electron.invoke("read-file", filePath);
          console.log("File read successfully, creating File object...");

          // Create a more detailed file object
          const fileName = filePath.split("/").pop() || "spreadsheet";
          const fileType = fileName.split(".").pop()?.toLowerCase() || "";
          let mimeType = "application/octet-stream";

          if (fileType === "xlsx" || fileType === "xls") {
            mimeType =
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          } else if (fileType === "csv") {
            mimeType = "text/csv";
          }

          const file = new File([new Uint8Array(buffer)], fileName, {
            type: mimeType,
          });

          console.log("Importing file...");
          await spreadsheetRef.current?.handleImport(file);
          console.log("Import completed successfully");
        } catch (error) {
          console.error("Error importing file:", error);
        }
      };

      const handleExport = () => {
        spreadsheetRef.current?.handleExport();
      };

      // Set up both listeners to cal the same import function
      window.electron.onFileImported(handleImport);
      window.electron.on("menu:import", handleImport);
      window.electron.on("menu:export", handleExport);

      return () => {
        window.electron.removeListener("file-imported", handleImport);
        window.electron.removeListener("menu:import", handleImport);
        window.electron.removeListener("menu:export", handleExport);
      };
    }
  }, []);

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

  // Check for Electron availability
  useEffect(() => {
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
    try {
      let response;
      if (isElectron && window?.electron) {
        console.log("Using Electron IPC...");
        response = await window.electron.invoke("llm-request", {
          message,
          spreadsheetData,
        });
      } else {
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
        response = await fetchResponse.json();
      }
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

  const handleMinimize = () => {
    window.electron?.invoke("minimize-window");
  };

  const handleMaximize = () => {
    window.electron?.invoke("maximize-window");
  };

  const handleClose = () => {
    window.electron?.invoke("close-window");
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Title bar */}
      <div className="h-10 border-b border-gray-200 bg-white flex items-center justify-between px-4">
        <div className="text-sm font-medium text-gray-600">
          Magic Spreadsheet
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 hover:bg-gray-100 rounded"
            onClick={handleMinimize}
          >
            <Minus size={16} />
          </button>
          <button
            className="p-1.5 hover:bg-gray-100 rounded"
            onClick={handleMaximize}
          >
            <Maximize2 size={16} />
          </button>
          <button
            className="p-1.5 hover:bg-gray-100 rounded text-red-500"
            onClick={handleClose}
          >
            <X size={16} />
          </button>
        </div>
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
