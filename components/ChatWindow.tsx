import React, { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import FriendList from './FriendList';
import ChatPanel from './ChatPanel';

interface ChatWindowProps {
  onClose: () => void;
  apiUrl: string;
  token: string;
  userId?: string;
  initialSelectedFriendId?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, apiUrl, token, userId, initialSelectedFriendId }) => {
  const { friends, unreadCounts, selectedFriend, setSelectedFriend, messages, sendMessage, markAsRead, friendsLoading, encryptionLoaded } = useChat(apiUrl, token, userId);
  const selectedFriendId = selectedFriend?.user.id || null;

  useEffect(() => {
    if (initialSelectedFriendId && friends.length > 0) {
      const friend = friends.find(f => f.user.id === initialSelectedFriendId);
      if (friend) {
        setSelectedFriend(friend);
        markAsRead(initialSelectedFriendId);
      } else {
        console.error('Initial selected friend not found');
      }
    }
  }, [initialSelectedFriendId, friends, setSelectedFriend, markAsRead]);

  const handleSelectFriend = (friendId: string) => {
    const friend = friends.find(f => f.user.id === friendId);
    if (friend) {
      setSelectedFriend(friend);
      markAsRead(friendId);
    } else {
      console.error('Friend not found');
    }
  };

  return (
    <div className="w-[600px] h-96 bg-white rounded-lg shadow-lg border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Chat</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <FriendList
          friends={friends}
          unreadCounts={unreadCounts}
          onSelectFriend={handleSelectFriend}
          selectedFriendId={selectedFriendId}
          loading={friendsLoading}
        />
        {selectedFriendId && selectedFriend && (
          <ChatPanel
            friend={selectedFriend}
            messages={messages}
            onSendMessage={sendMessage}
            userId={userId}
            encryptionLoaded={encryptionLoaded}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;