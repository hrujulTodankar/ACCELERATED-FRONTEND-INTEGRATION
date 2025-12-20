import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'approved' | 'rejected' | 'pending' | 'flagged';
  lastUpdated?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, lastUpdated }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200',
          iconClassName: 'h-4 w-4 text-green-500'
        };
      case 'rejected':
        return {
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-200',
          iconClassName: 'h-4 w-4 text-red-500'
        };
      case 'pending':
        return {
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconClassName: 'h-4 w-4 text-yellow-500'
        };
      case 'flagged':
        return {
          icon: AlertTriangle,
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          iconClassName: 'h-4 w-4 text-orange-500'
        };
      default:
        return {
          icon: Clock,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          iconClassName: 'h-4 w-4 text-gray-500'
        };
    }
  };

  const { icon: Icon, className, iconClassName } = getStatusConfig();

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
        <Icon className={iconClassName} />
        <span className="ml-1 capitalize">{status}</span>
      </span>
      {lastUpdated && (
        <span className="ml-1 text-xs opacity-75">
          • {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;