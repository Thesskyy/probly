import { ChatMessage } from "@/types/api";

const MAX_HISTORY_MESSAGES = 10; // Adjust based on your needs
const MAX_TOKENS_PER_MESSAGE = 500; // Approximate token limit per message

export function prepareChatHistory(
  chatHistory: ChatMessage[],
): { role: string; content: string }[] {
  return chatHistory
    .slice(-MAX_HISTORY_MESSAGES) // Keep last N messages
    .map((msg) => [
      {
        role: "user",
        content: msg.text.slice(0, MAX_TOKENS_PER_MESSAGE),
      },
      {
        role: "assistant",
        content: msg.response.slice(0, MAX_TOKENS_PER_MESSAGE),
      },
    ])
    .flat();
}
