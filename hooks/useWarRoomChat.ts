import { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface WarRoomMessage {
  name: string;
  message: string;
  timestamp: string;
}

interface WarRoomUser {
  name: string;
  joinedAt: string;
}

export const useWarRoomChat = (apiUrl: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WarRoomMessage[]>([]);
  const [users, setUsers] = useState<WarRoomUser[]>([]);
  const [joined, setJoined] = useState(false);
  const [currentName, setCurrentName] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Join the war room
  const join = useCallback(async (name: string, roomId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/war-room/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, room_id: roomId }),
      });

      const data = await response.json();
      if (data.statusCode === 2000) {
        setJoined(true);
        setCurrentName(data.data.name);
        setCurrentRoomId(data.data.room_id);
        // Add self to users initially
        setUsers([{ name: data.data.name, joinedAt: new Date().toISOString() }]);
        // Join the room channel
        if (socketRef.current) {
          socketRef.current.emit('join-war-room', { roomId: data.data.room_id, name: data.data.name });
        }
        // Users will be updated via WebSocket events
      } else {
        throw new Error(data.message || 'Failed to join');
      }
    } catch (error) {
      console.error('Error joining war room:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    try {
      const response = await fetch(`${apiUrl}/war-room/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message, name: currentName, room_id: currentRoomId }),
      });

      const data = await response.json();
      if (data.statusCode !== 2000) {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [apiUrl, currentName, currentRoomId]);

  // Leave the war room
  const leave = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/war-room/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: currentName, room_id: currentRoomId }),
      });

      const data = await response.json();
      if (data.statusCode === 2000) {
        setJoined(false);
        setCurrentName('');
        setCurrentRoomId('');
        setUsers([]);
        setMessages([]);
      } else {
        throw new Error(data.message || 'Failed to leave');
      }
    } catch (error) {
      console.error('Error leaving war room:', error);
      throw error;
    }
  }, [apiUrl, currentName, currentRoomId]);

  // Socket.IO connection setup
  useEffect(() => {
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    try {
      const socket = io(websocketUrl, {
        forceNew: true,
        withCredentials: true,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to WebSocket for war room');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });

      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error('Error initializing Socket.IO:', error);
    }
  }, []);

  // Socket.IO event bindings
  useEffect(() => {
    if (socketRef.current) {
      const socket = socketRef.current;

      socket.on('war-room.user.joined', (data: any) => {
        const { name, timestamp } = data;
        setUsers(prev => {
          if (!prev.some(u => u.name === name)) {
            return [...prev, { name, joinedAt: timestamp }];
          }
          return prev;
        });
      });

      socket.on('war-room.user.left', (data: any) => {
        const { name } = data;
        setUsers(prev => prev.filter(u => u.name !== name));
      });

      socket.on('war-room.message', (data: any) => {
        const { name, message, timestamp } = data;
        setMessages(prev => [...prev, { name, message, timestamp }]);
      });
    }
  }, []);

  // Pre-fill name for logged-in users
  useEffect(() => {
    if (user && !joined) {
      setCurrentName(user.name);
    }
  }, [user, joined]);

  // Auto-leave on unmount
  useEffect(() => {
    return () => {
      if (joined && socketRef.current) {
        socketRef.current.emit('leave-war-room', { roomId: currentRoomId, name: currentName });
        leave();
      }
    };
  }, [joined, leave, currentRoomId, currentName]);

  return {
    messages,
    users,
    joined,
    currentName,
    currentRoomId,
    loading,
    join,
    sendMessage,
    leave,
  };
};