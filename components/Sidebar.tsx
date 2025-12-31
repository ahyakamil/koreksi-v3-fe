import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, TrendingUp, Users, Bookmark, Clock, Settings } from 'lucide-react';
import { getPublicOrganizations } from '../utils/api';
import { Organization } from '../types';

export function Sidebar() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { icon: Home, label: 'News Feed', active: true },
    { icon: TrendingUp, label: 'Trending Stories', count: 12 },
    { icon: Users, label: 'Following', count: 45 },
    { icon: Bookmark, label: 'Saved Articles' },
    { icon: Clock, label: 'Watch Later' },
    { icon: Settings, label: 'Settings' },
  ];

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await getPublicOrganizations(0, 5); // Fetch first 5 organizations
        if (res.ok && res.body?.data?.content) {
          setOrganizations(res.body.data.content);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  return (
    <aside className="hidden lg:block w-64 fixed left-0 top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
      <nav className="space-y-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
              item.active ? 'bg-gray-100' : ''
            }`}
          >
            <item.icon className="w-5 h-5 text-gray-700" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-sm">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="px-3 text-sm text-gray-500 mb-3">Suggested Organizations</h3>
        <div className="space-y-2">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : organizations.length > 0 ? (
            organizations.map((org) => (
              <Link
                key={org.id}
                href={`/organizations/${org.id}`}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                  {org.image ? (
                    <img src={org.image} alt={org.title} className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <span className="text-sm">🏢</span>
                  )}
                </div>
                <span className="text-sm">{org.title}</span>
              </Link>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No organizations found</div>
          )}
        </div>
      </div>
    </aside>
  );
}
