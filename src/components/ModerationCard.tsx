import React, { useState } from 'react';
import { ModerationCardProps } from '../types';
import { ThumbsUp, ThumbsDown, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import ConfidenceProgressBar from './ConfidenceProgressBar';
import FeedbackBar from './FeedbackBar';

const ModerationCard: React.FC<ModerationCardProps & { onClick?: () => void }> = ({
  content,
  onFeedback,
  loading = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const getDecisionIcon = () => {
    switch (content.decision) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDecisionColor = () => {
    switch (content.decision) {
      case 'approved':
        return 'text-green-700 bg-green-100';
      case 'rejected':
        return 'text-red-700 bg-red-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateContent = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsTouched(false);
  };

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    // Delay hiding to allow for button interactions
    setTimeout(() => setIsTouched(false), 3000);
  };

  const showFeedbackButtons = content.decision === 'pending' && (isHovered || isTouched);

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 transition-all duration-200 ${
        isHovered ? 'bg-gray-50 shadow-md' : 'hover:bg-gray-50'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getDecisionIcon()}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDecisionColor()}`}>
                {content.decision.charAt(0).toUpperCase() + content.decision.slice(1)}
              </span>
              {content.flagged && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-700 bg-orange-100">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Flagged
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {formatTimestamp(content.timestamp)}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-sm text-gray-900 leading-relaxed">
              {truncateContent(content.content)}
            </p>
          </div>

          {/* Confidence Progress */}
          <div className="mb-4">
            <ConfidenceProgressBar
              confidence={content.confidence}
              decision={content.decision}
              updating={false}
            />
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Type: {content.type}</span>
              <span>Length: {content.metadata.length} chars</span>
              {content.metadata.language && (
                <span>Lang: {content.metadata.language}</span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              ID: {content.id.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Bar - show on hover/touch for pending items */}
      {showFeedbackButtons && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
          <FeedbackBar
            onFeedback={onFeedback}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ModerationCard;