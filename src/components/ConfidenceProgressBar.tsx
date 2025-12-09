import React from 'react';
import { ConfidenceProgressProps } from '../types';

const ConfidenceProgressBar: React.FC<ConfidenceProgressProps> = ({
  confidence,
  decision,
  updating = false,
}) => {
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getProgressWidth = () => {
    return `${confidence * 100}%`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Confidence Score
        </span>
        <div className="flex items-center space-x-2">
          {updating && (
            <div className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          )}
          <span className="text-sm text-gray-600">
            {(confidence * 100).toFixed(1)}%
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            confidence >= 0.8 ? 'bg-green-100 text-green-800' :
            confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getConfidenceLabel()}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              getConfidenceColor()
            } ${updating ? 'animate-pulse' : ''}`}
            style={{ width: getProgressWidth() }}
          ></div>
        </div>
        
        {/* Decision indicator */}
        <div className="absolute top-0 right-0 -mt-1">
          <div className={`w-3 h-3 rounded-full border-2 border-white ${
            decision === 'approved' ? 'bg-green-500' :
            decision === 'rejected' ? 'bg-red-500' :
            'bg-yellow-500'
          }`}></div>
        </div>
      </div>
      
      {/* Confidence thresholds */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Low (0%)</span>
        <span>Medium (60%)</span>
        <span>High (80%)</span>
      </div>
    </div>
  );
};

export default ConfidenceProgressBar;