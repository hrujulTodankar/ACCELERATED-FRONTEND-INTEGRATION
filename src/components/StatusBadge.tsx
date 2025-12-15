import React from 'react';
import { StatusBadgeProps } from '../types';
import { CheckCircle, Clock, Award } from 'lucide-react';

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, lastUpdated }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'updated':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600',
          label: 'Updated',
          description: 'Updated after feedback',
        };
      case 'awaiting':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-600',
          label: 'Awaiting',
          description: 'Awaiting reward',
        };
      case 'pending':
        return {
          icon: Award,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600',
          label: 'Pending',
          description: 'Pending review',
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600',
          label: 'Unknown',
          description: 'Status unknown',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
      <IconComponent className={`h-3 w-3 mr-1 ${config.iconColor}`} />
      <span>{config.label}</span>
      {lastUpdated && (
        <span className="ml-1 text-xs opacity-75">
          • {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;