import React, { useEffect, useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';
import { PageHeader, Notice, Tape } from '../components/ui';
import { apiService } from '../services/api';
import { blobToWav } from '../utils/audio';
import { Profile } from '../types';

const MAX_SAMPLES = 5;

const Persona: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [samples, setSamples] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiService.getProfile().then((res) => {
      if (res.status === 'success' && res.data) {
        setProfile(res.data);
        setName(res.data.name);
        setAbout(res.data.about);
      }
    });
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const res = await apiService.updateProfile(name, about);
    setSaving(false);
    if (res.status === 'success' && res.data) {
      setProfile(res.data);
      setSaved(true);
    } else {
      setSaveError(res.message || 'Could not save the portrait.');
    }
  };

  const addFiles = (files: FileList | null) => {
    if (files) setSamples((prev) => [...prev, ...Array.from(files)].slice(0, MAX_SAMPLES));
  };

  const addRecording = async (blob: Blob) => {
    // 44.1 kHz keeps more of the voice's character than the 16 kHz used for transcription.
    const wav = await blobToWav(blob, 44100);
    setSamples((prev) => [...prev, new File([wav], `recording-${prev.length + 1}.wav`, { type: 'audio/wav' })].slice(0, MAX_SAMPLES));
  };

  const createClone = async () => {
    setCloning(true);
    setMessage(null);
    const res = await apiService.cloneVoice(samples, consent);
    setCloning(false);
    if (res.status === 'success' && res.data) {
      setProfile(res.data);
      setSamples([]);
      setMessage({ ok: true, text: 'The voice is ready. Every reply will now be spoken in it.' });
    } else {
      setMessage({ ok: false, text: res.message || 'The voice could not be created.' });
    }
  };

  const removeClone = async () => {
    if (!confirm('Remove this voice? Replies will use a default voice again.')) return;
    const res = await apiService.removeVoice();
    if (res.status === 'success' && res.data) setProfile(res.data);
    else setMessage({ ok: false, text: res.message || 'Could not remove the voice.' });
  };

  return (
    <div className="flex flex-col gap-14">
      <PageHeader
        eyebrow="The portrait"
        title="Who are we remembering?"
        subtitle="Their name and the way they speak shape every reply. Their voice is how it sounds."
      />

      {/* Who they are, written on a letter */}
      <form onSubmit={saveProfile} className="relative flex max-w-3xl flex-col gap-8 bg-card px-7 pb-8 pt-10 shadow-letter sm:px-10">
        <Tape className="left-12" />
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="eyebrow">
            Their name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kamala Sharma, or what the family calls them: Nani"
            maxLength={80}
            className="border-b-[1.5px] border-ink bg-transparent py-2 font-display text-3xl text-ink outline-none placeholder:text-ink-muted/60 focus:border-oxblood"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="about" className="eyebrow">
            In a few words: who they are, how they talk
          </label>
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Retired maths teacher from Kakinada. Warm and teasing, calls everyone 'beta', mixes Telugu into English, always asks if you've eaten."
            className="lined resize-none bg-transparent font-display text-lg leading-9 text-ink outline-none placeholder:italic placeholder:text-ink-muted/70"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving || !name.trim()} className="btn-ink">
            {saving ? 'Saving…' : 'Save the portrait'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-moss" role="status">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
        {saveError && <Notice>{saveError}</Notice>}
      </form>

      {/* Their voice */}
      <section className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">Their voice</span>
            <h2 className="font-display text-3xl text-ink">
              {profile?.has_cloned_voice ? 'Speaking in their own voice' : 'Not yet their voice'}
            </h2>
          </div>
          {profile?.has_cloned_voice && (
            <button type="button" onClick={removeClone} className="text-sm text-ink-soft underline underline-offset-4 hover:text-oxblood">
              Remove this voice
            </button>
          )}
        </div>

        <p className="text-ink-soft">
          Add 1–{MAX_SAMPLES} clear recordings of them speaking: old voice notes, the sound from a family video, or a new recording. One to
          two minutes in total is enough.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-[1.5px] border-dashed border-rule-strong px-6 py-10 text-center transition-colors hover:border-oxblood hover:bg-card">
            <Upload className="h-6 w-6 text-oxblood" strokeWidth={1.6} />
            <span className="font-display text-xl text-ink">Choose recordings</span>
            <span className="text-xs text-ink-muted">mp3, wav, m4a and most audio files</span>
            <input type="file" accept="audio/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
          </label>
          <div className="flex flex-col items-center justify-center gap-2 rounded-sm border border-rule px-6 py-8">
            <VoiceRecorder
              onRecordingComplete={addRecording}
              disabled={cloning || samples.length >= MAX_SAMPLES}
              showPlayback={false}
              hint="Or record them speaking now"
            />
          </div>
        </div>

        {samples.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {samples.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center gap-2 bg-card py-2 pl-4 pr-2 text-sm text-ink shadow-keepsake">
                <span className="max-w-[16rem] truncate font-display italic">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setSamples(samples.filter((_, j) => j !== i))}
                  aria-label={`Remove ${file.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-paper hover:text-oxblood"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="flex items-start gap-3 text-sm text-ink">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-oxblood" />
          <span>This is my own voice, or I have permission from the person or their family to recreate it.</span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={createClone} disabled={cloning || samples.length === 0 || !consent} className="btn-seal">
            {cloning ? 'Creating the voice… (about a minute)' : profile?.has_cloned_voice ? 'Replace the voice' : 'Create their voice'}
          </button>
          <span className="text-xs text-ink-muted">Uses ElevenLabs voice cloning (needs an ElevenLabs Starter plan or above).</span>
        </div>

        {message &&
          (message.ok ? (
            <p role="status" className="font-display text-lg italic text-moss">
              {message.text}
            </p>
          ) : (
            <Notice>{message.text}</Notice>
          ))}
      </section>
    </div>
  );
};

export default Persona;