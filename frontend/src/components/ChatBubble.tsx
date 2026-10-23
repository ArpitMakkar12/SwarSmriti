import React from 'react';
import { ChatMessage } from '../types';
import AudioPlayer from './AudioPlayer';
import { Tape } from './ui';
import { tiltFor } from '../utils/format';

interface ChatBubbleProps {
  message: ChatMessage;
  personaName?: string;
  /** The newest reply: its words appear one by one, as if being written, and its voice plays. */
  isLatest?: boolean;
}

/** Splits the reply into words that fade in like ink, one after another. */
const InkText: React.FC<{ text: string; animate: boolean }> = ({ text, animate }) => {
  if (!animate) return <>{text}</>;
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /\s+/.test(part) ? (
          part
        ) : (
          <span key={i} className="animate-ink-in" style={{ animationDelay: `${Math.min(i * 22, 2400)}ms` }}>
            {part}
          </span>
        ),
      )}
    </>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, personaName, isLatest = false }) => {
  const name = personaName || 'They';

  // What you asked: a quiet italic line on the right, like a question written in the margin.
  if (message.type === 'user') {
    return (
      <div className="flex flex-col items-end gap-1 text-right animate-fade-in">
        <span className="eyebrow">You asked</span>
        <p className="max-w-xl font-display text-xl italic leading-snug text-ink sm:text-2xl">{message.content}</p>
      </div>
    );
  }

  // Something went wrong: a small note, not a letter.
  if (message.isError) {
    return (
      <p role="alert" className="self-start rounded-lg border border-oxblood/30 bg-oxblood/5 px-4 py-3 text-sm text-oxblood-deep animate-fade-in">
        {message.content}
      </p>
    );
  }

  // Their reply: a letter taped to the page, with their voice and where the memory came from.
  return (
    <div className="animate-settle">
      <article
        className="relative flex flex-col gap-5 bg-card px-6 pb-6 pt-9 shadow-letter sm:px-10"
        style={{ transform: `rotate(${tiltFor(message.id) * 0.5}deg)` }}
      >
        <Tape className="left-10" />
        <p className="font-display text-xl leading-relaxed text-ink sm:text-[1.6rem] sm:leading-[1.55]">
          <InkText text={message.content} animate={isLatest} />
        </p>
        <p className="text-right font-display text-lg italic text-ink-soft">— {name}</p>

        {message.audioUrl && <AudioPlayer audioUrl={message.audioUrl} autoPlay={isLatest} label={`In ${name}'s voice`} />}
        {!message.audioUrl && message.audioError && (
          <p className="text-sm italic text-ink-muted">Voice unavailable: {message.audioError}</p>
        )}

        {message.memories && message.memories.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-dashed border-rule pt-4">
            <span className="eyebrow">Remembered from</span>
            <ul className="flex flex-col gap-1">
              {[...new Set(message.memories)].slice(0, 2).map((m) => (
                <li key={m} className="font-display text-base italic text-ink-soft">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
};

export default ChatBubble;