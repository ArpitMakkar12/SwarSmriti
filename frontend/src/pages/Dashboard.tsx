import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import { Activity, Memory, Profile, Stats } from '../types';
import { PageHeader, Notice, Tape } from '../components/ui';
import { letterDate, timeAgo } from '../utils/format';

const activityLabel: Record<Activity['kind'], string> = {
  memory: 'A memory was kept',
  chat: 'A conversation',
  voice_chat: 'A spoken conversation',
  voice_clone: 'The voice was updated',
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiService.getStats(), apiService.getProfile(), apiService.getMemories()]).then(([s, p, m]) => {
      if (s.status === 'success' && s.data) setStats(s.data);
      else setError(s.message || 'Could not open the archive.');
      if (p.status === 'success' && p.data) setProfile(p.data);
      if (m.status === 'success' && m.data) setMemories(m.data);
    });
  }, []);

  // One memory to revisit, chosen at random each visit.
  const revisit = useMemo(() => (memories.length ? memories[Math.floor(Math.random() * memories.length)] : null), [memories]);

  const name = profile?.name || '';
  // "1 day remembered", "3 days remembered"
  const entry = (v: number | undefined, one: string, many: string) => ({
    value: stats ? v ?? 0 : '–',
    label: stats && (v ?? 0) === 1 ? one : many,
  });
  const ledger = [
    entry(stats?.memories, 'memory kept', 'memories kept'),
    entry(stats?.conversations, 'conversation', 'conversations'),
    entry(stats?.voice_memories, 'told by voice', 'told by voice'),
    entry(stats?.active_days, 'day remembered', 'days remembered'),
  ];

  const ways = [
    { to: '/train', no: 'I', title: 'Add a memory', text: 'Write it down or simply say it out loud.' },
    { to: '/talk', no: 'II', title: name ? `Talk with ${name}` : 'Start a conversation', text: 'Ask anything, by typing or by voice.' },
    { to: '/memories', no: 'III', title: 'Open the album', text: 'Every story kept so far, in one place.' },
  ];

  return (
    <div className="flex flex-col gap-14">
      <PageHeader
        eyebrow={name ? 'The family archive of' : 'Welcome to'}
        title={name || 'SwarSmriti'}
        subtitle="Memories and a voice, kept together, so the people who love them can keep talking with them."
      />

      {error && <Notice>{error}</Notice>}

      {profile && !profile.name && (
        <Link
          to="/persona"
          className="group relative flex flex-wrap items-center justify-between gap-4 bg-card px-7 pb-6 pt-8 shadow-keepsake animate-settle"
        >
          <Tape className="left-8" />
          <div className="flex flex-col gap-1">
            <span className="eyebrow">Begin here</span>
            <span className="font-display text-2xl text-ink">Whose memories are we keeping?</span>
            <span className="text-sm text-ink-soft">Add a name, a few words about them and, if you like, their voice.</span>
          </div>
          <span className="btn-ink">
            Start the portrait <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      )}

      {/* The ledger: four numbers, typeset like a page in an old register */}
      <section aria-label="In numbers" className="grid grid-cols-2 border-y border-ink md:grid-cols-4">
        {ledger.map((item, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 px-4 py-6 sm:px-6 ${i % 2 === 1 ? 'border-l border-rule' : ''} ${
              i >= 2 ? 'border-t border-rule md:border-t-0' : ''
            } ${i === 2 ? 'md:border-l' : ''}`}
          >
            <span className="font-display text-5xl font-light leading-none text-ink">{item.value}</span>
            <span className="text-sm text-ink-soft">{item.label}</span>
          </div>
        ))}
      </section>

      {revisit && (
        <section className="flex flex-col gap-5">
          <span className="eyebrow">A memory to revisit</span>
          <article className="relative max-w-3xl bg-card px-7 pb-7 pt-10 shadow-letter animate-settle sm:px-10" style={{ transform: 'rotate(-0.5deg)' }}>
            <Tape className="left-12" />
            <p className="mb-3 font-display text-sm italic text-ink-muted">{letterDate(revisit.timestamp)}</p>
            <h2 className="mb-4 font-display text-3xl leading-snug text-ink">{revisit.summary}</h2>
            <p className="mb-6 line-clamp-3 text-ink-soft">{revisit.text}</p>
            <Link to={`/talk?ask=${encodeURIComponent(`Tell me more about this: ${revisit.summary}`)}`} className="btn-outline">
              Ask {name || 'them'} about it <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </section>
      )}

      <section className="flex flex-col gap-5">
        <span className="eyebrow">Ways in</span>
        <div className="grid gap-px overflow-hidden rounded-sm border border-rule bg-rule md:grid-cols-3">
          {ways.map((w) => (
            <Link key={w.to} to={w.to} className="group flex flex-col gap-3 bg-paper p-7 transition-colors hover:bg-card">
              <span className="font-display text-lg italic text-oxblood">{w.no}.</span>
              <span className="font-display text-2xl text-ink">{w.title}</span>
              <span className="text-sm text-ink-soft">{w.text}</span>
              <ArrowRight className="mt-2 h-5 w-5 text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-oxblood" />
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <span className="eyebrow">From the ledger</span>
        {stats && stats.recent_activity.length === 0 && (
          <p className="font-display text-lg italic text-ink-soft">Nothing written yet. The first memory starts the book.</p>
        )}
        <ul className="flex flex-col">
          {stats?.recent_activity.map((a, i) => (
            <li key={i} className="flex items-baseline gap-3 py-3 text-[15px]">
              <span className="shrink-0 text-ink">{activityLabel[a.kind] ?? a.kind}</span>
              <span className="min-w-0 truncate font-display italic text-ink-soft">{a.detail}</span>
              <span aria-hidden="true" className="min-w-6 flex-1 border-b border-dotted border-rule-strong" />
              <span className="shrink-0 text-sm text-ink-muted">{timeAgo(a.timestamp)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;