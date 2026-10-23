import React from 'react';
import { User, Heart } from 'lucide-react';
import { ChatMessage } from '../types';
import AudioPlayer from './AudioPlayer';

interface ChatBubbleProps {
  message: ChatMessage;
  personaName?: string;
  autoPlay?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, personaName, autoPlay = false }) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
            isUser ? 'bg-copper-rose ml-3' : 'bg-rose-gold mr-3'
          }`}
          title={isUser ? 'You' : personaName}
        >
          {isUser ? <User className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
        </div>

        {/* Message */}
        <div
          className={`flex flex-col space-y-2 px-4 py-3 rounded-2xl max-w-md ${
            isUser ? 'bg-copper-rose text-white rounded-br-sm' : 'bg-white border border-warm-beige rounded-bl-sm'
          }`}
        >
          {!isUser && personaName && <span className="text-xs font-medium text-copper-rose">{personaName}</span>}
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-charcoal'}`}>
            {message.content}
          </p>

          {!isUser && message.audioUrl && <AudioPlayer audioUrl={message.audioUrl} autoPlay={autoPlay} className="mt-1" />}
          {!isUser && !message.audioUrl && message.audioError && (
            <p className="text-xs text-warm-grey">Voice unavailable: {message.audioError}</p>
          )}

          <span className={`text-xs self-end ${isUser ? 'text-white/70' : 'text-warm-grey'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;