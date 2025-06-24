import React, { useState } from 'react';
import { Plus, Sparkles, Lightbulb, Heart, Star } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';
import { apiService } from '../services/api';
import { SAMPLE_MEMORY_PROMPTS } from '../utils/constants';

const Train: React.FC = () => {
  const [isTextMode, setIsTextMode] = useState(true);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState('');

  const predefinedTags = [
    'childhood', 'family', 'values', 'achievements', 'relationships', 
    'hobbies', 'fears', 'dreams', 'advice', 'philosophy'
  ];

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const textToSubmit = isTextMode ? text.trim() : transcribedText.trim();
    
    if (!textToSubmit) {
      alert('Please enter some text or record audio first.');
      return;
    }

    if (textToSubmit.length < 100) {
      alert('Please enter at least 100 characters for training.');
      return;
    }

    setIsLoading(true);
    setLastResponse(null);

    try {
      console.log('Submitting training data:', { text: textToSubmit, tags });
      
      const response = await apiService.trainMemory({
        text: textToSubmit,
        tags: tags
      });

      console.log('Training response:', response);

      console.log("🔍 Response received from backend:", response);

      if ((response.status === 'success' || response.message?.includes('success')) && response.data) {
        setLastResponse(response.data.summary);
        setText('');
        setTranscribedText('');
        setTags([]);
        
        // Scroll to success message
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        const errorMessage = response.message || response.error_message || 'Failed to train memory';
        alert(errorMessage);
        console.error('Training failed:', response);
      }
    } catch (error) {
      console.error('Training failed:', error);
      alert('Failed to train memory. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceComplete = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Convert Blob to File
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      console.log('Transcribing audio file:', audioFile);
      
      const response = await apiService.transcribeAudio(audioFile);
      console.log('Transcription response:', response);
      
      if (response.status === 'success' && response.data) {
        setTranscribedText(response.data.transcript);
      } else {
        alert('Failed to transcribe audio. Please try again.');
        console.error('Transcription failed:', response);
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const insertPrompt = (prompt: string) => {
    if (isTextMode) {
      setText(prompt);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const isSubmitDisabled = () => {
    const textToCheck = isTextMode ? text.trim() : transcribedText.trim();
    return isLoading || !textToCheck || textToCheck.length < 100;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4 space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-gold to-copper-rose rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-charcoal">Train Your AI Memory</h1>
        </div>
        <p className="max-w-2xl mx-auto text-lg leading-relaxed text-warm-grey">
          Share your experiences, thoughts, and memories to help build your AI doppelganger. 
          The more you share, the more authentic your AI becomes.
        </p>
      </div>

      {/* Success Message */}
      {lastResponse && (
        <div className="p-4 border border-green-200 rounded-lg bg-green-50 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <Star className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="mb-1 font-medium text-green-800">Memory Successfully Trained!</h3>
              <p className="text-sm leading-relaxed text-green-700">{lastResponse}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Mode Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => setIsTextMode(true)}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isTextMode
              ? 'bg-copper-rose text-white shadow-md'
              : 'bg-white text-warm-grey border border-warm-beige hover:bg-warm-beige/20'
          }`}
        >
          Text Input
        </button>
        <button
          onClick={() => setIsTextMode(false)}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            !isTextMode
              ? 'bg-copper-rose text-white shadow-md'
              : 'bg-white text-warm-grey border border-warm-beige hover:bg-warm-beige/20'
          }`}
        >
          Voice Input
        </button>
      </div>

      {/* Sample Prompts */}
      <div className="p-6 bg-white border rounded-xl border-warm-beige">
        <div className="flex items-center mb-4 space-x-2">
          <Lightbulb className="w-5 h-5 text-copper-rose" />
          <h2 className="text-lg font-semibold text-charcoal">Memory Prompts</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SAMPLE_MEMORY_PROMPTS.slice(0, 6).map((prompt, index) => (
            <button
              key={index}
              onClick={() => insertPrompt(prompt)}
              className="p-3 text-sm text-left transition-all border rounded-lg bg-ivory/50 hover:bg-rose-gold/10 border-warm-beige/50 hover:border-rose-gold/20 text-charcoal"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white border rounded-xl border-warm-beige">
        {isTextMode ? (
          /* Text Input */
          <div>
            <label className="block mb-2 text-sm font-medium text-charcoal">
              Share Your Memory
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Tell me about a meaningful experience, your values, relationships, or anything that defines who you are..."
              className="w-full h-48 p-4 border rounded-lg resize-none border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${text.length >= 100 ? 'text-green-600' : 'text-warm-grey'}`}>
                {text.length} characters {text.length < 100 && '(minimum 100 required)'}
              </span>
              <span className="text-xs text-warm-grey">
                Press Ctrl+Enter to submit
              </span>
            </div>
          </div>
        ) : (
          /* Voice Input */
          <div>
            <label className="block mb-4 text-sm font-medium text-center text-charcoal">
              Record Your Memory
            </label>
            <VoiceRecorder onRecordingComplete={handleVoiceComplete} disabled={isLoading} />
            
            {transcribedText && (
              <div className="p-4 mt-6 border rounded-lg bg-ivory/50 border-warm-beige">
                <h3 className="mb-2 font-medium text-charcoal">Transcription:</h3>
                <p className="text-sm leading-relaxed text-charcoal">{transcribedText}</p>
                <div className="mt-2">
                  <span className={`text-sm ${transcribedText.length >= 100 ? 'text-green-600' : 'text-warm-grey'}`}>
                    {transcribedText.length} characters {transcribedText.length < 100 && '(minimum 100 required)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags Section */}
        <div>
          <label className="block mb-3 text-sm font-medium text-charcoal">
            Tags (Help categorize this memory)
          </label>
          
          {/* Selected Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 text-sm border rounded-full bg-rose-gold/20 text-copper-rose border-rose-gold/30"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-copper-rose/60 hover:text-copper-rose"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Predefined Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {predefinedTags.map((tag, index) => (
              <button
                key={index}
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

          {/* Custom Tag Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTag);
                }
              }}
              placeholder="Add custom tag..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
            />
            <button
              type="button"
              onClick={() => handleAddTag(newTag)}
              className="px-4 py-2 transition-colors rounded-lg bg-rose-gold/20 text-copper-rose hover:bg-rose-gold/30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled()}
          className={`w-full py-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
            isSubmitDisabled()
              ? 'bg-warm-beige text-warm-grey cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-gold to-copper-rose text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Heart className="w-5 h-5" />
              <span>Train AI Memory</span>
            </>
          )}
        </button>

        {/* Debug Info */}
        {import.meta.env.MODE === 'development' && (
          <div className="p-2 text-xs rounded text-warm-grey bg-ivory/50">
            <strong>Debug:</strong> Text length: {isTextMode ? text.length : transcribedText.length}, 
            Tags: {tags.length}, 
            Loading: {isLoading.toString()}, 
            Disabled: {isSubmitDisabled().toString()}
          </div>
        )}
      </form>
    </div>
  );
};

export default Train;