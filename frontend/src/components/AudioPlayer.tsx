import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, autoPlay = false, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [failed, setFailed] = useState(false);

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
      // Only one reply speaks at a time: pause every other player on the page.
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

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // The 'play' / 'pause' listeners above keep the icon in sync.
    if (isPlaying) audio.pause();
    else audio.play().catch(() => setFailed(true));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (failed) {
    return <p className={`text-xs text-warm-grey ${className}`}>Audio couldn't be played.</p>;
  }

  // The <audio> element is ALWAYS rendered. (Before, it was hidden while "loading",
  // so it could never load -- the spinner stayed forever.)
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <button
        type="button"
        onClick={togglePlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full bg-copper-rose hover:bg-copper-rose/80"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <div className="flex items-center flex-1 space-x-2">
        <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-warm-beige">
          <div className="h-full transition-all duration-100 rounded-full bg-copper-rose" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center space-x-1 text-xs text-warm-grey min-w-max">
          <Volume2 className="w-3 h-3" />
          <span>{formatTime(currentTime)}</span>
          {duration > 0 && (
            <>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;