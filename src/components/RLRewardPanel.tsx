import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Award, Zap } from 'lucide-react';
import { RLReward } from '../types';

interface RLRewardPanelProps {
  rewardHistory: RLReward[];
  currentScore: number;
  isUpdating?: boolean;
  className?: string;
}

export const RLRewardPanel: React.FC<RLRewardPanelProps> = ({
  rewardHistory,
  currentScore,
  isUpdating = false,
  className = ''
}) => {
  const [animateScore, setAnimateScore] = useState(currentScore);
  const [lastReward, setLastReward] = useState<RLReward | null>(null);

  useEffect(() => {
    if (rewardHistory.length > 0) {
      const latest = rewardHistory[rewardHistory.length - 1];
      if (latest.timestamp !== lastReward?.timestamp) {
        setLastReward(latest);
        
        // Animate score change
        setAnimateScore(prev => {
          const diff = latest.reward;
          return Math.max(0, Math.min(1, prev + diff));
        });
      }
    }
  }, [rewardHistory, lastReward]);

  const getTrendIcon = () => {
    if (!lastReward) return <Minus className="w-4 h-4 text-gray-400" />;
    
    if (lastReward.reward > 0.05) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (lastReward.reward < -0.05) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getScoreColor = () => {
    if (animateScore >= 0.8) return 'text-green-600';
    if (animateScore >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = () => {
    if (animateScore >= 0.8) return 'from-green-400 to-green-600';
    if (animateScore >= 0.6) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">RL Reward Score</h3>
        </div>
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="flex items-center space-x-1 text-xs text-blue-600"
            >
              <Zap className="w-3 h-3 animate-pulse" />
              <span>Updating...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        {/* Current Score */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Current Score</span>
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <motion.span
              key={animateScore}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-sm font-bold ${getScoreColor()}`}
            >
              {(animateScore * 100).toFixed(1)}%
            </motion.span>
          </div>
        </div>

        {/* Score Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient()}`}
            initial={{ width: 0 }}
            animate={{ width: `${animateScore * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Recent Rewards */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Recent Rewards</h4>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {rewardHistory.slice(-3).reverse().map((reward, index) => (
              <motion.div
                key={`${reward.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-600">
                  {new Date(reward.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex items-center space-x-1">
                  <span className={reward.reward > 0 ? 'text-green-600' : 'text-red-600'}>
                    {reward.reward > 0 ? '+' : ''}{(reward.reward * 100).toFixed(1)}%
                  </span>
                  {reward.action && (
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 capitalize">
                      {reward.action}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RL Status */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-600">Status</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              animateScore >= 0.7 ? 'bg-green-400' : 
              animateScore >= 0.5 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-xs font-medium">
              {animateScore >= 0.7 ? 'Excellent' : 
               animateScore >= 0.5 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RLRewardPanel;