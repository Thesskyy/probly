import { useState } from "react";
import { CellUpdate } from "@/types/api";

interface ChatMessage {
  id: string;
  text: string;
  response: string;
  timestamp: Date;
}

interface ChatBoxProps {
  onSend: (message: string) => Promise<CellUpdate[]>;
  chatHistory: ChatMessage[];
  clearHistory: () => void;
}

const ChatBox = ({ onSend, chatHistory, clearHistory }: ChatBoxProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (message.trim()) {
      setIsLoading(true);

      try {
        await onSend(message);
      } catch (error) {
        console.error("Error details:", error);
      } finally {
        setIsLoading(false);
        setMessage("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border">
      {/* Chat Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">Chat History</h2>
        <button
          onClick={clearHistory}
          className="text-sm px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((chat) => (
          <div key={chat.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="bg-blue-50 rounded-lg p-3 max-w-[80%]">
                <p className="text-sm text-gray-800">{chat.text}</p>
                <span className="text-xs text-gray-500">
                  {new Date(chat.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 justify-end">
              <div className="bg-gray-50 rounded-lg p-3 max-w-[80%]">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {chat.response}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask the LLM to create a formula..."
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
