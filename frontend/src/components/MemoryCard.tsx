import React from 'react';
import { Mic } from 'lucide-react';
import { Memory } from '../types';
import { Tape } from './ui';
import { letterDate, tiltFor } from '../utils/format';

interface MemoryCardProps {
  memory: Memory;
  onOpen: () => void;
}

/** One memory in the album: a keepsake card, taped down at a slight angle. */
const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onOpen }) => {
  const tilt = tiltFor(memory.id);

  return (
    <button
      type="button"
      onClick={onOpen}
      // The tilt lives in a CSS variable so hovering can straighten and lift the card.
      className="group relative mb-8 block w-full break-inside-avoid bg-card px-6 pb-5 pt-8 text-left shadow-keepsake transition-transform duration-300 [transform:rotate(var(--tilt))] hover:[transform:translateY(-4px)_rotate(0deg)]"
      style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
    >
      <Tape className={tilt > 0 ? 'right-8' : 'left-8'} />

      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-display text-sm italic text-ink-muted">{letterDate(memory.timestamp)}</span>
        {memory.source === 'voice' && (
          <span className="inline-flex items-center gap-1 rounded-full border border-oxblood/40 px-2 py-0.5 text-[11px] uppercase tracking-wider text-oxblood">
            <Mic className="h-3 w-3" /> spoken
          </span>
        )}
      </div>

      <h3 className="mb-3 font-display text-xl leading-snug text-ink transition-colors group-hover:text-oxblood">{memory.summary}</h3>

      <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-ink-soft">{memory.text}</p>

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {memory.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

export default MemoryCard;