import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { logout as apiLogout } from '../utils/api'

export default function Header(){
  const { user, setUser, pendingRequestsCount, refreshPendingCount, notificationsCount } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()

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
      <div className="container flex items-center py-3">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.location.href = '/'} className="flex items-center space-x-2">
            <img src="/icon-512x512.png" alt="Koreksi" className="w-8 h-8 rounded" />
          </button>

          {/* home and news links visible on mobile */}
          <Link href="/" className={`sm:hidden text-sm ${router.pathname === '/' ? 'text-blue-400' : 'text-gray-200 hover:text-white'}`} aria-label="Home">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link href="/news" className={`sm:hidden text-sm ${router.pathname === '/news' ? 'text-blue-400' : 'text-gray-200 hover:text-white'}`} aria-label={t('news')}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m4 8H9" />
            </svg>
          </Link>
        </div>

        {/* centered desktop links */}
        <div className="flex-1 flex justify-center mx-8">
          <div className="hidden sm:flex items-center space-x-8">
            <Link href="/" className={`text-sm ${router.pathname === '/' ? 'text-blue-400' : 'text-gray-200 hover:text-white'}`} aria-label="Home">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <Link href="/news" className={`text-sm ${router.pathname === '/news' ? 'text-blue-400' : 'text-gray-200 hover:text-white'}`} aria-label={t('news')}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m4 8H9" />
              </svg>
            </Link>
            {isLogged && (
              <>
                <Link href="/organizations" className={`text-sm ${router.pathname === '/organizations' ? 'text-blue-400' : 'text-gray-200 hover:text-white'}`} aria-label={t('organizations')}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </Link>
                <Link href="/friends" className={`relative text-sm ${router.pathname === '/friends' ? 'text-blue-400' : 'text-gray-200 hover:text-white'}`} aria-label={t('friends')}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <Link href="/notifications" className={`relative text-sm ${router.pathname === '/notifications' ? 'text-blue-400' : 'text-gray-200 hover:text-white'}`} aria-label={t('notifications')}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
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
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
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
                  <Link href="/organizations" onClick={()=>setMenuOpen(false)} className={`flex items-center space-x-1 px-3 py-2 text-sm ${router.pathname === '/organizations' ? 'text-blue-400' : 'text-gray-200 hover:bg-gray-700'} rounded`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {t('organizations')}
                  </Link>
                  <Link href="/friends" onClick={()=>setMenuOpen(false)} className={`relative flex items-center space-x-1 px-3 py-2 text-sm ${router.pathname === '/friends' ? 'text-blue-400' : 'text-gray-200 hover:bg-gray-700'} rounded`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {t('friends')}
                    {pendingRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </Link>
                  <Link href="/notifications" onClick={()=>setMenuOpen(false)} className={`relative flex items-center space-x-1 px-3 py-2 text-sm ${router.pathname === '/notifications' ? 'text-blue-400' : 'text-gray-200 hover:bg-gray-700'} rounded`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    {t('notifications')}
                    {notificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
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

