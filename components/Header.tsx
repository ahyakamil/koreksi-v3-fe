'use client'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Home, Users, Newspaper, Bell, Building2, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export function Header() {
  const { locale, changeLocale } = useLocale();
  const { user, setUser, notificationsCount } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('home');

  const logout = () => {
    document.cookie = 's_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    if (pathname === '/') {
      setActiveTab('home');
    } else if (pathname === '/friends') {
      setActiveTab('friends');
    } else if (pathname === '/news') {
      setActiveTab('news');
    } else if (pathname === '/organizations') {
      setActiveTab('organizations');
    } else {
      setActiveTab('');
    }
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <img src="/icon-512x512.png" alt="Koreksi Logo" className="w-10 h-10 rounded-full object-cover" />
            </div>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className={`px-8 py-2 rounded-lg hover:bg-gray-100 ${
                activeTab === 'home'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-6 h-6" />
            </button>
            <button
              onClick={() => router.push('/news')}
              className={`px-8 py-2 rounded-lg hover:bg-gray-100 ${
                activeTab === 'news'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Newspaper className="w-6 h-6" />
            </button>
            <button
              onClick={() => router.push('/organizations')}
              className={`px-8 py-2 rounded-lg hover:bg-gray-100 ${
                activeTab === 'organizations'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-6 h-6" />
            </button>
            <button
              onClick={() => router.push('/friends')}
              className={`px-8 py-2 rounded-lg hover:bg-gray-100 ${
                activeTab === 'friends'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-6 h-6" />
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100"
              >
                <span className="font-medium">{locale.toUpperCase()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLanguageDropdownOpen && (
                <div className="absolute right-0 mt-1 w-20 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      changeLocale('id');
                      setIsLanguageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${locale === 'id' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  >
                    ID
                  </button>
                  <button
                    onClick={() => {
                      changeLocale('en');
                      setIsLanguageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${locale === 'en' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  >
                    EN
                  </button>
                </div>
              )}
            </div>
            {user ? (
              <>
                <button
                  onClick={() => router.push('/notifications')}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center relative"
                >
                  <Bell className="w-6 h-6" />
                  {notificationsCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                      {notificationsCount > 99 ? '99+' : notificationsCount}
                    </span>
                  )}
                </button>
                <div className="relative" ref={avatarDropdownRef}>
                  <button
                    onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                    className="rounded-full hover:bg-gray-100 p-1"
                  >
                    <Avatar
                      name={user.name}
                      size={40}
                    />
                  </button>
                  {isAvatarDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 break-all">{user.name}</p>
                        <p className="text-sm text-gray-500 break-all">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Profile
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Settings
                        </button>
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-blue-600 hover:bg-gray-100 rounded-lg">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => router.push('/')}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button
          onClick={() => router.push('/news')}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === 'news' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Newspaper className="w-6 h-6" />
          <span className="text-xs mt-1">News</span>
        </button>
        <button
          onClick={() => router.push('/organizations')}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === 'organizations' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Building2 className="w-6 h-6" />
          <span className="text-xs mt-1">Organization</span>
        </button>
        <button
          onClick={() => router.push('/friends')}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === 'friends' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs mt-1">Friends</span>
        </button>
      </div>
    </nav>
    </>
  );
}

