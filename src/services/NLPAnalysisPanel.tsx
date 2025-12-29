import React, { useEffect, useState } from 'react';
import { getNLPContext } from '../../services/apiService';
import { NLPResponse } from '../../types';

interface NLPAnalysisPanelProps {
  itemId: string;
  content?: string;
  className?: string;
  refreshKey?: number;
}

export const NLPAnalysisPanel: React.FC<NLPAnalysisPanelProps> = ({ itemId, content, className = '', refreshKey = 0 }) => {
  const [data, setData] = useState<NLPResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!itemId) return;
      
      try {
        setLoading(true);
        setError(null);
        const result = await getNLPContext(itemId, content);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load NLP analysis');
          console.error(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [itemId, content, refreshKey]);

  if (loading) {
    return (
      <div className={`p-6 rounded-lg bg-white shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px] ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <span className="text-sm text-gray-500">Analyzing content context...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center gap-2 ${className}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const getSentimentColor = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'positive': return 'text-green-700 bg-green-50 border-green-200';
      case 'negative': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getSentimentBarColor = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          Real-time NLP Context
        </h3>
        <div className="flex items-center gap-2">
          {loading && <span className="animate-pulse text-xs text-indigo-500 font-medium">Updating...</span>}
          {!loading && data && data.sentiment.confidence < 0.6 && (
             <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-100 font-medium">Awaiting RL</span>
          )}
          <span className="text-xs text-gray-500 font-mono">ID: {itemId.slice(0, 8)}</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Sentiment Section */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sentiment Analysis</h4>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full border text-sm font-bold capitalize ${getSentimentColor(data.sentiment.label)}`}>
              {data.sentiment.label}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Confidence Score</span>
                <span className="font-medium text-gray-900">{Math.round(data.sentiment.confidence * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${getSentimentBarColor(data.sentiment.label)}`}
                  style={{ width: `${data.sentiment.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Topics Section */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            Detected Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.topics.map((topic, idx) => (
              <div key={idx} className="group relative flex items-center bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-md px-2.5 py-1.5 transition-colors cursor-default">
                <span className="text-sm text-gray-700 font-medium">{topic.name}</span>
                <span className="ml-2 text-xs text-gray-400 border-l border-gray-300 pl-2 group-hover:text-indigo-500 font-mono">
                  {Math.round(topic.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Context/Summary Section */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Context Summary
          </h4>
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600 leading-relaxed border border-gray-100">
            {data.context}
          </div>
        </div>

        {/* Entities Section */}
        {data.entities && data.entities.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
              {data.entities.slice(0, 8).map((entity, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span className="font-medium text-gray-700">{entity.text}</span>
                  <span className="text-gray-400 text-[10px] uppercase">{entity.type}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};