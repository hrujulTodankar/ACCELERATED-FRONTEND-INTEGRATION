import React, { useEffect, useState, useCallback } from 'react';
import { AdaptiveTag as AdaptiveTagType } from '../types';

interface AdaptiveTagProps {
  tag: AdaptiveTagType;
  onInteraction?: (interaction: any) => void;
  className?: string;
}

export const AdaptiveTag: React.FC<AdaptiveTagProps> = ({
  tag,
  onInteraction,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = useCallback((event: React.MouseEvent) => {
    setIsClicked(!isClicked);
    
    onInteraction?.({
      type: 'click',
      tagId: tag.id,
      timestamp: new Date().toISOString(),
      metadata: {
        x: event.clientX,
        y: event.clientY
      }
    });
  }, [tag.id, isClicked, onInteraction]);

  const handleHover = useCallback((event: React.MouseEvent) => {
    setIsHovered(true);
    
    onInteraction?.({
      type: 'hover',
      tagId: tag.id,
      timestamp: new Date().toISOString(),
      metadata: {
        x: event.clientX,
        y: event.clientY
      }
    });
  }, [tag.id, onInteraction]);

  const handleBlur = useCallback(() => {
    setIsHovered(false);
    
    onInteraction?.({
      type: 'blur',
      tagId: tag.id,
      timestamp: new Date().toISOString()
    });
  }, [tag.id, onInteraction]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'behavioral': 'bg-blue-100 text-blue-800',
      'analytical': 'bg-purple-100 text-purple-800',
      'contextual': 'bg-green-100 text-green-800',
      'dynamic': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className={`
        adaptive-tag
        ${className}
        ${isHovered ? 'ring-2 ring-blue-300' : ''}
        ${isClicked ? 'bg-blue-50' : 'bg-white'}
        border border-gray-200 rounded-lg p-4 shadow-sm
        transition-all duration-200
        hover:shadow-md
        cursor-pointer
      `}
      onClick={handleClick}
      onMouseEnter={handleHover}
      onMouseLeave={handleBlur}
      data-tag-id={tag.id}
      data-category={tag.category}
    >
      <div className="adaptive-tag-header flex items-start justify-between mb-3">
        <div className="tag-info">
          <h3 className="tag-name text-lg font-semibold text-gray-900">
            {tag.label}
          </h3>
          <div className="tag-category mt-1">
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(tag.category)}`}>
              {tag.category}
            </span>
          </div>
        </div>
        
        <div className="tag-confidence">
          <div className={`text-sm font-medium ${getConfidenceColor(tag.confidence)}`}>
            {Math.round(tag.confidence * 100)}%
          </div>
          <div className="text-xs text-gray-500">confidence</div>
        </div>
      </div>

      {tag.appearance && (
        <div className="adaptive-tag-appearance mb-3">
          <div className="text-sm text-gray-600">
            Style: {tag.appearance.style} • Size: {tag.appearance.size}
          </div>
        </div>
      )}

      {tag.behavior && (
        <div className="adaptive-tag-behavior mb-3">
          <div className="text-sm text-gray-600">
            Adaptive: {tag.behavior.adaptToUser ? 'Yes' : 'No'} • 
            Animations: {tag.behavior.animationEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      )}

      {tag.interactions && tag.interactions.length > 0 && (
        <div className="adaptive-tag-interactions">
          <div className="text-xs text-gray-500 mb-2">Recent interactions:</div>
          <div className="space-y-1">
            {tag.interactions.slice(-3).map((interaction, index) => (
              <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                {interaction.type} • {new Date(interaction.timestamp).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="adaptive-tag-footer mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date(tag.lastUpdated).toLocaleDateString()}</span>
          {isHovered && (
            <div className="flex space-x-2">
              <span className="text-blue-600 font-medium">Click to interact</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveTag;