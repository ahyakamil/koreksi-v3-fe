import Link from 'next/link'
import Router from 'next/router'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { logout as apiLogout } from '../utils/api'

export default function Header(){
  const { user, setUser, pendingRequestsCount, refreshPendingCount, notificationsCount } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      lastScrollY = currentScrollY
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const logout = async () => {
    const refreshToken = (typeof window !== 'undefined') ? localStorage.getItem('refreshToken') : null
    try {
      if (refreshToken) {
        await apiLogout(refreshToken)
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
    <header className={`bg-gray-800 text-gray-100 shadow fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? '' : '-translate-y-full'}`}>
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.location.href = '/'} className="flex items-center space-x-2">
            <img src="/icon-512x512.png" alt="Koreksi" className="w-8 h-8 rounded" />
          </button>

          {/* news link visible on mobile */}
          <Link href="/news" className="sm:hidden text-sm text-gray-200 hover:text-white">
            {t('news')}
          </Link>

          {/* desktop links */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link href="/news" className="text-sm text-gray-200 hover:text-white">
              {t('news')}
            </Link>
            {isLogged && (
              <>
                <Link href="/organizations" className="text-sm text-gray-200 hover:text-white">
                  {t('organizations')}
                </Link>
                <Link href="/friends" className="relative text-sm text-gray-200 hover:text-white">
                  {t('friends')}
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <Link href="/notifications" className="relative text-sm text-gray-200 hover:text-white">
                  {t('notifications')}
                  {notificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* language selector always visible */}
          <select
            value={locale}
            onChange={(e) => changeLocale(e.target.value as 'id' | 'en')}
            className="bg-gray-700 text-gray-100 border-transparent rounded px-2 py-1 text-sm"
            aria-label="Language"
          >
            <option value="id">ID</option>
            <option value="en">EN</option>
          </select>

          {/* kebab / menu button visible on small screens only (keeps language selector visible) */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="sm:hidden px-2 py-1 rounded text-gray-100 hover:bg-gray-700"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {isLogged ? (
            <div className="hidden sm:block">
              <button onClick={async ()=>{ await logout(); setMenuOpen(false) }} className="px-3 py-1 bg-red-600 text-white rounded">{t('logout')}</button>
            </div>
          ) : (
            <div className="hidden sm:flex space-x-3">
              <Link href="/login" className="text-sm text-blue-300 hover:text-white">{t('login')}</Link>
              <Link href="/register" className="text-sm text-green-300 hover:text-white">{t('register')}</Link>
            </div>
          )}
        </div>

        {/* mobile menu panel (excludes language selector) */}
        {menuOpen && (
          <div className="sm:hidden absolute right-4 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded shadow z-50">
            <div className="flex flex-col p-2 space-y-1">
              {isLogged ? (
                <>
                  <Link href="/organizations" onClick={()=>setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded">{t('organizations')}</Link>
                  <Link href="/friends" onClick={()=>setMenuOpen(false)} className="relative px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded flex items-center">
                    {t('friends')}
                    {pendingRequestsCount > 0 && (
                      <span className="ml-2 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </Link>
                  <Link href="/notifications" onClick={()=>setMenuOpen(false)} className="relative px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded flex items-center">
                    {t('notifications')}
                    {notificationsCount > 0 && (
                      <span className="ml-2 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </Link>
                  <button onClick={async ()=>{ await logout(); setMenuOpen(false) }} className="px-3 py-2 text-sm text-left text-red-400 hover:bg-gray-700 rounded">{t('logout')}</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={()=>setMenuOpen(false)} className="px-3 py-2 text-sm text-blue-300 hover:bg-gray-700 rounded">{t('login')}</Link>
                  <Link href="/register" onClick={()=>setMenuOpen(false)} className="px-3 py-2 text-sm text-green-300 hover:bg-gray-700 rounded">{t('register')}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
