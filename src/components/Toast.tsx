import React from 'react'
import { X } from 'lucide-react'
import { useNotificationStore } from '../store/notificationStore'

const ToastItem: React.FC<{ id: string; title?: string; message: string; type?: string }> = ({ id, title, message, type }) => {
  const remove = useNotificationStore(state => state.removeNotification)
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-slate-700'

  return (
    <div className={`max-w-sm w-full ${bg} text-white shadow-lg rounded-md pointer-events-auto ring-1 ring-black/5 overflow-hidden`}> 
      <div className="p-3 flex items-start">
        <div className="flex-1">
          {title && <div className="font-semibold">{title}</div>}
          <div className="text-sm mt-1">{message}</div>
        </div>
        <button onClick={() => remove(id)} className="ml-3 text-white opacity-90 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const ToastContainer: React.FC = () => {
  const notifications = useNotificationStore(state => state.notifications)

  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-3">
      {notifications.map(n => (
        <ToastItem key={n.id} id={n.id} title={n.title} message={n.message} type={n.type} />
      ))}
    </div>
  )
}

export default ToastContainer
