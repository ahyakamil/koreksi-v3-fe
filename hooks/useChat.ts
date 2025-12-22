import { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useEncryption } from './useEncryption';
import { useAuth } from '../context/AuthContext';

import { Message } from '../types';

interface Friend {
  friendship_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    public_key: string;
    online_at: string | null;
  };
}

interface UnreadCounts {
  total_unread: number;
  unread_by_friend: { [key: string]: number };
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('chatDB', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('aesKeys')) {
        db.createObjectStore('aesKeys', { keyPath: 'friendId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Play notification sound for new messages
const playNotificationSound = async () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Fade out

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5); // 0.5 second beep
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

export const useChat = (apiUrl: string, token: string, userId?: string, isWidgetExpanded?: boolean) => {
  const { unreadCounts: globalUnreadCounts, refreshUnreadCounts } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(globalUnreadCounts);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedFriendRef = useRef<Friend | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setUnreadCounts(globalUnreadCounts);
  }, [globalUnreadCounts]);

  // Load friends on initialization
  useEffect(() => {
    if (userId && token) {
      const loadFriends = async () => {
        try {
          // Load all friends for chat
          const allFriends: Friend[] = []
          let page = 0
          const size = 100

          while (true) {
            const response = await fetch(`${apiUrl}/friends?page=${page}&size=${size}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            if (data.statusCode === 2000 && data.data.content) {
              allFriends.push(...data.data.content)
              const pageable = data.data.pageable
              if (pageable.pageNumber + 1 >= pageable.totalPages) break
              page++
            } else {
              break
            }
          }

          setFriends(allFriends)
        } catch (error) {
          console.error('Failed to load friends for chat:', error)
        }
      }

      loadFriends()
    }
  }, [userId, token, apiUrl])




  const sendMessage = useCallback(async (friendId: string, content: string) => {
    try {
      // Send plain content via HTTP API
      const response = await fetch(`${apiUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          friend_id: friendId,
          content: content,
        }),
      });

      const data = await response.json();
      if (data.statusCode !== 2000) {
        throw new Error(data.message || 'Failed to send message');
      }

      // Message will appear via WebSocket broadcast event
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [apiUrl, token]);

  const markAsRead = useCallback(async (friendId: string) => {
    try {
      const response = await fetch(`${apiUrl}/chat/mark-read/${friendId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.statusCode === 2000) {
        // Update local unread counts optimistically
        setUnreadCounts(prev => ({
          ...prev,
          total_unread: prev.total_unread - (prev.unread_by_friend[friendId] || 0),
          unread_by_friend: { ...prev.unread_by_friend, [friendId]: 0 },
        }));
        // Update global unread counts
        await refreshUnreadCounts();
      } else {
        throw new Error(data.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [apiUrl, token, refreshUnreadCounts]);

  const fetchMessages = useCallback(async (friendId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/chat/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 2000) {
        // Messages are already decrypted by backend
        const messagesWithContent = data.data.map((msg: any) => ({
          ...msg,
          decryptedContent: msg.content || 'Failed to load'
        }));
        setMessages(messagesWithContent);
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);





  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend.user.id);
    }
  }, [selectedFriend]);


  // Socket.IO connection setup
  useEffect(() => {
    if (userId && token) {
      const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
      try {
        const socket = io(websocketUrl, {
          auth: {
            token: token,
          },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Connected to WebSocket server');
          // Broadcast online status when connected
          socket.emit('user.presence', { status: 'online' });
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from WebSocket server');
          // Don't broadcast offline on disconnect - let server handle timeouts
        });

        // Heartbeat mechanism to maintain presence
        const heartbeatInterval = setInterval(() => {
          if (socket.connected) {
            socket.emit('user.heartbeat');
          }
        }, 30000); // Send heartbeat every 30 seconds

        return () => {
          clearInterval(heartbeatInterval);
          socket.disconnect();
        };
      } catch (error) {
        console.error('Error initializing Socket.IO:', error);
      }
    }
  }, [userId, token]);

  // Socket.IO event bindings
  useEffect(() => {
    if (socketRef.current) {
      const socket = socketRef.current;
      socket.on('message.sent', async (data: any) => {
        const msg = data.message;
        // Backend sends decrypted content
        const decryptedMsg = { ...msg, decryptedContent: msg.content || 'Failed to load' };
        const currentSelectedFriend = selectedFriendRef.current;
        if (currentSelectedFriend && (msg.sender_id === currentSelectedFriend.user.id || msg.receiver_id === currentSelectedFriend.user.id)) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, decryptedMsg];
          });
        }
        if (msg.receiver_id === userId) {
          // Play notification sound for new messages only when widget is not expanded
          if (!isWidgetExpanded) {
            playNotificationSound();
          }

          setUnreadCounts(prev => ({
            total_unread: prev.total_unread + 1,
            unread_by_friend: { ...prev.unread_by_friend, [msg.sender_id]: (prev.unread_by_friend[msg.sender_id] || 0) + 1 },
          }));
        }
      });
      socket.on('message.read', (data: any) => {
        // Notification that messages were read by the receiver, no action needed for unread counts
      });
      socket.on('user.presence', (data: any) => {
        // Update friend's online/offline status in real-time
        const { user_id, status, online_at } = data;
        setFriends(prev => prev.map(friend =>
          friend.user.id === user_id
            ? { ...friend, user: { ...friend.user, online_at: status === 'online' ? (online_at || new Date().toISOString()) : null } }
            : friend
        ));
      });

      socket.on('user.offline', (data: any) => {
        // Handle offline status from server (after timeout)
        const { user_id } = data;
        setFriends(prev => prev.map(friend =>
          friend.user.id === user_id
            ? { ...friend, user: { ...friend.user, online_at: null } }
            : friend
        ));
      });
    }
  }, [userId]);

  return {
    friends,
    unreadCounts,
    selectedFriend,
    setSelectedFriend,
    messages,
    loading,
    sendMessage,
    markAsRead,
    encryptionLoaded: true, // Always loaded since no encryption on frontend
  };
};
