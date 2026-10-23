import React, { useState } from 'react';
import { Plus, Sparkles, Lightbulb, Heart, Star } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';
import { apiService } from '../services/api';
import { blobToWav } from '../utils/audio';
import { MAX_MEMORY_CHARS, MIN_MEMORY_CHARS, SAMPLE_MEMORY_PROMPTS } from '../utils/constants';
import { Memory } from '../types';

const predefinedTags = ['childhood', 'family', 'values', 'achievements', 'relationships', 'hobbies', 'fears', 'dreams', 'advice', 'philosophy'];

const Train: React.FC = () => {
  const [isTextMode, setIsTextMode] = useState(true);
  const [text, setText] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saved, setSaved] = useState<Memory | null>(null);

  const current = (isTextMode ? text : transcribedText).trim();
  const tooShort = current.length < MIN_MEMORY_CHARS;
  const tooLong = current.length > MAX_MEMORY_CHARS;

  const handleAddTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) setTags([...tags, clean]);
    setNewTag('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading || tooShort || tooLong) return;

    setIsLoading(true);
    setSaved(null);
    const res = await apiService.trainMemory({ text: current, tags, source: isTextMode ? 'text' : 'voice' });
    setIsLoading(false);

    if (res.status === 'success' && res.data) {
      setSaved(res.data);
      setText('');
      setTranscribedText('');
      setTags([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert(res.message || 'Failed to train memory.');
    }
  };

  const handleVoiceComplete = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const wav = await blobToWav(audioBlob, 16000); // the format the server's speech model needs
      const res = await apiService.transcribe(wav);
      if (res.status === 'success' && res.data) {
        const words = res.data.transcript;
        if (!words) alert("I couldn't hear any words. Try again a little closer to the microphone.");
        // Each new recording is added to the end, so a long story can be told in parts.
        else setTranscribedText((prev) => (prev ? `${prev} ${words}` : words));
      } else {
        alert(res.message || 'Failed to transcribe audio.');
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      alert("Your browser couldn't read that recording. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const insertPrompt = (prompt: string) => {
    setIsTextMode(true);
    setText((prev) => (prev.trim() ? prev : `${prompt}\n\n`));
  };

  const counter = (value: string) => (
    <span className={`text-sm ${value.trim().length >= MIN_MEMORY_CHARS && value.trim().length <= MAX_MEMORY_CHARS ? 'text-green-600' : 'text-warm-grey'}`}>
      {value.trim().length} / {MAX_MEMORY_CHARS} characters
      {value.trim().length < MIN_MEMORY_CHARS && ` (minimum ${MIN_MEMORY_CHARS})`}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4 space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-gold to-copper-rose rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-charcoal">Train Your AI Memory</h1>
        </div>
        <p className="max-w-2xl mx-auto text-lg leading-relaxed text-warm-grey">
          Share experiences, thoughts and memories. The more you share, the more authentic your AI becomes.
        </p>
      </div>

      {saved && (
        <div className="p-4 border border-green-200 rounded-lg bg-green-50 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <Star className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="mb-1 font-medium text-green-800">Memory saved!</h3>
              <p className="text-sm leading-relaxed text-green-700">{saved.summary}</p>
              {saved.tags.length > 0 && <p className="mt-1 text-xs text-green-700">Tags: {saved.tags.join(', ')}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4">
        {[true, false].map((textMode) => (
          <button
            key={String(textMode)}
            onClick={() => setIsTextMode(textMode)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isTextMode === textMode ? 'bg-copper-rose text-white shadow-md' : 'bg-white text-warm-grey border border-warm-beige hover:bg-warm-beige/20'
            }`}
          >
            {textMode ? 'Text Input' : 'Voice Input'}
          </button>
        ))}
      </div>

      <div className="p-6 bg-white border rounded-xl border-warm-beige">
        <div className="flex items-center mb-4 space-x-2">
          <Lightbulb className="w-5 h-5 text-copper-rose" />
          <h2 className="text-lg font-semibold text-charcoal">Memory Prompts</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SAMPLE_MEMORY_PROMPTS.slice(0, 6).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => insertPrompt(prompt)}
              className="p-3 text-sm text-left transition-all border rounded-lg bg-ivory/50 hover:bg-rose-gold/10 border-warm-beige/50 hover:border-rose-gold/20 text-charcoal"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white border rounded-xl border-warm-beige">
        {isTextMode ? (
          <div>
            <label htmlFor="memory" className="block mb-2 text-sm font-medium text-charcoal">Share Your Memory</label>
            <textarea
              id="memory"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleSubmit()}
              placeholder="Tell me about a meaningful experience, your values, relationships, or anything that defines who you are..."
              className="w-full h-48 p-4 border rounded-lg resize-none border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2">
              {counter(text)}
              <span className="text-xs text-warm-grey">Press Ctrl+Enter to submit</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block mb-4 text-sm font-medium text-center text-charcoal">Record Your Memory</label>
            <VoiceRecorder onRecordingComplete={handleVoiceComplete} disabled={isLoading || isTranscribing} />
            {isTranscribing && <p className="mt-4 text-sm text-center text-warm-grey">Turning your words into text…</p>}

            {transcribedText && (
              <div className="mt-6">
                <label htmlFor="transcript" className="block mb-2 text-sm font-medium text-charcoal">
                  Transcription (fix any mistakes before saving; record again to add more)
                </label>
                <textarea
                  id="transcript"
                  value={transcribedText}
                  onChange={(e) => setTranscribedText(e.target.value)}
                  className="w-full h-40 p-4 border rounded-lg resize-none border-warm-beige bg-ivory/50 focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
                />
                <div className="mt-2">{counter(transcribedText)}</div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block mb-3 text-sm font-medium text-charcoal">Tags (optional, the AI also suggests some)</label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-3 py-1 text-sm border rounded-full bg-rose-gold/20 text-copper-rose border-rose-gold/30">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="ml-2 text-copper-rose/60 hover:text-copper-rose">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {predefinedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                disabled={tags.includes(tag)}
                className={`px-3 py-1 text-sm rounded-full border transition-all ${
                  tags.includes(tag)
                    ? 'bg-warm-beige text-warm-grey border-warm-beige cursor-not-allowed'
                    : 'bg-white text-warm-grey border-warm-beige hover:bg-rose-gold/10 hover:border-rose-gold/20 hover:text-copper-rose'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTag);
                }
              }}
              placeholder="Add custom tag..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
            />
            <button type="button" onClick={() => handleAddTag(newTag)} aria-label="Add tag" className="px-4 py-2 transition-colors rounded-lg bg-rose-gold/20 text-copper-rose hover:bg-rose-gold/30">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || tooShort || tooLong}
          className="flex items-center justify-center w-full py-4 space-x-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-rose-gold to-copper-rose hover:shadow-lg disabled:from-warm-beige disabled:to-warm-beige disabled:text-warm-grey disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" />
              <span>Saving memory…</span>
            </>
          ) : (
            <>
              <Heart className="w-5 h-5" />
              <span>Train AI Memory</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Train;