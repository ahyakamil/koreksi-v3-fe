'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Home, Users, Video, Bell, MessageCircle, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export function Header() {
  const { locale, changeLocale } = useLocale();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);

  const logout = () => {
    document.cookie = 's_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white">SJ</span>
            </div>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Social Journal"
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-blue-600 border-b-4 border-blue-600">
              <Home className="w-6 h-6" />
            </button>
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Users className="w-6 h-6" />
            </button>
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Video className="w-6 h-6" />
            </button>
            <button className="px-8 py-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <MessageCircle className="w-6 h-6" />
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
                <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center relative">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
                </button>
                <Avatar
                  name={user.name}
                  size={40}
                />
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
  );
}
