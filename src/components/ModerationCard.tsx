import { useState } from 'react'
import { ModerationCardProps } from '../types'
import { useModerationStore } from '../store/moderationStore'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import ConfidenceProgressBar from './ConfidenceProgressBar'
import FeedbackBar from './FeedbackBar'
import StatusBadge from './StatusBadge'

const ModerationCard = ({
  content,
  onFeedback,
  loading = false,
  onClick
}: ModerationCardProps & { onClick?: () => void }) => {
  const { loading: storeLoading } = useModerationStore()
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  const isRecentlyUpdated =
    content.lastUpdated
      ? Date.now() - new Date(content.lastUpdated).getTime() < 3000
      : false

  const getDecisionIcon = () => {
    switch (content.decision) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-rose-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <Clock className="h-5 w-5 text-zinc-400" />
    }
  }

  const getDecisionBadge = () => {
    switch (content.decision) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700'
      case 'rejected':
        return 'bg-rose-100 text-rose-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-zinc-100 text-zinc-700'
    }
  }

  const showFeedbackButtons =
    content.decision === 'pending' && (isHovered || isTouched)

  if (loading) {
    return <div className="p-6 animate-pulse bg-white rounded-lg" />
  }

  return (
    <div
      className={`p-6 rounded-lg transition ${
        isHovered ? 'bg-slate-50 shadow-md' : 'hover:bg-slate-50'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsTouched(false)
      }}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setTimeout(() => setIsTouched(false), 3000)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getDecisionIcon()}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDecisionBadge()}`}
          >
            {content.decision.toUpperCase()}
          </span>

          {content.flagged && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
              <AlertTriangle className="h-3 w-3" />
              Flagged
            </span>
          )}

          {content.statusBadge && (
            <StatusBadge
              status={content.statusBadge.type}
              lastUpdated={content.statusBadge.timestamp}
            />
          )}
        </div>

        <span className="text-xs text-zinc-400">
          {new Date(content.timestamp).toLocaleString()}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-zinc-900 mb-4 leading-relaxed">
        {content.content.length > 150
          ? content.content.slice(0, 150) + '...'
          : content.content}
      </p>

      {/* Confidence */}
      <ConfidenceProgressBar
        confidence={content.confidence}
        decision={content.decision}
        updating={isRecentlyUpdated}
      />

      {/* Metadata */}
      <div className="mt-3 text-xs text-zinc-500 flex justify-between">
        <span>
          {content.type} · {content.metadata.length} chars
        </span>
        <span>ID: {content.id.slice(0, 8)}...</span>
      </div>

      {/* Tags */}
      {content.tags?.tags?.length > 0 && (
        <div className="mt-3 flex gap-1">
          {content.tags.tags.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs"
            >
              #{tag.label}
            </span>
          ))}
          {content.tags.tags.length > 2 && (
            <span className="text-zinc-400 text-xs">
              +{content.tags.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Feedback */}
      {showFeedbackButtons && (
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <FeedbackBar
            onFeedback={onFeedback}
            loading={storeLoading.feedback}
          />
        </div>
      )}
    </div>
  )
}

export default ModerationCard
