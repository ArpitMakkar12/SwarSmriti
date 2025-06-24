import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import VoiceRecorder from '../components/VoiceRecorder';
import { ChatMessage } from '../types';
import { apiService } from '../services/api';

const Talk: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message
    addMessage({
      type: 'user',
      content: userMessage,
    });

    setIsLoading(true);
    try {
      const response = await apiService.chatWithAI({ question: userMessage });
      
      if (response.status === 'success' && response.data) {
        const audioUrl = response.data.audio_url.startsWith('http') 
          ? response.data.audio_url 
          : `http://localhost:8000${response.data.audio_url}`;

        addMessage({
          type: 'ai',
          content: response.data.answer,
          audioUrl: audioUrl,
        });
      } else {
        addMessage({
          type: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceComplete = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
      
      const response = await apiService.voiceChat(audioFile);
      
      if (response.status === 'success' && response.data) {
        // Add user message (transcribed)
        addMessage({
          type: 'user',
          content: response.data.transcript || 'Voice message',
        });

        // Add AI response
        const audioUrl = response.data.audio_url.startsWith('http') 
          ? response.data.audio_url 
          : `http://localhost:8000${response.data.audio_url}`;

        addMessage({
          type: 'ai',
          content: response.data.answer,
          audioUrl: audioUrl,
        });
      } else {
        addMessage({
          type: 'ai',
          content: 'Sorry, I couldn\'t process your voice message. Please try again.',
        });
      }
    } catch (error) {
      console.error('Voice chat error:', error);
      addMessage({
        type: 'ai',
        content: 'Sorry, I encountered an error with voice processing. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Talk to Your AI Doppelganger</h1>
        <p className="text-warm-grey">
          Have a conversation with your AI self. Ask questions, share thoughts, or just chat.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={() => setIsVoiceMode(false)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            !isVoiceMode
              ? 'bg-copper-rose text-white shadow-md'
              : 'bg-white text-warm-grey border border-warm-beige hover:bg-warm-beige/20'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Text Chat</span>
        </button>
        <button
          onClick={() => setIsVoiceMode(true)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isVoiceMode
              ? 'bg-copper-rose text-white shadow-md'
              : 'bg-white text-warm-grey border border-warm-beige hover:bg-warm-beige/20'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice Chat</span>
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-xl border border-warm-beige flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-gold to-copper-rose rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-charcoal mb-2">Start a Conversation</h3>
              <p className="text-warm-grey">
                {isVoiceMode 
                  ? 'Record a voice message to begin talking with your AI doppelganger'
                  : 'Type a message to begin talking with your AI doppelganger'
                }
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-warm-beige rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-copper-rose rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-copper-rose rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-copper-rose rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-warm-grey">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-warm-beige p-4">
          {isVoiceMode ? (
            <div className="text-center">
              <VoiceRecorder 
                onRecordingComplete={handleVoiceComplete} 
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full p-3 border border-warm-beige rounded-lg focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose resize-none"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={isLoading || !inputText.trim()}
                className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-rose-gold to-copper-rose text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Talk;