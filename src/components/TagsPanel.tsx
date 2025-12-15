import React from 'react';
import { TagResponse } from '../types';
import { Tag, Zap, Clock } from 'lucide-react';

interface TagsPanelProps {
  tagsData: TagResponse;
  loading?: boolean;
}

const TagsPanel: React.FC<TagsPanelProps> = ({ tagsData, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      topic: 'bg-blue-100 text-blue-800',
      engagement: 'bg-green-100 text-green-800',
      quality: 'bg-purple-100 text-purple-800',
      safety: 'bg-red-100 text-red-800',
      trending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Tag className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Tags</h3>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Zap className="h-3 w-3 mr-1" />
          {(tagsData.confidence * 100).toFixed(0)}% confidence
        </div>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {tagsData.tags.map((tag, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-900">#{tag.label}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(tag.category)}`}>
                {tag.category}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${tag.confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700 w-8 text-right">
                {(tag.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Info */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Generated: {formatTimestamp(tagsData.timestamp)}</span>
          </div>
          <div>
            <span className="font-medium">Model:</span> {tagsData.model}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsPanel;