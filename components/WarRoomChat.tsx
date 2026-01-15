import React, { useState, useEffect, useRef } from 'react';
import { useWarRoomChat } from '../hooks/useWarRoomChat';
import { useAuth } from '../context/AuthContext';

interface ActiveRoom {
  id: string;
  userCount: number;
  users: string[];
}

interface WarRoomChatProps {
  apiUrl: string;
}

const WarRoomChat: React.FC<WarRoomChatProps> = ({ apiUrl }) => {
  const { user } = useAuth();
  const { messages, users, joined, currentName, currentRoomId, loading, join, sendMessage, leave } = useWarRoomChat(apiUrl);
  const [inputMessage, setInputMessage] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('default');
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchActiveRooms = async () => {
    try {
      const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
      const response = await fetch(`${websocketUrl}/active-rooms`);
      if (response.ok) {
        const rooms = await response.json();
        setActiveRooms(rooms);
      }
    } catch (error) {
      console.error('Failed to fetch active rooms:', error);
    }
  };

  useEffect(() => {
    if (!joined) {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [joined]);

  const handleJoin = async (roomId?: string) => {
    const name = user ? user.name : inputName;
    const finalRoomId = roomId || (inputRoomId.trim() || 'default');
    if (!name.trim() || !finalRoomId) return;
    try {
      await join(name, finalRoomId);
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
    const filteredRooms = activeRooms.filter(room =>
      room.id.toLowerCase().includes(roomSearch.toLowerCase())
    );

    return (
      <div className="max-w-2xl mx-auto mt-4 sm:mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">War Room Chat</h2>

        {!user && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full p-2 border rounded text-sm sm:text-base"
              placeholder="Enter your name to join chat"
            />
            {!inputName.trim() && <p className="text-sm text-gray-500 mt-1">Please enter your name to continue</p>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setTab('join')}
            className={`px-4 py-2 ${tab === 'join' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l`}
            disabled={!user && !inputName.trim()}
          >
            Join Room
          </button>
          <button
            onClick={() => setTab('create')}
            className={`px-4 py-2 ${tab === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r`}
            disabled={!user && !inputName.trim()}
          >
            Create Room
          </button>
        </div>

        {tab === 'join' && (
          <div>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="flex-1 p-2 border rounded text-sm sm:text-base"
                placeholder="Search rooms..."
              />
              <button
                onClick={fetchActiveRooms}
                className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              >
                Refresh
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <div key={room.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <div className="font-semibold">{room.id}</div>
                      <div className="text-sm text-gray-600">{room.userCount} users</div>
                    </div>
                    <button
                      onClick={() => handleJoin(room.id)}
                      disabled={loading || (!user && !inputName.trim())}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No active rooms found</div>
              )}
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Room ID</label>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="w-full p-2 border rounded text-sm sm:text-base"
                placeholder="Enter room ID"
              />
            </div>
            <button
              onClick={() => handleJoin()}
              disabled={loading || (!user && !inputName.trim()) || !inputRoomId.trim()}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Creating...' : 'Create & Join'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-lg min-h-[600px] sm:min-h-[700px]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">War Room: {currentRoomId}</h2>
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