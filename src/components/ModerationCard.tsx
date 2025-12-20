import React from 'react';
import { AlertTriangle, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ConfidenceProgressBar from './ConfidenceProgressBar';
import FeedbackBar from './FeedbackBar';

interface ContentItem {
  id: string;
  type: string;
  content: string;
  decision: 'approved' | 'rejected' | 'pending';
  confidence: number;
  flagged: boolean;
  timestamp: string;
  rewardStatus?: string;
  statusBadge?: { type: string; timestamp: string; };
}

interface ModerationCardProps {
  content: ContentItem;
  onFeedback: (contentId: string, feedback: any) => void;
  loading?: boolean;
  onClick?: () => void;
}

const ModerationCard: React.FC<ModerationCardProps> = ({ content, onFeedback, loading = false, onClick }) => {
  const getDecisionBadge = () => {
    switch (content.decision) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDecisionIcon = () => {
    switch (content.decision) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-6 mb-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getDecisionIcon()}
            <span className="text-sm font-medium capitalize">
              {content.type}
            </span>
          </div>
          {content.flagged && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
              <AlertTriangle className="h-3 w-3" />
              Flagged
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <ConfidenceProgressBar confidence={content.confidence} />
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDecisionBadge()}`}>
            {content.decision.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-3">
          {content.content}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>ID: {content.id}</span>
        <span>{new Date(content.timestamp).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="border-t pt-4">
        <FeedbackBar contentId={content.id} onFeedback={onFeedback} loading={loading} />
      </div>

      {/* Status Badge */}
      {content.statusBadge && (
        <div className="mt-4 pt-4 border-t">
          <StatusBadge status={content.statusBadge.type as any} lastUpdated={content.statusBadge.timestamp} />
        </div>
      )}
    </div>
  );
};

export default ModerationCard;