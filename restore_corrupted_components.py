#!/usr/bin/env python3
"""
Restore corrupted components: AnalyticsPanel, NLPContextPanel, TagsPanel
"""

def restore_analytics_panel():
    """Restore AnalyticsPanel.tsx"""
    content = '''import React from 'react';
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

export default AnalyticsPanel;'''
    
    with open('src/components/AnalyticsPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Restored AnalyticsPanel.tsx")

def restore_nlp_context_panel():
    """Restore NLPContextPanel.tsx"""
    content = '''import React from 'react';
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

export default NLPContextPanel;'''
    
    with open('src/components/NLPContextPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Restored NLPContextPanel.tsx")

def restore_tags_panel():
    """Restore TagsPanel.tsx"""
    content = '''import React from 'react';
import { Tag, Plus, X } from 'lucide-react';

interface TagItem {
  name: string;
  category: string;
  confidence: number;
}

interface TagsData {
  autoGenerated: TagItem[];
  userDefined: TagItem[];
}

interface TagsPanelProps {
  tagsData: TagsData;
  loading?: boolean;
}

const TagsPanel: React.FC<TagsPanelProps> = ({ tagsData, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Tags</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'topic':
        return 'bg-blue-100 text-blue-800';
      case 'sentiment':
        return 'bg-green-100 text-green-800';
      case 'language':
        return 'bg-purple-100 text-purple-800';
      case 'content-type':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTags = (tags: TagItem[], title: string) => {
    if (!tags || tags.length === 0) return null;

    return (
      <div>
        <h4 className="text-sm font-medium mb-3">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div 
              key={index}
              className="flex items-center space-x-1 group"
            >
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getCategoryColor(tag.category)}`}>
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
              </span>
              <span className="text-xs text-gray-500">
                {tag.confidence.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Tags</h3>
        <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 hover:bg-gray-50">
          <Plus className="h-3 w-3 mr-1" />
          Add Tag
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Auto-generated Tags */}
        {renderTags(tagsData.autoGenerated, "Auto-generated Tags")}
        
        {/* User-defined Tags */}
        {renderTags(tagsData.userDefined, "User-defined Tags")}
        
        {/* Empty State */}
        {(!tagsData.autoGenerated || tagsData.autoGenerated.length === 0) && 
         (!tagsData.userDefined || tagsData.userDefined.length === 0) && (
          <div className="text-center py-6">
            <Tag className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tags available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tags will appear here when content is analyzed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsPanel;'''
    
    with open('src/components/TagsPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Restored TagsPanel.tsx")

def add_dark_veil_comment():
    """Add missing dark veil background comment to CSS"""
    try:
        with open('src/index.css', 'r') as f:
            content = f.read()
        
        # Add the missing comment
        content = content.replace(
            '/* Dark veil background for the entire application */',
            '/* Dark veil background for the entire application */\n/* This creates a beautiful dark gradient background with subtle overlay patterns */'
        )
        
        with open('src/index.css', 'w') as f:
            f.write(content)
        print("Added dark veil background comment to CSS")
    except Exception as e:
        print(f"Error updating CSS: {e}")

def main():
    print("Restoring corrupted components...")
    print("=" * 50)
    
    restore_analytics_panel()
    restore_nlp_context_panel()
    restore_tags_panel()
    add_dark_veil_comment()
    
    print("=" * 50)
    print("All components restored successfully!")

if __name__ == "__main__":
    main()