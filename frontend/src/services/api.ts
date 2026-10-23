import {
  ApiResponse,
  ChatReply,
  HistoryTurn,
  Memory,
  Profile,
  Stats,
  TrainRequest,
  VoiceChatReply,
} from '../types';

// Set in frontend/.env.production (deployed) or frontend/.env.local (your laptop).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// Render's free tier sleeps; the first request can take ~1 minute while it wakes.
const TIMEOUT_MS = 120_000;

class ApiService {
  /** One place that sends every request and turns any failure into { status: 'error', message }. */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const isForm = options.body instanceof FormData;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        // For FormData the browser must set Content-Type itself (it adds the boundary).
        headers: isForm ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        // FastAPI errors look like { detail: "..." } (or a list for validation errors)
        const detail = typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`;
        return { status: 'error', message: detail };
      }
      return body as ApiResponse<T>;
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      return {
        status: 'error',
        message: aborted
          ? 'The server took too long to answer. It may still be waking up, please try again.'
          : 'Could not reach the server. Check your connection and try again.',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Cheap ping. Used to wake the server and show its status in the header. */
  async ping(): Promise<boolean> {
    const res = await this.request<unknown>('/health');
    return res.status !== 'error';
  }

  trainMemory(data: TrainRequest) {
    return this.request<Memory>('/train', { method: 'POST', body: JSON.stringify(data) });
  }

  getMemories() {
    return this.request<Memory[]>('/memories');
  }

  deleteMemory(id: string) {
    return this.request<unknown>(`/memories/${id}`, { method: 'DELETE' });
  }

  getStats() {
    return this.request<Stats>('/stats');
  }

  chat(question: string, history: HistoryTurn[]) {
    return this.request<ChatReply>('/chat', {
      method: 'POST',
      body: JSON.stringify({ question, history }),
    });
  }

  voiceChat(wav: Blob, history: HistoryTurn[]) {
    const form = new FormData();
    form.append('audio', wav, 'voice.wav');
    form.append('history', JSON.stringify(history));
    return this.request<VoiceChatReply>('/voice-chat', { method: 'POST', body: form });
  }

  transcribe(wav: Blob) {
    const form = new FormData();
    form.append('file', wav, 'memory.wav');
    return this.request<{ transcript: string }>('/transcribe', { method: 'POST', body: form });
  }

  getProfile() {
    return this.request<Profile>('/profile');
  }

  updateProfile(name: string, about: string) {
    return this.request<Profile>('/profile', { method: 'PUT', body: JSON.stringify({ name, about }) });
  }

  cloneVoice(samples: File[], consent: boolean) {
    const form = new FormData();
    samples.forEach((file) => form.append('files', file, file.name));
    form.append('consent', String(consent));
    return this.request<Profile>('/profile/voice', { method: 'POST', body: form });
  }

  removeVoice() {
    return this.request<Profile>('/profile/voice', { method: 'DELETE' });
  }
}

export const apiService = new ApiService();