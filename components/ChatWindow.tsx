import React, { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import FriendList from './FriendList';
import ChatPanel from './ChatPanel';

interface ChatWindowProps {
  onClose: () => void;
  apiUrl: string;
  userId?: string;
  initialSelectedFriendId?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, apiUrl, userId, initialSelectedFriendId }) => {
  const { friends, unreadCounts, selectedFriend, setSelectedFriend, messages, sendMessage, markAsRead, loading, loadingFriends, errorFriends, encryptionLoaded } = useChat(apiUrl, userId);
  const selectedFriendId = selectedFriend?.user.id || null;
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  useEffect(() => {
    if (friends.length > 0 && !selectedFriend && !initialSelectedFriendId) {
      setSelectedFriend(friends[0]);
      markAsRead(friends[0].user.id);
    }
  }, [friends, selectedFriend, initialSelectedFriendId, setSelectedFriend, markAsRead]);

  const handleSelectFriend = (friendId: string) => {
    const friend = friends.find(f => f.user.id === friendId);
    if (friend) {
      setSelectedFriend(friend);
      markAsRead(friendId);
    } else {
      console.error('Friend not found');
    }
  };

  const handleModalSelectFriend = (friendId: string) => {
    handleSelectFriend(friendId);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-[600px] h-96 sm:w-[600px] bg-white rounded-lg shadow-lg border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold hidden sm:block">Chat</h3>
        <button
          className="text-lg font-semibold sm:hidden cursor-pointer hover:text-blue-500 underline"
          onClick={() => setIsModalOpen(true)}
        >
          {selectedFriend ? selectedFriend.user.name : 'Select Person'}
        </button>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden sm:block w-1/3">
          <FriendList
            friends={friends}
            unreadCounts={unreadCounts}
            onSelectFriend={handleSelectFriend}
            selectedFriendId={selectedFriendId}
            loading={loadingFriends}
            error={errorFriends}
          />
        </div>
        {selectedFriendId && selectedFriend && (
          <ChatPanel
            friend={selectedFriend}
            messages={messages}
            onSendMessage={sendMessage}
            userId={userId}
            encryptionLoaded={encryptionLoaded}
            loading={loading}
          />
        )}
      </div>

      {/* Modal for mobile friend selection */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 max-h-3/4 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Select Person</h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <FriendList
                friends={friends}
                unreadCounts={unreadCounts}
                onSelectFriend={handleModalSelectFriend}
                selectedFriendId={selectedFriendId}
                loading={loadingFriends}
                error={errorFriends}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
