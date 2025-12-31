import React, { useEffect, useState } from 'react';
import { getTags } from './apiService';
import { TagResponse } from '../types';

interface AdaptiveTagsPanelProps {
  itemId: string;
  content?: string;
  className?: string;
  refreshKey?: number;
}

export const AdaptiveTagsPanel: React.FC<AdaptiveTagsPanelProps> = ({ itemId, content, className = '', refreshKey = 0 }) => {
  const [data, setData] = useState<TagResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!itemId) return;

      try {
        setLoading(true);
        setError(null);
        const result = await getTags(itemId, content);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load adaptive tags');
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
        <span className="text-sm text-gray-500">Generating adaptive tags...</span>
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

  const getConfidenceColor = (score: number) => {
    if (score >= 0.85) return 'bg-green-500';
    if (score >= 0.7) return 'bg-indigo-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          Adaptive Tags
        </h3>
        <div className="flex items-center gap-2">
           {loading && <span className="animate-pulse text-xs text-indigo-500 font-medium">Syncing...</span>}
           <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-medium">
             {data.model || 'v1.0'}
           </span>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {data.tags.map((tag, idx) => (
            <div key={idx} className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 capitalize">{tag.label}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">{tag.category || 'General'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-32">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(tag.confidence)}`}
                    style={{ width: `${tag.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-500 w-8 text-right">
                  {Math.round(tag.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}

          {data.tags.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No tags generated for this content.
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
           <span>Total Tags: {data.tags.length}</span>
           <span>Global Confidence: {Math.round(data.confidence * 100)}%</span>
        </div>
      </div>
    </div>
  );
};