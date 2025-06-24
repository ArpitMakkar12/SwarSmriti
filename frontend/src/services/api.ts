import { TrainRequest, ChatRequest, ApiResponse, Memory, ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
      console.log('Request options:', options);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async trainMemory(data: TrainRequest): Promise<ApiResponse<{ summary: string }>> {
    console.log('Training memory with data:', data);
    return this.makeRequest('/train', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async chatWithAI(data: ChatRequest): Promise<ApiResponse<{ answer: string; audio_url: string }>> {
    console.log('Chatting with AI:', data);
    return this.makeRequest('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async transcribeAudio(audioFile: File): Promise<ApiResponse<{ transcript: string }>> {
    console.log('Transcribing audio file:', audioFile);
    
    const formData = new FormData();
    formData.append('file', audioFile);

    try {
      console.log(`Making transcription request to: ${API_BASE_URL}/transcribe`);
      
      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      console.log('Transcription response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Transcription response data:', data);
      return { status: 'success', data };
    } catch (error) {
      console.error('Transcription failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Transcription failed',
      };
    }
  }

  async voiceChat(audioFile: File): Promise<ApiResponse<{ transcript: string; answer: string; audio_url: string }>> {
    console.log('Voice chat with audio file:', audioFile);
    
    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      console.log(`Making voice chat request to: ${API_BASE_URL}/voice-chat`);
      
      const response = await fetch(`${API_BASE_URL}/voice-chat`, {
        method: 'POST',
        body: formData,
      });

      console.log('Voice chat response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Voice chat error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Voice chat response data:', data);
      return { status: 'success', data };
    } catch (error) {
      console.error('Voice chat failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Voice chat failed',
      };
    }
  }

  getAudioUrl(audioId: string): string {
    return `${API_BASE_URL}/audio/${audioId}`;
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/docs`);
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();