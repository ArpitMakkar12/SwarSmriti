import React, { useEffect, useState } from 'react';
import { UserRound, Upload, Trash2, Check, Mic, AudioLines } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';
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

  const [samples, setSamples] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

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
    const res = await apiService.updateProfile(name, about);
    setSaving(false);
    if (res.status === 'success' && res.data) {
      setProfile(res.data);
      setSaved(true);
    } else {
      alert(res.message || 'Could not save.');
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setSamples((prev) => [...prev, ...Array.from(files)].slice(0, MAX_SAMPLES));
  };

  const addRecording = async (blob: Blob) => {
    // 44.1 kHz keeps more detail of the voice than the 16 kHz used for transcription.
    const wav = await blobToWav(blob, 44100);
    const file = new File([wav], `recording-${samples.length + 1}.wav`, { type: 'audio/wav' });
    setSamples((prev) => [...prev, file].slice(0, MAX_SAMPLES));
  };

  const createClone = async () => {
    setCloning(true);
    setMessage(null);
    const res = await apiService.cloneVoice(samples, consent);
    setCloning(false);
    if (res.status === 'success' && res.data) {
      setProfile(res.data);
      setSamples([]);
      setMessage({ kind: 'ok', text: 'Voice created. Replies on the Talk page will now use this voice.' });
    } else {
      setMessage({ kind: 'error', text: res.message || 'Voice cloning failed.' });
    }
  };

  const removeClone = async () => {
    if (!confirm('Remove the cloned voice? Replies will go back to the default voice.')) return;
    const res = await apiService.removeVoice();
    if (res.status === 'success' && res.data) setProfile(res.data);
    else alert(res.message || 'Could not remove the voice.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4 space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-gold to-copper-rose rounded-xl">
            <UserRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-charcoal">Persona & Voice</h1>
        </div>
        <p className="max-w-2xl mx-auto text-lg text-warm-grey">
          Who is this AI doppelganger? The name and description shape how it speaks; the voice is how it sounds.
        </p>
      </div>

      {/* Who */}
      <form onSubmit={saveProfile} className="p-6 space-y-4 bg-white border rounded-xl border-warm-beige">
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-charcoal">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kamala Sharma, or what the family calls them (Nani)"
            maxLength={80}
            className="w-full px-4 py-3 border rounded-lg border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
          />
        </div>
        <div>
          <label htmlFor="about" className="block mb-2 text-sm font-medium text-charcoal">About them & how they talk</label>
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={2000}
            placeholder="e.g. Retired maths teacher from Kakinada, 78. Warm and teasing, calls everyone 'beta', mixes Telugu words into English, always asks if you've eaten."
            className="w-full h-32 p-4 border rounded-lg resize-none border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-6 py-3 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-rose-gold to-copper-rose hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save persona'}
          </button>
          {saved && (
            <span className="flex items-center text-sm text-green-700">
              <Check className="w-4 h-4 mr-1" /> Saved
            </span>
          )}
        </div>
      </form>

      {/* Voice */}
      <div className="p-6 space-y-5 bg-white border rounded-xl border-warm-beige">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center text-lg font-semibold text-charcoal">
              <AudioLines className="w-5 h-5 mr-2 text-copper-rose" /> Voice
            </h2>
            <p className="mt-1 text-sm text-warm-grey">
              {profile?.has_cloned_voice
                ? 'Using the cloned voice for all replies.'
                : 'Using a default voice. Add 1–5 clear recordings of the person (1–2 minutes total is enough) to clone their voice.'}
            </p>
          </div>
          {profile?.has_cloned_voice && (
            <button onClick={removeClone} className="flex items-center text-sm text-warm-grey hover:text-red-600">
              <Trash2 className="w-4 h-4 mr-1" /> Remove
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col items-center justify-center p-6 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-warm-beige hover:border-copper-rose/50 hover:bg-rose-gold/5">
            <Upload className="w-6 h-6 mb-2 text-copper-rose" />
            <span className="text-sm font-medium text-charcoal">Upload recordings</span>
            <span className="text-xs text-warm-grey">Old voice notes, videos' audio, mp3 / wav / m4a</span>
            <input type="file" accept="audio/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </label>
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg border-warm-beige">
            <span className="flex items-center mb-3 text-sm font-medium text-charcoal">
              <Mic className="w-4 h-4 mr-1 text-copper-rose" /> Or record now
            </span>
            <VoiceRecorder onRecordingComplete={addRecording} disabled={cloning || samples.length >= MAX_SAMPLES} showPlayback={false} />
          </div>
        </div>

        {samples.length > 0 && (
          <ul className="space-y-2">
            {samples.map((file, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-2 text-sm rounded-lg bg-ivory">
                <span className="truncate text-charcoal">{file.name}</span>
                <button onClick={() => setSamples(samples.filter((_, j) => j !== i))} className="ml-3 text-warm-grey hover:text-red-600" aria-label="Remove sample">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="flex items-start space-x-2 text-sm text-charcoal">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>This is my own voice, or I have permission from the person (or their family) to recreate it.</span>
        </label>

        <button
          onClick={createClone}
          disabled={cloning || samples.length === 0 || !consent}
          className="w-full py-3 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-rose-gold to-copper-rose hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cloning ? 'Creating voice… (can take a minute)' : profile?.has_cloned_voice ? 'Replace cloned voice' : 'Create cloned voice'}
        </button>

        {message && (
          <p className={`p-3 text-sm rounded-lg border ${message.kind === 'ok' ? 'text-green-800 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
            {message.text}
          </p>
        )}
        <p className="text-xs text-warm-grey">Voice cloning uses ElevenLabs and needs a paid ElevenLabs plan (Starter or above).</p>
      </div>
    </div>
  );
};

export default Persona;