import React, { useState, useEffect, useRef } from 'react';
import { useWarRoomChat } from '../hooks/useWarRoomChat';
import { useAuth } from '../context/AuthContext';

interface WarRoomChatProps {
  apiUrl: string;
}

const WarRoomChat: React.FC<WarRoomChatProps> = ({ apiUrl }) => {
  const { user } = useAuth();
  const { messages, users, joined, currentName, loading, join, sendMessage, leave } = useWarRoomChat(apiUrl);
  const [inputMessage, setInputMessage] = useState('');
  const [inputName, setInputName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleJoin = async () => {
    const name = user ? user.name : inputName;
    if (!name.trim()) return;
    try {
      await join(name);
    } catch (error) {
      alert('Failed to join: ' + (error as Error).message);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    try {
      await sendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      alert('Failed to send: ' + (error as Error).message);
    }
  };

  const handleLeave = async () => {
    try {
      await leave();
    } catch (error) {
      alert('Failed to leave: ' + (error as Error).message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!joined) {
    return (
      <div className="max-w-md mx-auto mt-4 sm:mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Join War Room Chat</h2>
        {!user && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full p-2 border rounded text-sm sm:text-base"
              placeholder="Enter your name"
            />
          </div>
        )}
        <button
          onClick={handleJoin}
          disabled={loading || (!user && !inputName.trim())}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? 'Joining...' : 'Join Chat'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-lg min-h-[600px] sm:min-h-[700px]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">War Room Chat</h2>
        <div className="text-sm text-gray-600">
          {users.length === 1 ? 'You are here' : `You and ${users.length - 1} others are here`}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Users list */}
        <div className="w-full lg:w-1/4 lg:pr-4 lg:border-r">
          <h3 className="font-semibold mb-2">Users ({users.length})</h3>
          <div className="max-h-48 lg:max-h-[500px] overflow-y-auto">
            {users.map((u, index) => (
              <div key={index} className="py-1 text-sm">
                {u.name} {u.name === currentName && '(You)'}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="w-full lg:w-3/4 lg:pl-4 flex flex-col min-h-[400px]">
          <div className="flex-1 min-h-[300px] sm:min-h-[400px] overflow-y-auto mb-4 border rounded p-2">
            {messages.map((msg, index) => (
              <div key={index} className="mb-2">
                <span className="font-semibold text-sm sm:text-base">{msg.name}:</span> <span className="text-sm sm:text-base">{msg.message}</span>
                <div className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-2 border rounded text-sm sm:text-base"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim()}
              className="bg-blue-500 text-white px-3 py-2 sm:px-4 rounded hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarRoomChat;