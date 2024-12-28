export interface ChatMessage {
  id: string;
  text: string;
  response: string;
  timestamp: Date;
  status: "pending" | "accepted" | "rejected" | null;
  updates?: CellUpdate[];
}

export interface CellUpdate {
  formula: string;
  target: string;
}

export interface LLMResponse {
  udpates: CellUpdate[];
}
