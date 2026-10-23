export interface Memory {
  id: string;
  text: string;
  summary: string;
  tags: string[];
  source: 'text' | 'voice';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  audioUrl?: string;
  audioError?: string;
  /** Summaries of the memories the AI used for this reply ("Remembered from …"). */
  memories?: string[];
  /** A notice like "server unreachable", shown differently and never sent back as history. */
  isError?: boolean;
}

/** One past turn sent back to the server so the AI remembers the conversation. */
export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface TrainRequest {
  text: string;
  tags: string[];
  source?: 'text' | 'voice';
}

export interface ChatReply {
  answer: string;
  audio_base64: string | null;
  audio_error: string | null;
  memories_used: string[];
}

export interface VoiceChatReply extends ChatReply {
  transcript: string;
}

export interface Profile {
  name: string;
  about: string;
  has_cloned_voice: boolean;
}

export interface Activity {
  kind: 'memory' | 'chat' | 'voice_chat' | 'voice_clone';
  detail: string;
  timestamp: string;
}

export interface Stats {
  memories: number;
  voice_memories: number;
  characters: number;
  unique_tags: number;
  conversations: number;
  active_days: number;
  recent_activity: Activity[];
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}