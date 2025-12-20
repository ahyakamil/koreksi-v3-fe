import React from 'react';
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

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  encrypted_key: string;
  iv: string;
  sent_at: string;
  read_at: string | null;
  decryptedContent?: string;
}

interface ChatPanelProps {
  friend: Friend;
  messages: Message[];
  onSendMessage: (friendId: string, content: string) => Promise<void>;
  userId?: string;
  encryptionLoaded: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ friend, messages, onSendMessage, userId, encryptionLoaded }) => {
  return (
    <div className="flex-1 flex flex-col">
      <MessageList messages={messages} userId={userId} />
      <MessageInput friendId={friend.user.id} onSendMessage={onSendMessage} encryptionLoaded={encryptionLoaded} />
    </div>
  );
};

export default ChatPanel;