import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  useEffect(()=>{
    async function init(){
      const token = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null
      if (!token) { setLoading(false); return }
      const res = await apiFetch('/auth/me')
      if (res.body && res.body.user) {
        setUser(res.body.user)
        // Fetch pending count after user is set
        try {
          const countRes = await apiFetch('/friends/requests/count')
          if (countRes.body && countRes.body.statusCode === 2000) {
            setPendingRequestsCount(countRes.body.data.count || 0)
          }
        } catch (error) {
          console.error('Failed to fetch pending requests count:', error)
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

  const value = { user, setUser, loading, refresh, pendingRequestsCount, refreshPendingCount }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}
