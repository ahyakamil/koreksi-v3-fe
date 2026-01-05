'use client'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Home, Users, Newspaper, Bell, Building2, ChevronDown, LogOut, FolderOpen } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { searchEntities } from '../utils/api';
import { Post, Organization, Space, News, User } from '../types';

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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    posts: Post[];
    organizations: Organization[];
    spaces: Space[];
    news: News[];
    users: User[];
  }>({
    posts: [],
    organizations: [],
    spaces: [],
    news: [],
    users: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const logout = () => {
    document.cookie = 's_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    router.push('/login');
  };

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults({ posts: [], organizations: [], spaces: [], news: [], users: [] });
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const types: ('user' | 'organization' | 'news' | 'post' | 'space')[] = ['post', 'organization', 'space', 'news', 'user'];
      const results = await Promise.allSettled(
        types.map(type => searchEntities(query, type))
      );

      const newResults = {
        posts: results[0].status === 'fulfilled' ? results[0].value.body?.data?.content || [] : [],
        organizations: results[1].status === 'fulfilled' ? results[1].value.body?.data?.content || [] : [],
        spaces: results[2].status === 'fulfilled' ? results[2].value.body?.data?.content || [] : [],
        news: results[3].status === 'fulfilled' ? results[3].value.body?.data?.content || [] : [],
        users: results[4].status === 'fulfilled' ? results[4].value.body?.data?.content || [] : [],
      };

      setSearchResults(newResults);
      setShowSearchDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ posts: [], organizations: [], spaces: [], news: [], users: [] });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchDropdown(false);
      setSearchQuery('');
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2 && (
      searchResults.posts.length > 0 ||
      searchResults.organizations.length > 0 ||
      searchResults.spaces.length > 0 ||
      searchResults.news.length > 0 ||
      searchResults.users.length > 0 ||
      isSearching
    )) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Don't hide dropdown immediately to allow clicking on results
    setTimeout(() => {
      if (!searchInputRef.current?.matches(':focus')) {
        setShowSearchDropdown(false);
      }
    }, 200);
  };

  const handleResultClick = (callback: () => void) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    callback();
  };

  useEffect(() => {
    if (pathname === '/') {
      setActiveTab('home');
    } else if (pathname === '/friends') {
      setActiveTab('friends');
    } else if (pathname === '/news') {
      setActiveTab('news');
    } else if (pathname === '/spaces') {
      setActiveTab('spaces');
    } else if (pathname === '/organizations') {
      setActiveTab('organizations');
    } else {
      setActiveTab('');
    }
  }, [pathname]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) > 10) { // threshold to avoid jitter
        if (scrollDelta > 0 && currentScrollY > 50) {
          setIsHeaderVisible(false);
        } else if (scrollDelta < 0) {
          setIsHeaderVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]);

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

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <header className={`bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm ${isMobile ? 'transition-transform duration-300' : ''} ${isMobile && !isHeaderVisible ? '-translate-y-full' : 'translate-y-0'}`}>
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
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                disabled={isSearching}
                className={`pl-10 pr-4 py-2 bg-gray-100 rounded-full w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : (
                    <>
                      {searchResults.posts.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Posts</div>
                          {searchResults.posts.slice(0, 3).map((post) => (
                            <div
                              key={post.public_id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => handleResultClick(() => router.push(`/posts/${post.public_id}`))}
                            >
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Newspaper className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {post.title || 'Untitled Post'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  by {post.user?.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.organizations.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Organizations</div>
                          {searchResults.organizations.slice(0, 3).map((org) => (
                            <div
                              key={org.id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => handleResultClick(() => router.push(`/organizations/${org.id}`))}
                            >
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {org.title}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {org.users_count} members
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.spaces.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Spaces</div>
                          {searchResults.spaces.slice(0, 3).map((space) => (
                            <div
                              key={space.id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => handleResultClick(() => router.push(`/organizations/${space.organization_id}/spaces/${space.id}`))}
                            >
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <FolderOpen className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {space.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {space.organization?.title}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.news.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">News</div>
                          {searchResults.news.slice(0, 3).map((news) => (
                            <div
                              key={news.public_id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => handleResultClick(() => router.push(`/news/${news.public_id}`))}
                            >
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <Newspaper className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {news.title}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {news.organization?.title}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.users.length > 0 && (
                        <div className="p-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Users</div>
                          {searchResults.users.slice(0, 3).map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => handleResultClick(() => router.push(`/users/${user.id}`))}
                            >
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.posts.length === 0 && searchResults.organizations.length === 0 && searchResults.spaces.length === 0 && searchResults.news.length === 0 && searchResults.users.length === 0 && searchQuery.trim() && (
                        <div className="p-4 text-center text-gray-500">No results found</div>
                      )}
                    </>
                  )}
                </div>
              )}
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
              onClick={() => router.push('/spaces')}
              className={`px-8 py-2 rounded-lg hover:bg-gray-100 ${
                activeTab === 'spaces'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderOpen className="w-6 h-6" />
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
                        <button
                          onClick={() => {
                            setIsAvatarDropdownOpen(false);
                            router.push('/profile');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setIsAvatarDropdownOpen(false);
                            router.push('/settings');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
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
          <span className="text-xs mt-1">Content</span>
        </button>
        <button
          onClick={() => router.push('/spaces')}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === 'spaces' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <FolderOpen className="w-6 h-6" />
          <span className="text-xs mt-1">Spaces</span>
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

