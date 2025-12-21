import React from 'react';
import { useLocale } from '../context/LocaleContext';

interface Friend {
  friendship_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    public_key: string;
    online_at: string | null;
  };
}

interface UnreadCounts {
  total_unread: number;
  unread_by_friend: { [key: string]: number };
}

interface FriendListProps {
  friends: Friend[];
  unreadCounts: UnreadCounts;
  onSelectFriend: (friendId: string) => void;
  selectedFriendId: string | null;
  loading: boolean;
}

const FriendList: React.FC<FriendListProps> = ({ friends, unreadCounts, onSelectFriend, selectedFriendId, loading }) => {
  const { t } = useLocale()
  const isOnline = (onlineAt: string | null) => {
    if (!onlineAt) return false;
    const onlineTime = new Date(onlineAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - onlineTime.getTime()) / (1000 * 60);
    return diffMinutes < 5;
  };

  return (
    <div className="w-full border-r overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-gray-500">{t('loading_friends')}</div>
      ) : friends.length === 0 ? (
        <div className="p-4 text-center text-gray-500">{t('no_friends')}</div>
      ) : (
        <ul>
          {friends.map((friend) => {
            const unreadCount = unreadCounts.unread_by_friend[friend.user.id] || 0;
            const online = isOnline(friend.user.online_at);
            return (
              <li
                key={friend.user.id}
                onClick={() => onSelectFriend(friend.user.id)}
                className={`p-3 cursor-pointer hover:bg-gray-100 ${
                  selectedFriendId === friend.user.id ? 'bg-blue-100' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span>{friend.user.name}</span>
                    {online && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FriendList;