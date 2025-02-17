import { useState } from "react";
import { CellUpdate, ChatMessage } from "@/types/api";
import { Check, X, Send, Trash2, Loader2, Square } from "lucide-react";

interface ChatBoxProps {
  onSend: (message: string) => Promise<void>; // Changed to void
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
        await onSend(currentMessage); // Changed to await for streaming
      } catch (error) {
        console.error("Error details:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg z-50">
        <div>
          <h2 className="font-semibold text-gray-800">AI Assistant</h2>
          <p className="text-xs text-gray-500">
            Ask me about spreadsheet formulas
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
            <div key={chat.id} className="space-y-2">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] shadow-sm">
                  <p className="text-sm">{chat.text}</p>
                  <span className="text-xs opacity-75 mt-1 block">
                    {new Date(chat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] shadow-sm border border-gray-200">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {chat.response}
                  </pre>
                  {chat.streaming && (
                    <div className="mt-2 text-gray-500 text-xs flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  )}

                  {/* Accept/Reject Buttons */}
                  {!chat.streaming &&
                    chat.status === "pending" &&
                    chat.updates && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => onAccept(chat.updates!, chat.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded-full text-sm flex items-center gap-1 hover:bg-green-600 transition-colors"
                        >
                          <Check size={14} />
                          Apply
                        </button>
                        <button
                          onClick={() => onReject(chat.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-full text-sm flex items-center gap-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    )}

                  {/* Status Indicator */}
                  {!chat.streaming && chat.status === "accepted" && (
                    <div className="mt-2 text-green-500 text-xs flex items-center gap-1">
                      <Check size={14} />
                      Applied
                    </div>
                  )}
                  {!chat.streaming && chat.status === "rejected" && (
                    <div className="mt-2 text-red-500 text-xs flex items-center gap-1">
                      <X size={14} />
                      Rejected
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex gap-2 items-end">
          {" "}
          {/* Changed to items-end */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none min-h-[80px]"
            placeholder="Type your message..."
            disabled={isLoading}
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() && !isLoading}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed h-10 w-10 flex items-center justify-center"
            title={isLoading ? "Stop generating" : "Send Message"}
          >
            {isLoading ? (
              <Square size={18} className="fill-current" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
