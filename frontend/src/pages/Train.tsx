import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';
import { PageHeader, Notice, Tape, NeedsPerson } from '../components/ui';
import { usePerson } from '../context/PersonContext';
import { apiService } from '../services/api';
import { blobToWav } from '../utils/audio';
import { MAX_MEMORY_CHARS, MIN_MEMORY_CHARS, SAMPLE_MEMORY_PROMPTS } from '../utils/constants';
import { Memory } from '../types';

const suggestedLabels = ['childhood', 'family', 'values', 'achievements', 'relationships', 'hobbies', 'fears', 'dreams', 'advice', 'philosophy'];

const Train: React.FC = () => {
  const { current: person, reload, loading } = usePerson();
  const [mode, setMode] = useState<'write' | 'speak'>('write');
  const [text, setText] = useState('');
  const [spoken, setSpoken] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saved, setSaved] = useState<Memory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = (mode === 'write' ? text : spoken).trim();
  const tooShort = current.length < MIN_MEMORY_CHARS;
  const tooLong = current.length > MAX_MEMORY_CHARS;

  const toggleTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    setTags((prev) => (prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]));
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!person || saving || tooShort || tooLong) return;
    setSaving(true);
    setError(null);
    const res = await apiService.trainMemory({ person_id: person.id, text: current, tags, source: mode === 'write' ? 'text' : 'voice' });
    setSaving(false);
    if (res.status === 'success' && res.data) {
      setSaved(res.data);
      reload(); // keeps the memory counts on The family page up to date
      setText('');
      setSpoken('');
      setTags([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(res.message || 'The memory could not be kept. Please try again.');
    }
  };

  const onRecorded = async (blob: Blob) => {
    setTranscribing(true);
    setError(null);
    try {
      const wav = await blobToWav(blob, 16000); // the format the server's speech model understands
      const res = await apiService.transcribe(wav);
      if (res.status === 'success' && res.data) {
        const words = res.data.transcript;
        if (!words) setError("No words came through. Try again a little closer to the microphone.");
        // Each new recording is added to the end, so a long story can be told in parts.
        else setSpoken((prev) => (prev ? `${prev} ${words}` : words));
      } else {
        setError(res.message || 'The recording could not be turned into text.');
      }
    } catch {
      setError("Your browser couldn't read that recording. Please try again.");
    } finally {
      setTranscribing(false);
    }
  };

  const startWithPrompt = (prompt: string) => {
    setMode('write');
    setText((prev) => (prev.trim() ? prev : `${prompt}\n`));
    document.getElementById('memory')?.focus();
  };

  const counter = (
    <span className={`text-sm ${!tooShort && !tooLong ? 'text-moss' : 'text-ink-muted'}`}>
      {current.length} / {MAX_MEMORY_CHARS}
      {tooShort && ` · at least ${MIN_MEMORY_CHARS} characters`}
    </span>
  );

  if (!person) return loading ? null : <NeedsPerson what="adding memories" />;

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        eyebrow={`Add to ${person.name}'s album`}
        title="Tell me a story"
        subtitle={`A memory of ${person.name}, or one told in their words. Small moments matter as much as big ones.`}
      />

      {saved && (
        <div className="relative max-w-3xl pb-6 bg-card px-7 pt-9 shadow-letter animate-settle sm:px-10">
          <Tape className="left-12" />
          <span className="eyebrow text-moss">Kept in {person.name}'s album</span>
          <p className="mt-2 text-2xl leading-snug font-display text-ink">{saved.summary}</p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {saved.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
            <Link to="/memories" className="flex items-center gap-1 ml-auto text-sm underline text-ink underline-offset-4 hover:text-oxblood">
              See it in the album <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Write / Speak */}
      <div role="tablist" aria-label="How to add the memory" className="flex gap-8 border-b border-rule">
        {(['write', 'speak'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`-mb-px border-b-2 pb-3 font-display text-2xl transition-colors ${
              mode === m ? 'border-oxblood text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {m === 'write' ? 'Write it' : 'Say it'}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="flex flex-col gap-10">
        {mode === 'write' ? (
          <>
            <div className="flex flex-col gap-3">
              <span className="eyebrow">Need a beginning?</span>
              <div className="flex gap-3 px-1 pb-2 -mx-1 overflow-x-auto">
                {SAMPLE_MEMORY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => startWithPrompt(prompt)}
                    className="w-52 shrink-0 border border-rule bg-paper px-4 py-4 text-left font-display text-[15px] italic leading-snug text-ink-soft transition-colors hover:border-oxblood hover:bg-card hover:text-ink"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative max-w-3xl pt-10 pb-6 bg-card px-7 shadow-letter sm:px-10">
              <Tape className="left-12" />
              <label htmlFor="memory" className="sr-only">
                The memory
              </label>
              <textarea
                id="memory"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && save()}
                rows={9}
                disabled={saving}
                placeholder="It was the summer of…"
                className="w-full text-xl leading-9 bg-transparent outline-none resize-none lined font-display text-ink placeholder:italic placeholder:text-ink-muted/70"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                {counter}
                <span className="text-xs text-ink-muted">Ctrl + Enter to keep it</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col max-w-3xl gap-8">
            <div className="flex flex-col items-center gap-2 py-6">
              <VoiceRecorder onRecordingComplete={onRecorded} disabled={saving || transcribing} hint="Tap and tell it like you'd tell a friend" />
              {transcribing && <p className="italic font-display text-ink-soft">Writing down your words…</p>}
            </div>
            {spoken && (
              <div className="relative pt-10 pb-6 bg-card px-7 shadow-letter animate-settle sm:px-10">
                <Tape className="left-12" />
                <label htmlFor="spoken" className="eyebrow">
                  What we heard. Fix anything that's wrong; record again to add more
                </label>
                <textarea
                  id="spoken"
                  value={spoken}
                  onChange={(e) => setSpoken(e.target.value)}
                  rows={6}
                  className="w-full mt-3 text-xl leading-9 bg-transparent outline-none resize-none lined font-display text-ink"
                />
                <div className="mt-3">{counter}</div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col max-w-3xl gap-3">
          <span className="eyebrow">Label it (optional, a few are added for you)</span>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...suggestedLabels, ...tags])].map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    on ? 'border-ink bg-ink text-paper' : 'border-rule-strong text-ink-soft hover:border-ink hover:text-ink'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <div className="flex items-center max-w-sm gap-2 border-b border-rule-strong">
            <label htmlFor="new-tag" className="sr-only">
              Your own label
            </label>
            <input
              id="new-tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  toggleTag(newTag);
                  setNewTag('');
                }
              }}
              placeholder="Your own label…"
              className="flex-1 min-w-0 py-2 text-sm bg-transparent outline-none placeholder:text-ink-muted"
            />
            <button
              type="button"
              onClick={() => {
                toggleTag(newTag);
                setNewTag('');
              }}
              aria-label="Add label"
              className="flex items-center justify-center rounded-full h-9 w-9 text-ink-soft hover:text-oxblood"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <Notice>{error}</Notice>}

        <div>
          <button type="submit" disabled={saving || tooShort || tooLong} className="btn-seal">
            {saving ? 'Keeping it safe…' : 'Keep this memory'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Train;