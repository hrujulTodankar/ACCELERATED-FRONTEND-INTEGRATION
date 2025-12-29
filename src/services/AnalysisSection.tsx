import React, { useState, useEffect } from 'react';
import { NLPAnalysisPanel } from './NLPAnalysisPanel';
import { AdaptiveTagsPanel } from './AdaptiveTagsPanel';

interface AnalysisSectionProps {
  itemId: string;
  content?: string;
  className?: string;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ itemId, content, className = '' }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Intelligence Insights</h3>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${isAutoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title={isAutoRefresh ? "Pause Live Updates" : "Enable Live Updates"}
          >
            {isAutoRefresh && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
            {isAutoRefresh ? 'Live On' : 'Live Off'}
          </button>
          <button type="button" onClick={handleRefresh} className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100" title="Refresh Analysis">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <NLPAnalysisPanel itemId={itemId} content={content} className="h-full" refreshKey={refreshKey} />
        <AdaptiveTagsPanel itemId={itemId} content={content} className="h-full" refreshKey={refreshKey} />
      </div>
    </div>
  );
};