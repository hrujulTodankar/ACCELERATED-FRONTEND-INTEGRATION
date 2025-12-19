import React from 'react';
import { AnalyticsResponse } from '../types';
import { TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

interface AnalyticsPanelProps {
  analytics: AnalyticsResponse;
  loading?: boolean;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50/30 p-3 rounded-lg">
          <div className="flex items-center">
            <Target className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-blue-700">CTR</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatPercentage(analytics.ctr)}</p>
        </div>
        
        <div className="bg-green-50/30 p-3 rounded-lg">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-700">Interactions</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatNumber(analytics.totalInteractions)}</p>
        </div>
      </div>

      {/* Confidence Trend */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Confidence Trend</h4>
        <div className="space-y-2">
          {analytics.scoreTrend.map((trend, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(trend.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${trend.score * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {formatPercentage(trend.score)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-semibold text-green-600">{analytics.approvedCount}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-red-600">{analytics.rejectedCount}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-600">{analytics.flaggedCount}</p>
            <p className="text-xs text-gray-500">Flagged</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;