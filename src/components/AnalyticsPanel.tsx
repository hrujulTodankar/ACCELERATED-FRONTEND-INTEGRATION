import React from 'react';
import { TrendingUp, TrendingDown, Eye, MessageSquare, Flag, Clock } from 'lucide-react';

interface Analytics {
  views: number;
  engagement: number;
  reports: number;
  resolutionTime: number;
  sentiment?: {
    positive: number;
    negative: number;
    neutral: number;
  };
  category?: string[];
  riskScore?: number;
}

interface AnalyticsPanelProps {
  analytics: Analytics;
  loading?: boolean;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Analytics</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">Analytics</h3>
      <div className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Views</p>
              <p className="text-lg font-semibold">{formatNumber(analytics.views)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Engagement</p>
              <p className="text-lg font-semibold">{formatNumber(analytics.engagement)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Flag className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Reports</p>
              <p className="text-lg font-semibold">{formatNumber(analytics.reports)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Resolution Time</p>
              <p className="text-lg font-semibold">{analytics.resolutionTime}h</p>
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        {analytics.sentiment && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Sentiment Analysis</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Positive</span>
                <span className="text-sm font-medium">{analytics.sentiment.positive}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${analytics.sentiment.positive}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Negative</span>
                <span className="text-sm font-medium">{analytics.sentiment.negative}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${analytics.sentiment.negative}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Neutral</span>
                <span className="text-sm font-medium">{analytics.sentiment.neutral}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full" 
                  style={{ width: `${analytics.sentiment.neutral}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        {analytics.category && analytics.category.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {analytics.category.map((cat, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risk Score */}
        {analytics.riskScore !== undefined && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Risk Score</h4>
              <span className="text-sm font-medium">{analytics.riskScore}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  analytics.riskScore >= 7 ? 'bg-red-500' : 
                  analytics.riskScore >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(analytics.riskScore / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;