import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { apiFetch, refreshToken } from '../utils/api'
import { User } from '../types'

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
  friends: any[]
  refreshFriends: () => Promise<void>
  unreadCounts: { total_unread: number; unread_by_friend: { [key: string]: number } }
  refreshUnreadCounts: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Function to play a simple beep sound
function playNotificationSound() {
  if (typeof window !== 'undefined') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // Frequency in Hz
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }
}

export function AuthProvider({ children }: { children: ReactNode }){
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [previousNotificationsCount, setPreviousNotificationsCount] = useState(0)
  const [friends, setFriends] = useState<any[]>([])
  const [unreadCounts, setUnreadCounts] = useState<{ total_unread: number; unread_by_friend: { [key: string]: number } }>({ total_unread: 0, unread_by_friend: {} })
  const initDoneRef = useRef(false)

  useEffect(()=>{
    if (initDoneRef.current) return
    initDoneRef.current = true
    async function init(){
      const token = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null
      if (!token) { setLoading(false); return }
      const res = await apiFetch('/auth/me')
      if (res.body && res.body.user) {
        setUser(res.body.user)
        if (res.body.user.private_key_encrypted) localStorage.setItem('privateKeyEncrypted', res.body.user.private_key_encrypted);
        if (res.body.user.public_key) localStorage.setItem('publicKey', res.body.user.public_key);
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
          const friendsRes = await apiFetch('/friends')
          if (friendsRes.body && friendsRes.body.statusCode === 2000) {
            setFriends(friendsRes.body.data.friends)
          }
        } catch (error) {
          console.error('Failed to fetch friends:', error)
        }
        try {
          const unreadRes = await apiFetch('/chat/unread-count')
          if (unreadRes.body && unreadRes.body.statusCode === 2000) {
            setUnreadCounts(unreadRes.body.data)
          }
        } catch (error) {
          console.error('Failed to fetch unread counts:', error)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const refresh = async () => {
    const refreshTokenValue = (typeof window !== 'undefined') ? localStorage.getItem('refreshToken') : null
    if (!refreshTokenValue) return false
    const res = await refreshToken(refreshTokenValue)
    if (res.ok && res.body && res.body.accessToken) {
      localStorage.setItem('accessToken', res.body.accessToken)
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
          if (unreadCount > previousNotificationsCount) {
            playNotificationSound()
          }
          setPreviousNotificationsCount(unreadCount)
          setNotificationsCount(unreadCount)
        }
      } catch (error) {
        console.error('Failed to fetch notifications count:', error)
      }
    } else {
      setNotificationsCount(0)
      setPreviousNotificationsCount(0)
    }
  }, [user, previousNotificationsCount])

  const refreshFriends = useCallback(async () => {
    if (user) {
      try {
        const res = await apiFetch('/friends')
        if (res.body && res.body.statusCode === 2000) {
          setFriends(res.body.data.friends)
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error)
      }
    } else {
      setFriends([])
    }
  }, [user])

  const refreshUnreadCounts = useCallback(async () => {
    if (user) {
      try {
        const res = await apiFetch('/chat/unread-count')
        if (res.body && res.body.statusCode === 2000) {
          setUnreadCounts(res.body.data)
        }
      } catch (error) {
        console.error('Failed to fetch unread counts:', error)
      }
    } else {
      setUnreadCounts({ total_unread: 0, unread_by_friend: {} })
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const updateOnlineStatus = async () => {
        try {
          await apiFetch('/auth/update-online-status', { method: 'POST' });
        } catch (error) {
          console.error('Error updating online status:', error);
        }
      };

      const refreshAll = async () => {
        await Promise.all([
          refreshPendingCount(),
          refreshNotificationsCount(),
          refreshFriends(),
        ]);
      };

      // Update immediately
      updateOnlineStatus();
      refreshAll();

      // Set up interval to update every 60 seconds
      const interval = setInterval(() => {
        updateOnlineStatus();
        refreshAll();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const value = { user, setUser, loading, refresh, pendingRequestsCount, refreshPendingCount, notificationsCount, refreshNotificationsCount, friends, refreshFriends, unreadCounts, refreshUnreadCounts }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
