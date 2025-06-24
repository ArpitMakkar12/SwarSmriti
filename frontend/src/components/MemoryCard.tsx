import React from 'react';
import { Calendar, Tag, FileText } from 'lucide-react';
import { Memory } from '../types';

interface MemoryCardProps {
  memory: Memory;
  onClick?: () => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg border border-warm-beige p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-copper-rose" />
          <span className="text-sm text-warm-grey">Memory</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-warm-grey">
          <Calendar className="w-3 h-3" />
          <span>{new Date(memory.timestamp).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-charcoal font-medium text-sm mb-2 line-clamp-2 group-hover:text-copper-rose transition-colors">
          {memory.summary}
        </p>
      </div>

      {/* Tags */}
      {memory.tags && memory.tags.length > 0 && (
        <div className="flex items-center space-x-2 mb-3">
          <Tag className="w-3 h-3 text-warm-grey" />
          <div className="flex flex-wrap gap-1">
            {memory.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-rose-gold/10 text-copper-rose text-xs rounded-full border border-rose-gold/20"
              >
                {tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="text-xs text-warm-grey">
                +{memory.tags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className="bg-ivory/50 rounded p-2 border border-warm-beige/50">
        <p className="text-xs text-warm-grey line-clamp-2">
          {memory.text.substring(0, 150)}
          {memory.text.length > 150 && '...'}
        </p>
      </div>
    </div>
  );
};

export default MemoryCard;