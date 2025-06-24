import React from 'react';
import { User, Bot } from 'lucide-react';
import { ChatMessage } from '../types';
import AudioPlayer from './AudioPlayer';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-copper-rose text-white ml-3' 
            : 'bg-rose-gold text-white mr-3'
          }
        `}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className={`
          flex flex-col space-y-2 px-4 py-3 rounded-2xl max-w-md
          ${isUser 
            ? 'bg-copper-rose text-white rounded-br-sm' 
            : 'bg-white border border-warm-beige rounded-bl-sm'
          }
        `}>
          <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-charcoal'}`}>
            {message.content}
          </p>

          {/* Audio Player for AI responses */}
          {!isUser && message.audioUrl && (
            <div className="mt-2">
              <AudioPlayer audioUrl={message.audioUrl} />
            </div>
          )}

          {/* Timestamp */}
          <span className={`text-xs ${isUser ? 'text-white/70' : 'text-warm-grey'} self-end`}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;