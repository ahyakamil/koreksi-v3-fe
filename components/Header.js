import Link from 'next/link'
import Router from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

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
  const { t, locale, changeLocale } = useLocale()

  return (
    <header className="bg-gray-800 text-gray-100 shadow">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/icon-512x512.png" alt="Koreksi" className="w-8 h-8 rounded" />
          </Link>
          {isLogged && (
            <>
              <Link href="/friends" className="text-sm text-gray-200 hover:text-white">{t('friends')}</Link>
              <Link href="/notifications" className="text-sm text-gray-200 hover:text-white">{t('notifications')}</Link>
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={locale}
            onChange={(e) => changeLocale(e.target.value)}
            className="bg-gray-700 text-gray-100 border-transparent rounded px-2 py-1 text-sm"
            aria-label="Language"
          >
            <option value="id">ID</option>
            <option value="en">EN</option>
          </select>

          {isLogged ? (
            <button onClick={logout} className="px-3 py-1 bg-red-600 text-white rounded">{t('logout')}</button>
          ) : (
            <div className="space-x-3">
              <Link href="/login" className="text-sm text-blue-300 hover:text-white">{t('login')}</Link>
              <Link href="/register" className="text-sm text-green-300 hover:text-white">{t('register')}</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
