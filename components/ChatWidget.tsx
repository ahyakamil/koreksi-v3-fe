import React, { useState, useEffect } from 'react';
import ChatIcon from './ChatIcon';
import ChatWindow from './ChatWindow';
import { useChat } from '../hooks/useChat';

interface ChatWidgetProps {
  apiUrl: string;
  token: string;
  userId?: string;
  openWithFriend?: string | null;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ apiUrl, token, userId, openWithFriend }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [initialSelected, setInitialSelected] = useState<string | null>(null);
  const { unreadCounts } = useChat(apiUrl, token, userId, isExpanded);

  useEffect(() => {
    if (openWithFriend) {
      setIsExpanded(true);
      setInitialSelected(openWithFriend);
    }
  }, [openWithFriend]);

  // Close widget when there are no unread messages
  useEffect(() => {
    if (unreadCounts.total_unread === 0 && !openWithFriend) {
      setIsExpanded(false);
    }
  }, [unreadCounts.total_unread, openWithFriend]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const containerClass = isExpanded
    ? "fixed z-50 bottom-0 left-0 w-full h-96 sm:bottom-4 sm:right-4 sm:top-auto sm:left-auto sm:w-auto sm:h-auto"
    : "fixed bottom-4 right-4 z-50";

  return (
    <div className={containerClass}>
      {isExpanded ? (
        <ChatWindow onClose={toggleExpanded} userId={userId} apiUrl={apiUrl} token={token} initialSelectedFriendId={initialSelected || undefined} />
      ) : (
        <ChatIcon onClick={toggleExpanded} unreadCount={unreadCounts.total_unread} />
      )}
    </div>
  );
};

export default ChatWidget;