import { useState } from 'react';

interface ChatBoxProps {
  onSend: (message: string) => Promise<LLMResponse>;
}

interface LLMResponse {
  formula: string;
}

const ChatBox = ({ onSend }: ChatBoxProps) => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (message.trim()) {
      setIsLoading(true);
      setResponse('Loading...');

      try {
        const result = await onSend(message) as LLMResponse;
        setResponse(result.formula);
      } catch (error) {
        console.error('Error details:', error);
        setResponse('Error: Failed to get response');
      } finally {
        setIsLoading(false);
      }

      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl p-4 border rounded-lg shadow-sm bg-white">
      {response && (
        <div className="mb-4 p-3 rounded-lg bg-gray-100">
          {response}
        </div>
      )}

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
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;