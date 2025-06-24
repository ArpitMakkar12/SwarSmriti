import React from 'react';
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    formatTime,
  } = useVoiceRecorder({ onRecordingComplete });

  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  React.useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => setIsPlaying(false);
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className={`
              flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200
              ${disabled 
                ? 'bg-warm-beige text-warm-grey cursor-not-allowed' 
                : 'bg-gradient-to-br from-rose-gold to-copper-rose text-white hover:shadow-lg hover:scale-105 active:scale-95'
              }
            `}
          >
            <Mic className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white animate-recording"
          >
            <Square className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center space-x-2 text-copper-rose">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Recording: {formatTime(recordingTime)}</span>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {audioBlob && !isRecording && (
        <div className="bg-white rounded-lg p-4 border border-warm-beige animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={playRecording}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-gold/20 text-copper-rose hover:bg-rose-gold/30 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <span className="text-sm text-warm-grey">
                {isPlaying ? 'Playing...' : 'Tap to play recording'}
              </span>
            </div>
            <button
              onClick={resetRecording}
              className="text-sm text-warm-grey hover:text-charcoal underline"
            >
              Re-record
            </button>
          </div>
          <audio ref={audioRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;