import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function init(){
      const token = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null
      if (!token) { setLoading(false); return }
      const res = await apiFetch('/auth/me')
      if (res.body && res.body.user) setUser(res.body.user)
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

  const value = { user, setUser, loading, refresh }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}
