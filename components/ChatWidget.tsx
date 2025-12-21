import React, { useState, useEffect, useRef } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [initialSelected, setInitialSelected] = useState<string | null>(null);
  const { unreadCounts } = useChat(apiUrl, token, userId, isExpanded);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      if (openWithFriend || unreadCounts.total_unread > 0) {
        setIsExpanded(true);
        if (openWithFriend) {
          setInitialSelected(openWithFriend);
        }
      }
      hasInitialized.current = true;
    }
  }, [openWithFriend, unreadCounts.total_unread]);

  // Close widget when there are no unread messages and widget is not expanded
  useEffect(() => {
    if (unreadCounts.total_unread === 0 && !openWithFriend && !isExpanded) {
      setIsExpanded(false);
    }
  }, [unreadCounts.total_unread, openWithFriend, isExpanded]);

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