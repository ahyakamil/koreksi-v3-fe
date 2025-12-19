import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { apiFetch } from '../utils/api'

type User = {
  id: string
  name: string
  email: string
}

type Notification = {
  id: string
  read_at: string | null
  // other fields if needed
}

type AuthContextType = {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  refresh: () => Promise<boolean>
  pendingRequestsCount: number
  refreshPendingCount: () => Promise<void>
  notificationsCount: number
  refreshNotificationsCount: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }){
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [notificationsCount, setNotificationsCount] = useState(0)

  useEffect(()=>{
    async function init(){
      const token = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null
      if (!token) { setLoading(false); return }
      const res = await apiFetch('/auth/me')
      if (res.body && res.body.user) {
        setUser(res.body.user)
        // Fetch counts after user is set
        try {
          const countRes = await apiFetch('/friends/requests/count')
          if (countRes.body && countRes.body.statusCode === 2000) {
            setPendingRequestsCount(countRes.body.data.count || 0)
          }
        } catch (error) {
          console.error('Failed to fetch pending requests count:', error)
        }
        try {
          const notifRes = await apiFetch('/notifications')
          if (notifRes.body && notifRes.body.statusCode === 2000) {
            const unreadCount = notifRes.body.data.notifications?.filter((n: any) => !n.read_at).length || 0
            setNotificationsCount(unreadCount)
          }
        } catch (error) {
          console.error('Failed to fetch notifications count:', error)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const refresh = async () => {
    const refreshToken = (typeof window !== 'undefined') ? localStorage.getItem('refreshToken') : null
    if (!refreshToken) return false
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000/api/v1') + '/auth/refresh', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken })
    })
    const j = await res.json()
    if (j && j.accessToken) {
      localStorage.setItem('accessToken', j.accessToken)
      return true
    }
    return false
  }

  const refreshPendingCount = useCallback(async () => {
    if (user) {
      try {
        const res = await apiFetch('/friends/requests/count')
        if (res.body && res.body.statusCode === 2000) {
          setPendingRequestsCount(res.body.data.count || 0)
        }
      } catch (error) {
        console.error('Failed to fetch pending requests count:', error)
      }
    } else {
      setPendingRequestsCount(0)
    }
  }, [user])

  const refreshNotificationsCount = useCallback(async () => {
    if (user) {
      try {
        const res = await apiFetch('/notifications')
        if (res.body && res.body.statusCode === 2000) {
          const unreadCount = res.body.data.notifications?.filter((n: any) => !n.read_at).length || 0
          setNotificationsCount(unreadCount)
        }
      } catch (error) {
        console.error('Failed to fetch notifications count:', error)
      }
    } else {
      setNotificationsCount(0)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        refreshPendingCount()
        refreshNotificationsCount()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [user, refreshPendingCount, refreshNotificationsCount])

  const value = { user, setUser, loading, refresh, pendingRequestsCount, refreshPendingCount, notificationsCount, refreshNotificationsCount }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
