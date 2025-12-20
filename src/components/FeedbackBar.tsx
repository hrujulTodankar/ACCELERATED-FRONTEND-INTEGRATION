import React, { useState } from 'react';
import { FeedbackBarProps } from '../types';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, AlertCircle } from 'lucide-react';

const FeedbackBar: React.FC<FeedbackBarProps> = ({
  onFeedback,
  currentFeedback,
  loading = false,
  itemId,
}) => {
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThumbsUp = () => {
    const newThumbsUp = !thumbsUp;
    setThumbsUp(newThumbsUp);
    setThumbsDown(false);
    
    // If we're turning it on, show comment box
    if (newThumbsUp && !thumbsUp) {
      setShowCommentBox(true);
    }
    // If we're turning it off, hide comment box
    if (!newThumbsUp && thumbsUp) {
      setShowCommentBox(false);
      setComment('');
    }
  };

  const handleThumbsDown = () => {
    const newThumbsDown = !thumbsDown;
    setThumbsDown(newThumbsDown);
    setThumbsUp(false);
    
    // If we're turning it on, show comment box
    if (newThumbsDown && !thumbsDown) {
      setShowCommentBox(true);
    }
    // If we're turning it off, hide comment box
    if (!newThumbsDown && thumbsDown) {
      setShowCommentBox(false);
      setComment('');
    }
  };

  const submitFeedback = async (isPositive: boolean) => {
    try {
      setError(null); // Clear previous errors
      await onFeedback({
        thumbsUp: isPositive,
        comment: comment.trim() || undefined,
        userId: 'current-user', // This would come from auth context
        itemId: itemId,
      });
      
      // Reset form on success
      setThumbsUp(false);
      setThumbsDown(false);
      setComment('');
      setShowCommentBox(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.');
      // Don't reset on error so user can retry
    }
  };

  const handleCommentSubmit = () => {
    if (thumbsUp || thumbsDown) {
      submitFeedback(thumbsUp);
    }
  };

  return (
    <div className="space-y-3">
      {/* Feedback buttons */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Feedback:</span>
        
        <button
          onClick={handleThumbsUp}
          disabled={loading}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 ${
            thumbsUp
              ? 'text-green-700 bg-green-100 border-green-300 hover:bg-green-200'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          Approve
        </button>

        <button
          onClick={handleThumbsDown}
          disabled={loading}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 ${
            thumbsDown
              ? 'text-red-700 bg-red-100 border-red-300 hover:bg-red-200'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <ThumbsDown className="h-4 w-4 mr-2" />
          Reject
        </button>

        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Comment
        </button>
      </div>

      {/* Comment box */}
      {showCommentBox && (
        <div className="mt-3">
          <div className="flex space-x-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your feedback comment (optional)..."
              className="flex-1 min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <button
              onClick={handleCommentSubmit}
              disabled={loading || (!thumbsUp && !thumbsDown)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Submit feedback"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {comment.length}/500 characters
            </p>
            {(thumbsUp || thumbsDown) && !loading && (
              <button
                onClick={() => submitFeedback(thumbsUp)}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                Submit without comment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Current feedback status */}
      {currentFeedback && (
        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
          <div className="flex items-center justify-between">
            <span>
              Feedback submitted: {currentFeedback.thumbsUp ? '👍 Approved' : '👎 Rejected'}
            </span>
            <span>
              {new Date(currentFeedback.timestamp).toLocaleString()}
            </span>
          </div>
          {currentFeedback.comment && (
            <div className="mt-1 text-gray-700">
              "{currentFeedback.comment}"
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full mr-2"></div>
          Submitting feedback...
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackBar;