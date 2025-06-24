export interface Memory {
  id: string;
  text: string;
  summary: string;
  tags: string[];
  timestamp: string;
  voice_path_url?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  audioUrl?: string;
}

export interface TrainRequest {
  text: string;
  tags: string[];
}

export interface ChatRequest {
  question: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error_message?: string;
}