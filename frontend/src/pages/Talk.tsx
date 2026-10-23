import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic } from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import VoiceRecorder from '../components/VoiceRecorder';
import { ChatMessage, ChatReply, HistoryTurn } from '../types';
import { apiService } from '../services/api';
import { base64ToAudioUrl, blobToWav } from '../utils/audio';

const Talk: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [personaName, setPersonaName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    apiService.getProfile().then((res) => {
      if (res.status === 'success' && res.data) setPersonaName(res.data.name);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    // A counter, not Date.now(): two messages added in the same millisecond got the same key before.
    const newMessage: ChatMessage = { ...message, id: String(nextId.current++), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, newMessage]);
  };

  // The last few turns go to the server so the AI can follow the conversation.
  const history = (): HistoryTurn[] =>
    messages
      .filter((m) => !m.content.startsWith('⚠️')) // don't send error notices
      .slice(-10)
      .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));

  const addReply = (reply: ChatReply) => {
    addMessage({
      type: 'ai',
      content: reply.answer,
      audioUrl: reply.audio_base64 ? base64ToAudioUrl(reply.audio_base64) : undefined,
      audioError: reply.audio_error ?? undefined,
    });
  };

  const handleTextSubmit = async () => {
    const question = inputText.trim();
    if (!question || isLoading) return;
    const past = history();
    setInputText('');
    addMessage({ type: 'user', content: question });

    setIsLoading(true);
    const res = await apiService.chat(question, past);
    setIsLoading(false);

    if (res.status === 'success' && res.data) addReply(res.data);
    else addMessage({ type: 'ai', content: `⚠️ ${res.message || 'Something went wrong. Please try again.'}` });
  };

  const handleVoiceComplete = async (audioBlob: Blob) => {
    const past = history();
    setIsLoading(true);
    try {
      const wav = await blobToWav(audioBlob, 16000);
      const res = await apiService.voiceChat(wav, past);
      if (res.status === 'success' && res.data) {
        addMessage({ type: 'user', content: res.data.transcript });
        addReply(res.data);
      } else {
        addMessage({ type: 'ai', content: `⚠️ ${res.message || "I couldn't process that voice message."}` });
      }
    } catch (error) {
      console.error('Voice chat error:', error);
      addMessage({ type: 'ai', content: "⚠️ Your browser couldn't read that recording. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const lastAiId = [...messages].reverse().find((m) => m.type === 'ai')?.id;
  const who = personaName || 'your AI doppelganger';

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-3xl font-bold text-charcoal">{personaName ? `Talk to ${personaName}` : 'Talk to Your AI Doppelganger'}</h1>
        <p className="text-warm-grey">Ask questions, share thoughts, or just chat. Replies come from the memories you've shared.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-center mb-6 space-x-4">
        {[
          { voice: false, icon: Send, label: 'Text Chat' },
          { voice: true, icon: Mic, label: 'Voice Chat' },
        ].map(({ voice, icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setIsVoiceMode(voice)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isVoiceMode === voice ? 'bg-copper-rose text-white shadow-md' : 'bg-white text-warm-grey border border-warm-beige hover:bg-warm-beige/20'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex flex-col flex-1 min-h-[420px] bg-white border rounded-xl border-warm-beige">
        <div className="flex-1 p-4 overflow-y-auto sm:p-6">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-gold to-copper-rose">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-charcoal">Start a Conversation</h3>
              <p className="text-warm-grey">
                {isVoiceMode ? `Record a voice message to talk with ${who}` : `Type a message to talk with ${who}`}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} message={message} personaName={personaName} autoPlay={message.id === lastAiId} />
            ))
          )}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-xs px-4 py-3 bg-white border rounded-bl-sm border-warm-beige rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-copper-rose animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-copper-rose animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full bg-copper-rose animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-warm-grey">{personaName || 'AI'} is thinking…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-warm-beige">
          {isVoiceMode ? (
            <VoiceRecorder onRecordingComplete={handleVoiceComplete} disabled={isLoading} showPlayback={false} />
          ) : (
            <div className="flex items-end space-x-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here…"
                className="flex-1 p-3 border rounded-lg resize-none border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isLoading}
              />
              <button
                onClick={handleTextSubmit}
                disabled={isLoading || !inputText.trim()}
                aria-label="Send"
                className="flex items-center justify-center text-white transition-all rounded-lg w-11 h-11 bg-gradient-to-br from-rose-gold to-copper-rose hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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