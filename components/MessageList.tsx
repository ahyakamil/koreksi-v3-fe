import React, { useEffect, useRef, useLayoutEffect } from 'react';
import TimeAgo from './TimeAgo';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  userId?: string;
  loading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, userId, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      });
    }
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      if (isInitialLoad.current) {
        // Always scroll to bottom on initial load
        scrollToBottom();
        isInitialLoad.current = false;
      } else {
        // For subsequent messages, only scroll if near bottom
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages]);

  // Scroll to bottom when loading completes
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages.length]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message) => {
        const isMine = message.sender_id.toString() === userId;
        return (
          <div
            key={message.id}
            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                isMine
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{message.decryptedContent || '[Encrypted]'}</p>
              <TimeAgo date={message.created_at} className="text-xs opacity-75" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;