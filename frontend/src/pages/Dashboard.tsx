import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import { Activity, Memory, Stats } from '../types';
import { usePerson } from '../context/PersonContext';
import { PageHeader, Notice, Tape } from '../components/ui';
import { letterDate, timeAgo } from '../utils/format';

const activityLabel: Record<Activity['kind'], string> = {
  memory: 'A memory was kept',
  chat: 'A conversation',
  voice_chat: 'A spoken conversation',
  voice_clone: 'The voice was updated',
};

const Dashboard: React.FC = () => {
  const { current: person, people, loading } = usePerson();
  const [stats, setStats] = useState<Stats | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load this person's numbers and memories (again whenever you switch person).
  useEffect(() => {
    if (!person) return;
    setStats(null);
    setMemories([]);
    Promise.all([apiService.getStats(person.id), apiService.getMemories(person.id)]).then(([s, m]) => {
      if (s.status === 'success' && s.data) setStats(s.data);
      else setError(s.message || 'Could not open the archive.');
      if (m.status === 'success' && m.data) setMemories(m.data);
    });
  }, [person?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // One memory to revisit, chosen at random each visit.
  const revisit = useMemo(() => (memories.length ? memories[Math.floor(Math.random() * memories.length)] : null), [memories]);

  // Nobody in the archive yet: a welcome that leads to adding the first person.
  if (!person) {
    if (loading) return null;
    return (
      <div className="flex flex-col gap-12">
        <PageHeader
          eyebrow="Welcome to"
          title="SwarSmriti"
          subtitle="Memories and a voice, kept together, so the people who love them can keep talking with them."
        />
        <Link to="/family" className="relative flex flex-wrap items-center justify-between max-w-3xl gap-4 pt-8 pb-6 group bg-card px-7 shadow-keepsake animate-settle">
          <Tape className="left-8" />
          <div className="flex flex-col gap-1">
            <span className="eyebrow">Begin here</span>
            <span className="text-2xl font-display text-ink">Whose memories are we keeping?</span>
            <span className="text-sm text-ink-soft">Add a grandparent, a parent, a friend, or yourself. You can add more people later.</span>
          </div>
          <span className="btn-ink">
            Add the first person <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    );
  }

  const name = person.name;
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
    { to: '/talk', no: 'II', title: `Talk with ${name}`, text: 'Ask anything, by typing or by voice.' },
    { to: '/memories', no: 'III', title: 'Open the album', text: 'Every story kept so far, in one place.' },
  ];

  return (
    <div className="flex flex-col gap-14">
      <PageHeader
        eyebrow="The family archive of"
        title={name}
        subtitle={
          people.length > 1
            ? `One of ${people.length} people in the archive. Switch person in the side column, or see everyone on The family page.`
            : 'Memories and a voice, kept together, so the people who love them can keep talking with them.'
        }
      />

      {error && <Notice>{error}</Notice>}

      {/* The ledger: four numbers, typeset like a page in an old register */}
      <section aria-label="In numbers" className="grid grid-cols-2 border-y border-ink md:grid-cols-4">
        {ledger.map((item, i) => (
          <div
            key={item.label}
            className={`flex flex-col gap-1 px-4 py-6 sm:px-6 ${i % 2 === 1 ? 'border-l border-rule' : ''} ${
              i >= 2 ? 'border-t border-rule md:border-t-0' : ''
            } ${i === 2 ? 'md:border-l' : ''}`}
          >
            <span className="text-5xl font-light leading-none font-display text-ink">{item.value}</span>
            <span className="text-sm text-ink-soft">{item.label}</span>
          </div>
        ))}
      </section>

      {revisit && (
        <section className="flex flex-col gap-5">
          <span className="eyebrow">A memory to revisit</span>
          <article className="relative max-w-3xl pt-10 bg-card px-7 pb-7 shadow-letter animate-settle sm:px-10" style={{ transform: 'rotate(-0.5deg)' }}>
            <Tape className="left-12" />
            <p className="mb-3 text-sm italic font-display text-ink-muted">{letterDate(revisit.timestamp)}</p>
            <h2 className="mb-4 text-3xl leading-snug font-display text-ink">{revisit.summary}</h2>
            <p className="mb-6 line-clamp-3 text-ink-soft">{revisit.text}</p>
            <Link to={`/talk?ask=${encodeURIComponent(`Tell me more about this: ${revisit.summary}`)}`} className="btn-outline">
              Ask {name} about it <ArrowRight className="w-4 h-4" />
            </Link>
          </article>
        </section>
      )}

      <section className="flex flex-col gap-5">
        <span className="eyebrow">Ways in</span>
        <div className="grid gap-px overflow-hidden border rounded-sm border-rule bg-rule md:grid-cols-3">
          {ways.map((w) => (
            <Link key={w.to} to={w.to} className="flex flex-col gap-3 transition-colors group bg-paper p-7 hover:bg-card">
              <span className="text-lg italic font-display text-oxblood">{w.no}.</span>
              <span className="text-2xl font-display text-ink">{w.title}</span>
              <span className="text-sm text-ink-soft">{w.text}</span>
              <ArrowRight className="w-5 h-5 mt-2 transition-all text-ink-muted group-hover:translate-x-1 group-hover:text-oxblood" />
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <span className="eyebrow">From the ledger</span>
        {stats && stats.recent_activity.length === 0 && (
          <p className="text-lg italic font-display text-ink-soft">Nothing written yet. The first memory starts the book.</p>
        )}
        <ul className="flex flex-col">
          {stats?.recent_activity.map((a, i) => (
            <li key={i} className="flex items-baseline gap-3 py-3 text-[15px]">
              <span className="shrink-0 text-ink">{activityLabel[a.kind] ?? a.kind}</span>
              <span className="min-w-0 italic truncate font-display text-ink-soft">{a.detail}</span>
              <span aria-hidden="true" className="flex-1 border-b border-dotted min-w-6 border-rule-strong" />
              <span className="text-sm shrink-0 text-ink-muted">{timeAgo(a.timestamp)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;