import React from 'react';
import { Brain, Hash, AlertTriangle } from 'lucide-react';

interface Entity {
  text: string;
  label: string;
  confidence: number;
}

interface NLPData {
  entities: Entity[];
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  keywords: string[];
  language?: string;
  summary?: string;
}

interface NLPContextPanelProps {
  nlpData: NLPData;
  loading?: boolean;
}

const NLPContextPanel: React.FC<NLPContextPanelProps> = ({ nlpData, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">NLP Analysis</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEntityColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'person':
        return 'bg-blue-100 text-blue-800';
      case 'location':
        return 'bg-green-100 text-green-800';
      case 'organization':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">NLP Analysis</h3>
      <div className="space-y-4">
        {/* Sentiment */}
        <div>
          <h4 className="text-sm font-medium mb-2">Sentiment</h4>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(nlpData.sentiment.label)}`}>
              {nlpData.sentiment.label.charAt(0).toUpperCase() + nlpData.sentiment.label.slice(1)}
            </span>
            <span className="text-sm text-gray-600">
              Score: {(nlpData.sentiment.score * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Entities */}
        {nlpData.entities && nlpData.entities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Entities</h4>
            <div className="flex flex-wrap gap-2">
              {nlpData.entities.map((entity, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-1"
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEntityColor(entity.label)}`}>
                    {entity.text}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({entity.confidence.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {nlpData.keywords && nlpData.keywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {nlpData.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Language */}
        {nlpData.language && (
          <div>
            <h4 className="text-sm font-medium mb-2">Language</h4>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {nlpData.language.toUpperCase()}
            </span>
          </div>
        )}

        {/* Summary */}
        {nlpData.summary && (
          <div>
            <h4 className="text-sm font-medium mb-2">Summary</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {nlpData.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NLPContextPanel;