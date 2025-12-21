import React from 'react';
import { Message } from '../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Friend {
  friendship_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    public_key: string;
  };
}

interface ChatPanelProps {
  friend: Friend;
  messages: Message[];
  onSendMessage: (friendId: string, content: string) => Promise<void>;
  userId?: string;
  encryptionLoaded: boolean;
  loading?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ friend, messages, onSendMessage, userId, encryptionLoaded, loading }) => {
  return (
    <div className="flex-1 flex flex-col">
      <MessageList messages={messages} userId={userId} loading={loading} />
      <MessageInput friendId={friend.user.id} onSendMessage={onSendMessage} encryptionLoaded={encryptionLoaded} />
    </div>
  );
};

export default ChatPanel;