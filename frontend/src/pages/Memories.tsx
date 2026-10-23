import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import MemoryCard from '../components/MemoryCard';
import { PageHeader, Notice, Tape } from '../components/ui';
import { apiService } from '../services/api';
import { letterDate } from '../utils/format';
import { Memory } from '../types';

const Memories: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const [open, setOpen] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // (The old page called http://localhost:8000 directly, so the live site always showed 0.)
    apiService.getMemories().then((res) => {
      if (res.status === 'success' && res.data) setMemories(res.data);
      else setError(res.message || 'Could not open the album.');
      setLoading(false);
    });
  }, []);

  // Close the open memory with the Escape key.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const remove = async () => {
    if (!open || !confirm('Remove this memory for good? They will no longer remember it.')) return;
    setDeleting(true);
    const res = await apiService.deleteMemory(open.id);
    setDeleting(false);
    if (res.status === 'success') {
      setMemories((prev) => prev.filter((m) => m.id !== open.id));
      setOpen(null);
    } else {
      setError(res.message || 'Could not remove the memory.');
    }
  };

  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags))).sort();
  const term = search.trim().toLowerCase();
  const shown = memories
    .filter(
      (m) =>
        (!term || m.text.toLowerCase().includes(term) || m.summary.toLowerCase().includes(term) || m.tags.some((t) => t.includes(term))) &&
        (!tag || m.tags.includes(tag)),
    )
    .sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return order === 'newest' ? diff : -diff;
    });

  const words = memories.reduce((sum, m) => sum + m.text.split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="The album"
        title="Everything kept so far"
        subtitle={
          loading
            ? 'Opening the album…'
            : `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'} · ${words.toLocaleString()} words · ${allTags.length} labels`
        }
      />

      {error && <Notice>{error}</Notice>}

      {/* Search, labels, order */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex min-w-[16rem] flex-1 items-center gap-3 border-b-[1.5px] border-ink pb-1">
            <Search className="h-5 w-5 text-ink-muted" aria-hidden="true" />
            <label htmlFor="search" className="sr-only">
              Search memories
            </label>
            <input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a name, a place, a word…"
              className="min-w-0 flex-1 bg-transparent py-2 font-display text-lg italic outline-none placeholder:text-ink-muted/80"
            />
          </div>
          <div className="flex gap-4 text-sm" role="group" aria-label="Order">
            {(['newest', 'oldest'] as const).map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={order === o}
                onClick={() => setOrder(o)}
                className={`border-b-2 pb-1 ${order === o ? 'border-oxblood text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                {o === 'newest' ? 'Newest first' : 'Oldest first'}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by label">
            {['', ...allTags].map((t) => (
              <button
                key={t || 'all'}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setTag(t)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  tag === t ? 'border-ink bg-ink text-paper' : 'border-rule-strong text-ink-soft hover:border-ink hover:text-ink'
                }`}
              >
                {t || 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length > 0 ? (
        // CSS columns give the album a loose, hand-arranged look
        <div className="columns-1 gap-8 pt-4 sm:columns-2 lg:columns-3">
          {shown.map((m) => (
            <MemoryCard key={m.id} memory={m} onOpen={() => setOpen(m)} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-start gap-4 py-10">
            <p className="font-display text-2xl italic text-ink-soft">
              {term || tag ? 'Nothing in the album matches that.' : 'The album is empty. Every family story starts with one memory.'}
            </p>
            {!term && !tag && (
              <Link to="/train" className="btn-ink">
                Add the first memory <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )
      )}

      {/* One memory, opened like a letter */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setOpen(null)}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-title"
            onClick={(e) => e.stopPropagation()}
            className="relative my-8 w-full max-w-2xl bg-card px-7 pb-8 pt-11 shadow-letter animate-settle sm:px-12"
          >
            <Tape className="left-12" />
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-paper hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="font-display text-sm italic text-ink-muted">
              {letterDate(open.timestamp)} · {open.source === 'voice' ? 'told by voice' : 'written down'}
            </p>
            <h2 id="memory-title" className="mt-3 font-display text-3xl leading-snug text-ink">
              {open.summary}
            </h2>
            <p className="mt-6 whitespace-pre-wrap font-display text-lg leading-[1.75] text-ink">{open.text}</p>
            {open.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {open.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-rule pt-5">
              <Link to={`/talk?ask=${encodeURIComponent(`Tell me more about this: ${open.summary}`)}`} className="btn-outline">
                Ask about this memory <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={remove} disabled={deleting} className="text-sm text-ink-soft underline underline-offset-4 hover:text-oxblood disabled:opacity-50">
                {deleting ? 'Removing…' : 'Remove from the album'}
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default Memories;