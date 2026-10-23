import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Calendar, Tag, Trash2 } from 'lucide-react';
import MemoryCard from '../components/MemoryCard';
import { apiService } from '../services/api';
import { Memory } from '../types';

const Memories: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Before, this called http://localhost:8000 directly, so the live site always showed 0.
    apiService.getMemories().then((res) => {
      if (res.status === 'success' && res.data) setMemories(res.data);
      else setError(res.message || 'Could not load memories.');
      setLoading(false);
    });
  }, []);

  const deleteSelected = async () => {
    if (!selectedMemory || !confirm('Delete this memory forever? The AI will no longer know it.')) return;
    setDeleting(true);
    const res = await apiService.deleteMemory(selectedMemory.id);
    setDeleting(false);
    if (res.status === 'success') {
      setMemories((prev) => prev.filter((m) => m.id !== selectedMemory.id));
      setSelectedMemory(null);
    } else {
      alert(res.message || 'Could not delete the memory.');
    }
  };

  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags))).sort();
  const term = searchTerm.toLowerCase();

  const shown = memories
    .filter(
      (m) =>
        (term === '' ||
          m.text.toLowerCase().includes(term) ||
          m.summary.toLowerCase().includes(term) ||
          m.tags.some((t) => t.includes(term))) &&
        (selectedTag === '' || m.tags.includes(selectedTag)),
    )
    .sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sortBy === 'newest' ? diff : -diff;
    });

  const totalChars = memories.reduce((acc, m) => acc + m.text.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4 space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-gold to-copper-rose rounded-xl">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-charcoal">Your Memories</h1>
        </div>
        <p className="max-w-2xl mx-auto text-lg text-warm-grey">
          Browse and explore all the memories you've shared to build your AI doppelganger.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { value: memories.length, label: 'Total Memories' },
          { value: allTags.length, label: 'Unique Tags' },
          { value: totalChars >= 1000 ? `${(totalChars / 1000).toFixed(1)}k` : totalChars, label: 'Characters Shared' },
        ].map((s) => (
          <div key={s.label} className="p-4 text-center bg-white border rounded-lg border-warm-beige">
            <div className="text-2xl font-bold text-charcoal">{s.value}</div>
            <div className="text-sm text-warm-grey">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-4 bg-white border rounded-xl border-warm-beige">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-warm-grey" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-10 pr-4 border rounded-lg border-warm-beige focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
            />
          </div>
          <div className="relative">
            <Tag className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-warm-grey" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="pl-10 pr-8 py-3 border border-warm-beige rounded-lg appearance-none bg-white min-w-[150px] focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-warm-grey" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="pl-10 pr-8 py-3 border border-warm-beige rounded-lg appearance-none bg-white min-w-[140px] focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose"
            >
              <option value="newest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        {(searchTerm || selectedTag) && (
          <button onClick={() => { setSearchTerm(''); setSelectedTag(''); }} className="text-xs underline text-warm-grey hover:text-charcoal">
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">{error}</p>}

      <div className="text-sm text-warm-grey">
        {loading ? 'Loading memories…' : `Showing ${shown.length} of ${memories.length} memories`}
      </div>

      {shown.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((memory, index) => (
            <div key={memory.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}>
              <MemoryCard memory={memory} onClick={() => setSelectedMemory(memory)} />
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-warm-beige/50">
              <BookOpen className="w-8 h-8 text-warm-grey" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-charcoal">No memories found</h3>
            <p className="text-warm-grey">
              {searchTerm || selectedTag ? 'Try adjusting your search or filters' : 'Start by training your AI with some memories'}
            </p>
          </div>
        )
      )}

      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedMemory(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-charcoal">Memory Details</h2>
                <button onClick={() => setSelectedMemory(null)} aria-label="Close" className="text-warm-grey hover:text-charcoal">✕</button>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-charcoal">Summary</h3>
                <p className="p-3 border rounded-lg text-copper-rose bg-rose-gold/10 border-rose-gold/20">{selectedMemory.summary}</p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-charcoal">Full Memory</h3>
                <p className="p-4 leading-relaxed whitespace-pre-wrap border rounded-lg text-charcoal bg-ivory/50 border-warm-beige">{selectedMemory.text}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-warm-grey">
                <span>Created: {new Date(selectedMemory.timestamp).toLocaleString()}</span>
                <span>{selectedMemory.text.length} characters</span>
                <span>{selectedMemory.source === 'voice' ? 'Recorded by voice' : 'Typed'}</span>
              </div>
              {selectedMemory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMemory.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 text-sm border rounded-full bg-rose-gold/20 text-copper-rose border-rose-gold/30">{tag}</span>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-warm-beige">
                <button onClick={deleteSelected} disabled={deleting} className="flex items-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50">
                  <Trash2 className="w-4 h-4 mr-1" /> {deleting ? 'Deleting…' : 'Delete this memory'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memories;