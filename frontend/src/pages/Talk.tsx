import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic, Square, ArrowUp } from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import { InkDots, NeedsPerson } from '../components/ui';
import { usePerson } from '../context/PersonContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { ChatMessage, ChatReply, HistoryTurn, Person } from '../types';
import { apiService } from '../services/api';
import { base64ToAudioUrl, blobToWav } from '../utils/audio';

const STARTERS = ['What was your childhood like?', 'What advice would you give me?', 'Tell me about our family.'];

/** One conversation with one person. Switching person starts a fresh conversation (see Talk below). */
const Conversation: React.FC<{ person: Person }> = ({ person }) => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(searchParams.get('ask') ?? '');
  const [busy, setBusy] = useState(false);
  const personaName = person.name;
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const add = (m: Omit<ChatMessage, 'id' | 'timestamp'>) =>
    setMessages((prev) => [...prev, { ...m, id: `m${nextId.current++}`, timestamp: new Date().toISOString() }]);

  // The last few turns go with each question so the conversation flows. Error notes are left out.
  const history = (): HistoryTurn[] =>
    messagesRef.current
      .filter((m) => !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));

  const addReply = (reply: ChatReply) =>
    add({
      type: 'ai',
      content: reply.answer,
      audioUrl: reply.audio_base64 ? base64ToAudioUrl(reply.audio_base64) : undefined,
      audioError: reply.audio_error ?? undefined,
      memories: reply.memories_used,
    });

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const past = history();
    setInput('');
    add({ type: 'user', content: q });
    setBusy(true);
    const res = await apiService.chat(person.id, q, past);
    setBusy(false);
    if (res.status === 'success' && res.data) addReply(res.data);
    else add({ type: 'ai', isError: true, content: res.message || 'Something went wrong. Please try again.' });
  };

  // Speaking: the mic lives right in the question bar. Tap to start, tap again to send.
  const onRecorded = useCallback(async (blob: Blob) => {
    const past = history();
    setBusy(true);
    try {
      const wav = await blobToWav(blob, 16000);
      const res = await apiService.voiceChat(person.id, wav, past);
      if (res.status === 'success' && res.data) {
        add({ type: 'user', content: res.data.transcript });
        addReply(res.data);
      } else {
        add({ type: 'ai', isError: true, content: res.message || "That voice message couldn't be understood." });
      }
    } catch {
      add({ type: 'ai', isError: true, content: "Your browser couldn't read that recording. Please try again." });
    } finally {
      setBusy(false);
    }
    // history/add/addReply only use refs and state setters; person never changes inside one Conversation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isRecording, recordingTime, startRecording, stopRecording, formatTime } = useVoiceRecorder({ onRecordingComplete: onRecorded });

  const name = personaName || 'them';
  const lastAiId = [...messages].reverse().find((m) => m.type === 'ai' && !m.isError)?.id;

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-10">
      <header className="flex flex-col gap-2 animate-fade-in">
        <span className="eyebrow">In conversation with</span>
        <h1 className="text-5xl font-normal leading-none font-display text-ink sm:text-6xl">{personaName}</h1>
        <p className="text-ink-soft">Built from the memories you've shared, spoken in their voice.</p>
      </header>

      <section aria-label="Conversation" aria-live="polite" className="flex flex-col flex-1 max-w-3xl gap-10">
        {messages.length === 0 && !busy && (
          <div className="flex flex-col gap-4 py-6 animate-fade-in">
            <p className="text-2xl italic font-display text-ink-soft">Where would you like to begin?</p>
            <div className="flex flex-wrap gap-3">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="border border-rule px-4 py-3 text-left font-display text-[15px] italic text-ink-soft transition-colors hover:border-oxblood hover:bg-card hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} personaName={personaName} isLatest={m.id === lastAiId} />
        ))}

        {busy && (
          <p className="flex items-center gap-3 text-lg italic font-display text-ink-soft">
            <InkDots /> {personaName || 'They'} {messages.length && messages[messages.length - 1].type === 'user' ? 'is remembering…' : 'is listening…'}
          </p>
        )}
        <div ref={endRef} />
      </section>

      {/* The question bar stays at the bottom of the screen */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="sticky bottom-0 flex max-w-3xl items-center gap-3 bg-gradient-to-t from-paper from-70% to-transparent pb-6 pt-6"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 border-b-[1.5px] border-ink pb-2">
          {isRecording ? (
            <p className="flex-1 py-2 text-xl italic font-display text-oxblood" aria-live="polite">
              Listening… {formatTime(recordingTime)} <span className="text-base text-ink-soft">tap the square to send</span>
            </p>
          ) : (
            <>
              <label htmlFor="ask" className="sr-only">
                Ask {name} something
              </label>
              <input
                id="ask"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
                placeholder={`Ask ${name} something…`}
                className="flex-1 min-w-0 py-2 text-xl italic bg-transparent outline-none font-display text-ink placeholder:text-ink-muted/80"
              />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={busy}
          aria-label={isRecording ? 'Stop and send voice message' : 'Ask by voice'}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
            isRecording ? 'bg-oxblood text-card animate-record-ring' : 'border-[1.5px] border-ink text-ink hover:bg-ink hover:text-paper'
          }`}
        >
          {isRecording ? <Square className="w-4 h-4" fill="currentColor" /> : <Mic className="w-5 h-5" strokeWidth={1.7} />}
        </button>
        {!isRecording && (
          <button type="submit" disabled={busy || !input.trim()} aria-label="Ask" className="flex items-center justify-center w-12 h-12 transition-colors rounded-full shrink-0 bg-ink text-paper hover:bg-oxblood disabled:opacity-40">
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );
};

/** The Talk page: a fresh conversation for whoever is selected in the side column. */
const Talk: React.FC = () => {
  const { current, loading } = usePerson();
  if (!current) return loading ? null : <NeedsPerson what="starting a conversation" />;
  // key = person id: switching person throws away the old conversation and starts a new one.
  return <Conversation key={current.id} person={current} />;
};

export default Talk;