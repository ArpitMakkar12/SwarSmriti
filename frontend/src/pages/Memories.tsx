import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Calendar, Tag } from 'lucide-react';
import MemoryCard from '../components/MemoryCard';
import { Memory } from '../types';

const Memories: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'relevance'>('date');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Mock data - In real app, this would come from API
  // useEffect(() => {
  //   const mockMemories: Memory[] = [
  //     {
  //       id: '1',
  //       text: 'I remember spending summers at my grandmother\'s house in the countryside. The smell of fresh-baked bread, the sound of birds chirping, and the feeling of complete freedom as I ran through the fields. Those were some of the happiest moments of my childhood.',
  //       summary: 'Cherished childhood summers at grandmother\'s countryside home',
  //       tags: ['childhood', 'family', 'happiness'],
  //       timestamp: '2024-01-15T10:30:00Z',
  //     },
  //     {
  //       id: '2',
  //       text: 'My core values center around honesty, compassion, and perseverance. I believe that treating others with kindness and respect, even in difficult situations, is fundamental to who I am. These values were shaped by my parents\' example and life experiences.',
  //       summary: 'Core personal values of honesty, compassion, and perseverance',
  //       tags: ['values', 'philosophy', 'family'],
  //       timestamp: '2024-01-14T15:45:00Z',
  //     },
  //     {
  //       id: '3',
  //       text: 'The day I graduated from college was one of my proudest achievements. Not just for the degree, but for overcoming the challenges and doubts along the way. It taught me that persistence and hard work really do pay off.',
  //       summary: 'College graduation as a proud personal achievement',
  //       tags: ['achievements', 'education', 'perseverance'],
  //       timestamp: '2024-01-13T09:20:00Z',
  //     },
  //     {
  //       id: '4',
  //       text: 'I love reading mystery novels and cooking experiments on weekends. There\'s something magical about getting lost in a good book or creating something delicious from simple ingredients. These hobbies bring me peace and joy.',
  //       summary: 'Enjoys reading mystery novels and experimental cooking',
  //       tags: ['hobbies', 'reading', 'cooking'],
  //       timestamp: '2024-01-12T18:15:00Z',
  //     },
  //   ];
  //   setMemories(mockMemories);
  // }, []);
  useEffect(() => {
  const fetchMemories = async () => {
    try {
      const res = await fetch('http://localhost:8000/memories'); // or your correct FastAPI backend URL
      const json = await res.json();
      if (json.status === 'success') {
        setMemories(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    }
  };

  fetchMemories();
}, []);


  const allTags = Array.from(new Set(memories.flatMap(memory => memory.tags)));

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = searchTerm === '' || 
      memory.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTag === '' || memory.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const sortedMemories = [...filteredMemories].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return 0; // For relevance, would implement proper scoring
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-4 text-center bg-white border rounded-lg border-warm-beige">
          <div className="text-2xl font-bold text-charcoal">{memories.length}</div>
          <div className="text-sm text-warm-grey">Total Memories</div>
        </div>
        <div className="p-4 text-center bg-white border rounded-lg border-warm-beige">
          <div className="text-2xl font-bold text-charcoal">{allTags.length}</div>
          <div className="text-sm text-warm-grey">Unique Tags</div>
        </div>
        <div className="p-4 text-center bg-white border rounded-lg border-warm-beige">
          <div className="text-2xl font-bold text-charcoal">
            {Math.round(memories.reduce((acc, mem) => acc + mem.text.length, 0) / 1000)}k
          </div>
          <div className="text-sm text-warm-grey">Characters Shared</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-6 space-y-4 bg-white border rounded-xl border-warm-beige">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
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

          {/* Tag Filter */}
          <div className="relative">
            <Tag className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-warm-grey" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="pl-10 pr-8 py-3 border border-warm-beige rounded-lg focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose appearance-none bg-white min-w-[150px]"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <Calendar className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-warm-grey" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'relevance')}
              className="pl-10 pr-8 py-3 border border-warm-beige rounded-lg focus:ring-2 focus:ring-copper-rose/20 focus:border-copper-rose appearance-none bg-white min-w-[140px]"
            >
              <option value="date">Latest First</option>
              <option value="relevance">Most Relevant</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedTag) && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-warm-grey">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 text-xs rounded-full bg-copper-rose/10 text-copper-rose">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedTag && (
              <span className="px-2 py-1 text-xs rounded-full bg-rose-gold/10 text-copper-rose">
                Tag: {selectedTag}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTag('');
              }}
              className="text-xs underline text-warm-grey hover:text-charcoal"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4 text-sm text-warm-grey">
        Showing {sortedMemories.length} of {memories.length} memories
      </div>

      {/* Memory Grid */}
      {sortedMemories.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedMemories.map((memory, index) => (
            <div
              key={memory.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <MemoryCard
                memory={memory}
                onClick={() => setSelectedMemory(memory)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-warm-beige/50">
            <BookOpen className="w-8 h-8 text-warm-grey" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-charcoal">No memories found</h3>
          <p className="text-warm-grey">
            {searchTerm || selectedTag 
              ? 'Try adjusting your search terms or filters'
              : 'Start by training your AI with some memories'
            }
          </p>
        </div>
      )}

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-charcoal">Memory Details</h2>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="text-warm-grey hover:text-charcoal"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-medium text-charcoal">Summary</h3>
                  <p className="p-3 border rounded-lg text-copper-rose bg-rose-gold/10 border-rose-gold/20">
                    {selectedMemory.summary}
                  </p>
                </div>
                
                <div>
                  <h3 className="mb-2 font-medium text-charcoal">Full Memory</h3>
                  <p className="p-4 leading-relaxed border rounded-lg text-charcoal bg-ivory/50 border-warm-beige">
                    {selectedMemory.text}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-sm text-warm-grey">
                  <div className="flex items-center space-x-4">
                    <span>
                      Created: {new Date(selectedMemory.timestamp).toLocaleDateString()}
                    </span>
                    <span>
                      {selectedMemory.text.length} characters
                    </span>
                  </div>
                </div>
                
                {selectedMemory.tags.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium text-charcoal">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm border rounded-full bg-rose-gold/20 text-copper-rose border-rose-gold/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memories;