import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, X } from 'lucide-react';

interface FeedbackBarProps {
  contentId: string;
  onFeedback: (contentId: string, feedback: any) => void;
  loading?: boolean;
}

const FeedbackBar: React.FC<FeedbackBarProps> = ({ contentId, onFeedback, loading = false }) => {
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');

  const handleThumbsUp = () => {
    const newValue = !thumbsUp;
    setThumbsUp(newValue);
    if (newValue) setThumbsDown(false);
    onFeedback(contentId, { type: 'thumbs_up', value: newValue, comment });
  };

  const handleThumbsDown = () => {
    const newValue = !thumbsDown;
    setThumbsDown(newValue);
    if (newValue) setThumbsUp(false);
    onFeedback(contentId, { type: 'thumbs_down', value: newValue, comment });
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      onFeedback(contentId, { type: 'comment', value: comment });
      setComment('');
      setShowCommentBox(false);
    }
  };

  return (
    <div className="  rounded-lg shadow p-4">
      {/* Feedback buttons */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Feedback:</span>
        
        <button
          onClick={handleThumbsUp}
          disabled={loading}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled: ${
            thumbsUp 
              ? 'text-green-700 bg-green-100 border-green-300 hover:bg-green-200' 
              : 'text-gray-700  hover:bg-gray-50'
          }`}
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          Helpful
        </button>
        
        <button
          onClick={handleThumbsDown}
          disabled={loading}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled: ${
            thumbsDown 
              ? 'text-red-700 bg-red-100 border-red-300 hover:bg-red-200' 
              : 'text-gray-700  hover:bg-gray-50'
          }`}
        >
          <ThumbsDown className="h-4 w-4 mr-2" />
          Not Helpful
        </button>
        
        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700   hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Comment
        </button>
      </div>
      
      {/* Comment box */}
      {showCommentBox && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="flex items-start space-x-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this content moderation decision..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleSubmitComment}
                disabled={!comment.trim() || loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:"
              >
                <Send className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowCommentBox(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackBar;