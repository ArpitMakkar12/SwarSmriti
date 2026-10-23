import React from 'react';
import { Mic, Square, Play, Pause, RotateCcw } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
  /** Show the "listen back / record again" row after recording. */
  showPlayback?: boolean;
  /** Words under the button before recording starts. */
  hint?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  disabled,
  showPlayback = true,
  hint = 'Tap to start speaking',
}) => {
  const { isRecording, recordingTime, audioBlob, startRecording, stopRecording, resetRecording, formatTime } =
    useVoiceRecorder({ onRecordingComplete });

  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.onended = () => setIsPlaying(false);
    }
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          aria-label="Start recording"
          className="flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          <Mic className="h-7 w-7" strokeWidth={1.6} />
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          aria-label="Stop recording"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-oxblood text-card animate-record-ring"
        >
          <Square className="h-6 w-6" fill="currentColor" />
        </button>
      )}

      <p className="text-sm text-ink-soft" aria-live="polite">
        {isRecording ? (
          <span>
            <span className="font-medium text-oxblood">Listening · {formatTime(recordingTime)}</span> · tap to finish
          </span>
        ) : (
          hint
        )}
      </p>

      {showPlayback && audioBlob && !isRecording && (
        <div className="flex items-center gap-5 rounded-full border border-rule px-4 py-2 animate-fade-in">
          <button type="button" onClick={togglePlayback} className="flex items-center gap-2 text-sm text-ink hover:text-oxblood">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Listen back'}
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-rule" />
          <button type="button" onClick={resetRecording} className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
          <audio ref={audioRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;