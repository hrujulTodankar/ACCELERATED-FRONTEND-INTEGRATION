import { create } from 'zustand'

export type Notification = {
  id: string
  title?: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning'
  timeout?: number
}

type NotificationState = {
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  addNotification: (n) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    const notification: Notification = { id, ...n }
    set({ notifications: [...get().notifications, notification] })

    if (notification.timeout && notification.timeout > 0) {
      setTimeout(() => get().removeNotification(id), notification.timeout)
    } else {
      setTimeout(() => get().removeNotification(id), 5000)
    }

    return id
  },
  removeNotification: (id) => {
    set({ notifications: get().notifications.filter(n => n.id !== id) })
  }
}))
