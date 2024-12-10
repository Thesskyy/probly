export interface CellUpdate {
  formula: string;
  target: string;
}

export interface LLMResponse {
  udpates: CellUpdate[];
}
