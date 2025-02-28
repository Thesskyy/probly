"use client";

import {} from "@/lib/file/import";

import { CellUpdate, ChatMessage } from "@/types/api";
import {
  SpreadsheetProvider,
  useSpreadsheet,
} from "@/context/SpreadsheetContext";
import { useEffect, useRef, useState } from "react";

import ChatBox from "@/components/ChatBox";
import { MessageCircle } from "lucide-react";
import type { SpreadsheetRef } from "@/components/Spreadsheet";
import dynamic from "next/dynamic";
import { fileExport } from "@/lib/file/export";
import path from "path";
import { prepareChatHistory } from "@/utils/chatUtils";

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
  const abortController = useRef<AbortController | null>(null);

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

  const handleStop = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  const handleSend = async (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      response: "",
      timestamp: new Date(),
      status: "pending",
      streaming: true,
    };
    setChatHistory((prev) => [...prev, newMessage]);

    try {
      // Create new AbortController for this request
      abortController.current = new AbortController();

      const formattedHistory = prepareChatHistory(chatHistory);
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          spreadsheetData,
          chatHistory: formattedHistory,
        }),
        signal: abortController.current.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Could not read response stream.");
      }

      let accumulatedResponse = "";
      let updates: CellUpdate[] | undefined;
      let chartData: any | undefined;
      let lastParsedData: any | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const events = chunk.split("\n\n").filter(Boolean);

        for (const event of events) {
          if (event.startsWith("data: ")) {
            const jsonData = event.substring(6);
            try {
              const parsedData = JSON.parse(jsonData);
              lastParsedData = parsedData;
              if (parsedData.response) {
                if (parsedData.streaming) {
                  // For streaming content, append to the existing response
                  accumulatedResponse += parsedData.response;
                } else {
                  // For final content, replace the entire response
                  accumulatedResponse = parsedData.response;
                }

                updates = parsedData.updates;
                chartData = parsedData.chartData;
              }

              // Update the chat message with current state
              setChatHistory((prev) =>
                prev.map((msg) =>
                  msg.id === newMessage.id
                    ? {
                        ...msg,
                        response: accumulatedResponse,
                        updates: updates,
                        chartData: chartData,
                        analysis: parsedData?.analysis,
                        streaming: parsedData.streaming ?? false,
                        status: updates || chartData ? "pending" : null,
                      }
                    : msg,
                ),
              );

              // Update chart if present
              if (chartData) {
                setChartData(chartData);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      // Final update
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                response: accumulatedResponse,
                updates: updates,
                chartData: chartData,
                analysis: lastParsedData?.analysis,
                streaming: false,
                status: updates || chartData ? "pending" : null,
              }
            : msg,
        ),
      );
    } catch (error: unknown) {
      if ((error as Error).name === "AbortError") {
        console.log("Request Aborted");
        // Handle abort case
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  response: msg.response + "\n[Generation stopped]",
                  streaming: false,
                }
              : msg,
          ),
        );
      } else {
        // Handle other errors
        console.error("Error in handleSend:", error);
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  response: `Error: ${
                    error instanceof Error
                      ? error.message
                      : "An unknown error occurred"
                  }`,
                  streaming: false,
                }
              : msg,
          ),
        );
      }
    } finally {
      abortController.current = null;
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
          Probly
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
              onStop={handleStop}
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
