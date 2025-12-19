import React from 'react';
import { NLPResponse } from '../types';
import { Brain, MessageSquare, Users, Hash } from 'lucide-react';

interface NLPContextPanelProps {
  nlpData: NLPResponse;
  loading?: boolean;
}

const NLPContextPanel: React.FC<NLPContextPanelProps> = ({ nlpData, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">NLP Analysis</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200/50 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200/50 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200/50 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'text-green-600 bg-green-100/50';
      case 'negative':
        return 'text-red-600 bg-red-100/50';
      default:
        return 'text-gray-600 bg-gray-100/50';
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      default:
        return '😐';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Brain className="h-5 w-5 text-purple-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">NLP Analysis</h3>
      </div>

      {/* Sentiment Analysis */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <MessageSquare className="h-4 w-4 text-purple-500 mr-2" />
          <h4 className="text-sm font-medium text-gray-700">Sentiment</h4>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getSentimentIcon(nlpData.sentiment.label)}</span>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(nlpData.sentiment.label)}`}>
              {nlpData.sentiment.label.charAt(0).toUpperCase() + nlpData.sentiment.label.slice(1)}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Score: {nlpData.sentiment.score.toFixed(2)} • Confidence: {(nlpData.sentiment.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Hash className="h-4 w-4 text-blue-500 mr-2" />
          <h4 className="text-sm font-medium text-gray-700">Topics</h4>
        </div>
        <div className="space-y-2">
          {nlpData.topics.map((topic, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                <span className="ml-2 text-xs text-gray-500">({topic.category})</span>
              </div>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200/50 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${topic.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {(topic.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entities */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Users className="h-4 w-4 text-green-500 mr-2" />
          <h4 className="text-sm font-medium text-gray-700">Entities</h4>
        </div>
        <div className="space-y-2">
          {nlpData.entities.map((entity, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">"{entity.text}"</span>
                <span className="ml-2 text-xs text-gray-500">({entity.type})</span>
              </div>
              <div className="flex items-center">
                <div className="w-12 bg-gray-200/50 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${entity.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {(entity.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Context Summary */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Context Summary</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{nlpData.context}</p>
      </div>
    </div>
  );
};

export default NLPContextPanel;