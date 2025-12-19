import Link from 'next/link'
import Router from 'next/router'
import { useAuth } from '../context/AuthContext'

export default function Header(){
  const { user, setUser } = useAuth()

  const logout = async () => {
    const refreshToken = (typeof window !== 'undefined') ? localStorage.getItem('refreshToken') : null
    try {
      if (refreshToken) {
        await fetch((process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000/api/v1') + '/auth/logout', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken })
        })
      }
    } catch(e) {
      // ignore
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
    if (setUser) setUser(null)
    Router.push('/login')
  }

  const isLogged = !!user

  return (
    <header className="bg-gray-800 text-gray-100 shadow">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/icon-512x512.png" alt="Koreksi" className="w-8 h-8 rounded" />
          </Link>
          {isLogged && (
            <>
              <Link href="/posts/create" className="text-sm text-gray-200 hover:text-white">Create Post</Link>
              <Link href="/friends" className="text-sm text-gray-200 hover:text-white">Friends</Link>
              <Link href="/notifications" className="text-sm text-gray-200 hover:text-white">Notifications</Link>
            </>
          )}
        </div>
        <div>
          {isLogged ? (
            <button onClick={logout} className="px-3 py-1 bg-red-600 text-white rounded">Logout</button>
          ) : (
            <div className="space-x-3">
              <Link href="/login" className="text-sm text-blue-300 hover:text-white">Login</Link>
              <Link href="/register" className="text-sm text-green-300 hover:text-white">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
