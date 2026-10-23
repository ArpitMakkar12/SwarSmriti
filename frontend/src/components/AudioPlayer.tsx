import React, { useEffect, useId, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  label?: string; // e.g. "In Arpit's voice"
  className?: string;
}

const BARS = 64;

/** Read the real loudness of the audio, in BARS slices, so the waveform is the actual voice. */
async function readPeaks(url: string): Promise<number[]> {
  const data = await (await fetch(url)).arrayBuffer();
  const buffer = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(data);
  const samples = buffer.getChannelData(0);
  const slice = Math.max(1, Math.floor(samples.length / BARS));
  const peaks: number[] = [];
  for (let i = 0; i < BARS; i++) {
    let max = 0;
    for (let j = i * slice; j < (i + 1) * slice && j < samples.length; j += 16) {
      max = Math.max(max, Math.abs(samples[j]));
    }
    peaks.push(max);
  }
  const loudest = Math.max(...peaks, 0.01);
  return peaks.map((p) => Math.max(0.1, p / loudest));
}

const formatTime = (t: number) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;

/**
 * Plays a reply as an "ink" waveform drawn from the real audio.
 * The part already heard turns oxblood; click or drag anywhere on it to jump.
 */
const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, autoPlay = false, label, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clipId = useId();
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [failed, setFailed] = useState(false);

  // Draw the waveform from the audio itself (falls back to a gentle flat line).
  useEffect(() => {
    let cancelled = false;
    readPeaks(audioUrl)
      .then((p) => !cancelled && setPeaks(p))
      .catch(() => !cancelled && setPeaks(Array(BARS).fill(0.18)));
    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      // Browsers may block autoplay until the user has clicked something; that's fine.
      if (autoPlay) audio.play().catch(() => undefined);
    };
    const onPlay = () => {
      setIsPlaying(true);
      // Only one voice speaks at a time: pause every other player on the page.
      document.querySelectorAll('audio').forEach((other) => other !== audio && other.pause());
    };
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => setFailed(true);

    const events: [string, () => void][] = [
      ['loadedmetadata', onLoaded],
      ['play', onPlay],
      ['pause', onPause],
      ['timeupdate', onTime],
      ['ended', onEnded],
      ['error', onError],
    ];
    events.forEach(([name, fn]) => audio.addEventListener(name, fn));
    return () => events.forEach(([name, fn]) => audio.removeEventListener(name, fn));
  }, [audioUrl, autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // The 'play' / 'pause' listeners above keep the icon in sync.
    if (isPlaying) audio.pause();
    else audio.play().catch(() => setFailed(true));
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
  };

  if (failed) return <p className={`text-sm italic text-ink-muted ${className}`}>This voice note couldn't be played.</p>;

  const width = BARS * 6;
  const heard = duration > 0 ? (currentTime / duration) * width : 0;
  const bars = (peaks ?? Array(BARS).fill(0.1)).map((p, i) => ({ x: i * 6 + 3, h: p * 34 }));

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Always rendered, so it can load (the old player hid it while "loading" and never loaded). */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : `Play${label ? ` – ${label}` : ''}`}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-oxblood text-card transition-colors hover:bg-oxblood-deep"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative h-10">
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${width} 40`}
            preserveAspectRatio="none"
            className={`h-10 w-full ${peaks ? 'animate-ink-in' : ''}`}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={heard} height="40" />
              </clipPath>
            </defs>
            <g stroke="#C9BBA6" strokeWidth="2.4" strokeLinecap="round">
              {bars.map((b) => (
                <line key={b.x} x1={b.x} x2={b.x} y1={20 - b.h / 2} y2={20 + b.h / 2} />
              ))}
            </g>
            <g stroke="#8C2F39" strokeWidth="2.4" strokeLinecap="round" clipPath={`url(#${clipId})`}>
              {bars.map((b) => (
                <line key={b.x} x1={b.x} x2={b.x} y1={20 - b.h / 2} y2={20 + b.h / 2} />
              ))}
            </g>
          </svg>
          {/* An invisible slider on top: click/drag/arrow keys to move through the voice note. */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={seek}
            aria-label="Position in voice note"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="flex justify-between text-xs text-ink-muted">
          <span>{label}</span>
          <span>
            {formatTime(currentTime)}
            {duration > 0 && ` / ${formatTime(duration)}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;