'use client'

import { Search, Home, Users, Video, Bell, Menu, MessageCircle } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export function Header() {
  const { locale, changeLocale } = useLocale();
  const { user } = useAuth();
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
            <button
              onClick={() => changeLocale('id')}
              className={`px-2 py-1 text-sm rounded ${locale === 'id' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              ID
            </button>
            <button
              onClick={() => changeLocale('en')}
              className={`px-2 py-1 text-sm rounded ${locale === 'en' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              EN
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <Menu className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
            </button>
            <Avatar
              name={user?.name || 'User'}
              size={40}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
