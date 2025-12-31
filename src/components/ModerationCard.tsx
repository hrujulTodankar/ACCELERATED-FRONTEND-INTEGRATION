import React from 'react';
import { AlertTriangle, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ConfidenceProgressBar from './ConfidenceProgressBar';
import FeedbackBar from './FeedbackBar';
import RLRewardPanel from './RLRewardPanel';
import { ModerationResponse, FeedbackResponse } from '../types';

interface ModerationCardProps {
  content: ModerationResponse;
  onFeedback: (feedback: any) => Promise<void>;
  loading?: boolean;
  onClick?: () => void;
  showRLPanel?: boolean;
}

const ModerationCard: React.FC<ModerationCardProps> = ({ content, onFeedback, loading = false, onClick, showRLPanel = true }) => {
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
      className={`bg-white rounded-lg shadow p-6 mb-4 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
        content.statusBadge?.type === 'updated' ? 'ring-2 ring-green-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Visual indicator for RL status */}
      {content.statusBadge && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
            content.statusBadge.type === 'awaiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {content.statusBadge.type === 'awaiting' ? 'Awaiting RL decision' : 'Updated after feedback'}
          </span>
          {content.statusBadge.message && (
            <span className="ml-2 text-xs text-gray-500">{content.statusBadge.message}</span>
          )}
        </div>
      )}
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
        <FeedbackBar contentId={content.id} onFeedback={(contentId, feedback) => {
          // Convert the feedback format to match the expected FeedbackResponse format
          let formattedFeedback: Omit<FeedbackResponse, 'id' | 'timestamp'> & { itemId?: string };
          
          if (feedback.type === 'thumbs_up') {
            formattedFeedback = {
              thumbsUp: feedback.value,
              comment: feedback.comment || '',
              userId: 'current_user',
              itemId: contentId
            };
          } else if (feedback.type === 'thumbs_down') {
            // thumbsDown is represented as thumbsUp: false
            formattedFeedback = {
              thumbsUp: false,
              comment: feedback.comment || '',
              userId: 'current_user',
              itemId: contentId
            };
          } else if (feedback.type === 'comment') {
            formattedFeedback = {
              thumbsUp: false, // Default to no thumbs up for comments
              comment: feedback.value,
              userId: 'current_user',
              itemId: contentId
            };
          } else {
            // Default fallback
            formattedFeedback = {
              thumbsUp: false,
              comment: '',
              userId: 'current_user',
              itemId: contentId
            };
          }
          
          return onFeedback(formattedFeedback);
        }} loading={loading} />
      </div>

      {/* RL Reward Panel */}
      {showRLPanel && content.rlMetrics && (
        <div className="mt-4 pt-4 border-t">
          <RLRewardPanel
            rewardHistory={content.rlMetrics.rewardHistory}
            currentScore={content.rlMetrics.confidenceScore}
            isUpdating={loading}
          />
        </div>
      )}

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