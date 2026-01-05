'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Search, Newspaper, Building2, FolderOpen, Users } from 'lucide-react';
import { searchEntities } from '../utils/api';
import { Post, Organization, Space, News, User } from '../types';

export default function SearchPage() {
  const router = useRouter();
  const { q: query, type: searchType } = router.query;
  const [searchQuery, setSearchQuery] = useState(query as string || '');
  const [selectedType, setSelectedType] = useState<'all' | 'post' | 'organization' | 'space' | 'news' | 'user'>('all');
  const [results, setResults] = useState<{
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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const types: ('organization' | 'news' | 'post' | 'space' | 'user')[] = ['user', 'organization', 'post', 'news', 'space'];

  const performSearch = async (query: string, type: 'all' | 'post' | 'organization' | 'space' | 'news' | 'user', page: number = 0) => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ posts: [], organizations: [], spaces: [], news: [], users: [] });
      return;
    }

    setIsSearching(true);
    try {
      if (type === 'all') {
        const results = await Promise.allSettled(
          types.map(type => searchEntities(query, type, page))
        );

        const newResults = {
          users: results[0].status === 'fulfilled' ? results[0].value.body?.data?.content || [] : [],
          organizations: results[1].status === 'fulfilled' ? results[1].value.body?.data?.content || [] : [],
          posts: results[2].status === 'fulfilled' ? results[2].value.body?.data?.content || [] : [],
          news: results[3].status === 'fulfilled' ? results[3].value.body?.data?.content || [] : [],
          spaces: results[4].status === 'fulfilled' ? results[4].value.body?.data?.content || [] : [],
        };

        setResults(newResults);
        // For 'all' type, we don't have pagination info, so we'll show all results
        setTotalPages(1);
        setTotalElements(Object.values(newResults).flat().length);
      } else {
        const result = await searchEntities(query, type, page);
        const content = result.body?.data?.content || [];
        const pageable = result.body?.data?.pageable;

        setResults({
          posts: type === 'post' ? content : [],
          organizations: type === 'organization' ? content : [],
          spaces: type === 'space' ? content : [],
          news: type === 'news' ? content : [],
          users: type === 'user' ? content : [],
        });

        setTotalPages(pageable?.totalPages || 1);
        setTotalElements(pageable?.totalElements || 0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({ posts: [], organizations: [], spaces: [], news: [], users: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      router.push({
        pathname: '/search',
        query: { q: searchQuery, type: selectedType }
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(searchQuery, selectedType, page);
  };

  const renderPaginationButton = (page: number, label: string | number, disabled: boolean = false) => (
    <button
      key={page}
      onClick={() => !disabled && handlePageChange(page)}
      disabled={disabled || isSearching}
      className={`px-3 py-2 text-sm font-medium rounded-md ${
        page === currentPage && !isSearching
          ? 'text-blue-600 bg-blue-50 border border-blue-500'
          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
      } ${disabled || isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );

  useEffect(() => {
    if (query) {
      setSearchQuery(query as string);
      setSelectedType((searchType as any) || 'all');
      performSearch(query as string, (searchType as any) || 'all', currentPage);
    }
  }, [query, searchType]);

  const renderResults = () => {
    const allResults = [
      ...results.posts.map(item => ({ ...item, type: 'post' })),
      ...results.organizations.map(item => ({ ...item, type: 'organization' })),
      ...results.spaces.map(item => ({ ...item, type: 'space' })),
      ...results.news.map(item => ({ ...item, type: 'news' })),
      ...results.users.map(item => ({ ...item, type: 'user' })),
    ];

    if (allResults.length === 0 && !isSearching) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {results.users.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({results.users.length})
            </h3>
            <div className="space-y-3">
              {results.users.map((user) => (
                <div key={user.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Link href={`/${user.username}`} className="block">
                    <h4 className="font-medium text-gray-900 mb-1">{user.name}</h4>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.organizations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organizations ({results.organizations.length})
            </h3>
            <div className="space-y-3">
              {results.organizations.map((org) => (
                <div key={org.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Link href={`/organizations/${org.id}`} className="block">
                    <h4 className="font-medium text-gray-900 mb-1">{org.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{org.description}</p>
                    <div className="text-xs text-gray-500 mt-2">{org.users_count} members</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.spaces.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Spaces ({results.spaces.length})
            </h3>
            <div className="space-y-3">
              {results.spaces.map((space) => (
                <div key={space.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Link href={`/organizations/${space.organization_id}/spaces/${space.id}`} className="block">
                    <h4 className="font-medium text-gray-900 mb-1">{space.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{space.description}</p>
                    <div className="text-xs text-gray-500 mt-2">{space.organization?.title}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.posts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              Posts ({results.posts.length})
            </h3>
            <div className="space-y-3">
              {results.posts.map((post) => (
                <div key={post.public_id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Link href={`/posts/${post.public_id}`} className="block">
                    <h4 className="font-medium text-gray-900 mb-1">{post.title || 'Untitled Post'}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content?.substring(0, 150)}...</p>
                    <div className="text-xs text-gray-500 mt-2">by {post.user?.name}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.news.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              News ({results.news.length})
            </h3>
            <div className="space-y-3">
              {results.news.map((news) => (
                <div key={news.public_id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Link href={`/news/${news.public_id}`} className="block">
                    <h4 className="font-medium text-gray-900 mb-1">{news.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{news.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
                    <div className="text-xs text-gray-500 mt-2">{news.organization?.title}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        {renderPaginationButton(currentPage - 1, 'Previous', currentPage === 0)}

        {startPage > 0 && (
          <>
            {renderPaginationButton(0, 1)}
            {startPage > 1 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}

        {pages.map((page) => renderPaginationButton(page, page + 1))}

        {endPage < totalPages - 1 && (
          <>
            {endPage < totalPages - 2 && <span className="px-2 text-gray-500">...</span>}
            {renderPaginationButton(totalPages - 1, totalPages)}
          </>
        )}

        {renderPaginationButton(currentPage + 1, 'Next', currentPage === totalPages - 1)}
      </div>
    );
  };

  return (
      <div>
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              disabled={isSearching}
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">All</option>
              <option value="post">Posts</option>
              <option value="organization">Organizations</option>
              <option value="space">Spaces</option>
              <option value="news">News</option>
              <option value="user">Users</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Search
            </button>
          </div>

          {query && (
            <div className="text-sm text-gray-600">
              Showing results for "{query}" {selectedType !== 'all' && `in ${selectedType}s`}
              {totalElements > 0 && ` (${totalElements} total)`}
            </div>
          )}
        </div>

        {isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching...</p>
          </div>
        )}

        {!isSearching && (
          <>
            {renderResults()}
            {renderPagination()}
          </>
        )}
      </div>
  );
}