import React, { useState } from 'react';

interface MessageInputProps {
  friendId: string;
  onSendMessage: (friendId: string, content: string) => Promise<void>;
  encryptionLoaded: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ friendId, onSendMessage, encryptionLoaded }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (message.trim() && !sending) {
      setSending(true);
      try {
        await onSendMessage(friendId, message.trim());
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        // Handle error, maybe show toast
      } finally {
        setSending(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t flex">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={sending}
      />
      <button
        onClick={handleSend}
        disabled={sending || !message.trim() || !encryptionLoaded}
        className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {sending ? 'Sending...' : encryptionLoaded ? 'Send' : 'Loading...'}
      </button>
    </div>
  );
};

export default MessageInput;