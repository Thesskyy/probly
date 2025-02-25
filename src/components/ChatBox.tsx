import { CellUpdate, ChatMessage } from "@/types/api";
import { Check, Loader2, Send, Square, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ToolResponse from './ToolResponse';

interface ChatBoxProps {
  onSend: (message: string) => Promise<void>;
  onStop: () => void;
  onAccept: (updates: CellUpdate[], messageId: string) => void;
  onReject: (messageId: string) => void;
  chatHistory: ChatMessage[];
  clearHistory: () => void;
}

const ChatBox = ({
  onSend,
  onStop,
  onAccept,
  onReject,
  chatHistory,
  clearHistory,
}: ChatBoxProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      setIsLoading(!!lastMessage.streaming);
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (message.trim() || isLoading) {
      if (isLoading) {
        onStop();
        setIsLoading(false);
        return;
      }
      const currentMessage = message;
      setMessage("");
      setIsLoading(true);
      try {
        await onSend(currentMessage);
      } catch (error) {
        console.error("Error details:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white z-10">
        <div>
          <h2 className="font-semibold text-gray-800">AI Assistant</h2>
          <p className="text-xs text-gray-500">
            Ask me about spreadsheet formulas
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
          title="Clear chat history"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-center">
              Try asking me to create formulas or analyze your data
            </p>
          </div>
        ) : (
          chatHistory.map((chat) => (
            <div key={chat.id} className="space-y-3 animate-fadeIn">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] shadow-sm hover:shadow-md transition-shadow duration-200">
                  <p className="text-sm break-words">{chat.text}</p>
                  <span className="text-xs opacity-75 mt-1 block">
                    {new Date(chat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
                  <div className="text-sm text-gray-800 break-words">
                    {chat.streaming ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-xs">AI is generating response...</span>
                        </div>
                        <div className="border-l-2 border-blue-200 pl-3 font-mono">
                          {chat.response}
                        </div>
                      </div>
                    ) : (
                      <ToolResponse
                        response={chat.response}
                        updates={chat.updates}
                        chartData={chat.chartData}
                        analysis={chat.analysis}
                        status={chat.status}
                        onAccept={() => onAccept(chat.updates || [], chat.id)}
                        onReject={() => onReject(chat.id)}
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(chat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 items-end relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none min-h-[80px] bg-white text-gray-800 transition-all duration-200"
            placeholder="Type your message..."
            disabled={isLoading}
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() && !isLoading}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full transition-all duration-200 disabled:cursor-not-allowed h-11 w-11 flex items-center justify-center group"
            title={isLoading ? "Stop generating" : "Send message"}
          >
            {isLoading ? (
              <Square size={18} className="fill-current animate-pulse" />
            ) : (
              <Send size={18} className="group-hover:scale-110 transition-transform duration-200" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
