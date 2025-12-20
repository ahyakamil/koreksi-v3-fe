import { useState, useEffect, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';
import { useEncryption } from './useEncryption';

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
const playNotificationSound = () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Fade out

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5); // 0.5 second beep
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

export const useChat = (apiUrl: string, token: string, userId?: string, isWidgetExpanded?: boolean) => {
  const { rsaKeyPair, isLoaded: encryptionLoaded, generateRSAKeyPair, generateAESKey, encryptWithRSA, decryptWithRSA, encryptWithAESKey, decryptWithAESKey, getDerivedKey, encryptWithAES, decryptWithAES } = useEncryption(apiUrl, token);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ total_unread: 0, unread_by_friend: {} });
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const selectedFriendRef = useRef<Friend | null>(null);
  const channelRef = useRef<any>(null);

  const fetchFriends = useCallback(async () => {
    console.log('Fetching friends', { apiUrl, token: !!token });
    setFriendsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Friends response:', data);
      if (data.statusCode === 2000) {
        setFriends(data.data.friends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  }, [apiUrl, token]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 2000) {
        setUnreadCounts(data.data);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  }, [apiUrl, token]);


  const sendMessage = useCallback(async (friendId: string, content: string) => {
    if (!rsaKeyPair) {
      if (encryptionLoaded) {
        await generateRSAKeyPair();
      } else {
        throw new Error('Encryption not loaded yet. Please wait.');
      }
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(['aesKeys'], 'readonly');
      const store = transaction.objectStore('aesKeys');
      const getRequest = store.get(friendId);

      const result = await new Promise<any>((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      });

      let aesKey: CryptoKey;
      let isFirstMessage = false;

      if (result) {
        // Existing AES key
        aesKey = await crypto.subtle.importKey('raw', result.keyData, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      } else {
        // Check if AES key exists in database
        try {
          const response = await fetch(`${apiUrl}/chat/aes-key/${friendId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.statusCode === 2000) {
              const derivedKey = await getDerivedKey();
              if (derivedKey) {
                const encryptedKeyData = new Uint8Array(Array.from(atob(data.data.encrypted_aes_key), c => c.charCodeAt(0)));
                const keyData = await decryptWithAES(derivedKey, encryptedKeyData.buffer);
                aesKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
                // Store in IndexedDB
                const db2 = await openDB();
                const transaction2 = db2.transaction(['aesKeys'], 'readwrite');
                const store2 = transaction2.objectStore('aesKeys');
                store2.put({ friendId, keyData });
              } else {
                throw new Error('Derived key not available');
              }
            } else {
              throw new Error('AES key not found in db');
            }
          } else {
            throw new Error('Failed to fetch AES key from db');
          }
        } catch (error) {
          // Generate new AES key
          aesKey = await generateAESKey();
          const exportedKey = await crypto.subtle.exportKey('raw', aesKey);
          // Store in IndexedDB
          const db2 = await openDB();
          const transaction2 = db2.transaction(['aesKeys'], 'readwrite');
          const store2 = transaction2.objectStore('aesKeys');
          store2.put({ friendId, keyData: exportedKey });
          isFirstMessage = true;

          // Store in database
          const derivedKey = await getDerivedKey();
          if (derivedKey) {
            const encryptedAES = await encryptWithAES(derivedKey, exportedKey);
            await fetch(`${apiUrl}/chat/aes-key`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                friend_id: friendId,
                encrypted_aes_key: btoa(Array.from(new Uint8Array(encryptedAES), b => String.fromCharCode(b)).join('')),
              }),
            });
          }
        }
      }

      // Encrypt content
      const encryptedContent = await encryptWithAESKey(aesKey, content);

      // Always encrypt AES key with friend's public key (backend stores it per message)
      const friend = friends.find(f => f.user.id === friendId);
      if (!friend) throw new Error('Friend not found');
      const publicKeyStr = friend.user.public_key;
      if (!publicKeyStr) throw new Error('Friend public key not available');
      const jwk = JSON.parse(publicKeyStr);
      if (!jwk) throw new Error('Invalid friend public key');
      jwk.alg = 'RSA-OAEP-256';
      jwk.key_ops = ['encrypt'];
      const friendPublicKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
      );
      const exportedAES = await crypto.subtle.exportKey('raw', aesKey);
      const encryptedAES = await encryptWithRSA(friendPublicKey, exportedAES);
      const encryptedKey = btoa(Array.from(new Uint8Array(encryptedAES)).map(b => String.fromCharCode(b)).join(''));

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ivString = btoa(Array.from(iv, b => String.fromCharCode(b)).join(''));

      // Send via HTTP API
      const response = await fetch(`${apiUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          friend_id: friendId,
          encrypted_content: encryptedContent,
          encrypted_key: encryptedKey,
          iv: ivString,
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
  }, [apiUrl, token, rsaKeyPair, friends, generateAESKey, encryptWithAESKey, encryptWithRSA, getDerivedKey, encryptWithAES, decryptWithAES]);

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
      } else {
        throw new Error(data.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [apiUrl, token]);

  const fetchMessages = useCallback(async (friendId: string) => {
    if (!rsaKeyPair) return;
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/chat/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 2000) {
        // Decrypt messages
        const decryptedMessages = await Promise.all(data.data.map(async (msg: any) => {
          try {
            let aesKey: CryptoKey;
            if (msg.sender_id === userId) {
              // For own messages, get AES key from IndexedDB or database
              const db = await openDB();
              const transaction = db.transaction(['aesKeys'], 'readonly');
              const store = transaction.objectStore('aesKeys');
              const getRequest = store.get(friendId);
              let result = await new Promise<any>((resolve, reject) => {
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => reject(getRequest.error);
              });
              if (!result) {
                // Try to get from database
                try {
                  const response = await fetch(`${apiUrl}/chat/aes-key/${friendId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (response.ok) {
                    const data = await response.json();
                    if (data.statusCode === 2000) {
                      const derivedKey = await getDerivedKey();
                      if (derivedKey) {
                        const encryptedKeyData = new Uint8Array(Array.from(atob(data.data.encrypted_aes_key), c => c.charCodeAt(0)));
                        const keyData = await decryptWithAES(derivedKey, encryptedKeyData.buffer);
                        aesKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
                        // Store in IndexedDB for future use
                        const storeWrite = db.transaction(['aesKeys'], 'readwrite').objectStore('aesKeys');
                        storeWrite.put({ friendId, keyData });
                      } else {
                        throw new Error('Derived key not available');
                      }
                    } else {
                      throw new Error('AES key not found in db');
                    }
                  } else {
                    throw new Error('Failed to fetch AES key from db');
                  }
                } catch (error) {
                  throw new Error('AES key not found for sent message');
                }
              } else {
                aesKey = await crypto.subtle.importKey('raw', result.keyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
              }
            } else {
              // For received messages, decrypt the encrypted_key
              const aesKeyEncrypted = msg.encrypted_key;
              const aesKeyData = await decryptWithRSA(rsaKeyPair!.privateKey, Uint8Array.from(atob(aesKeyEncrypted), c => c.charCodeAt(0)).buffer);
              aesKey = await crypto.subtle.importKey('raw', aesKeyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
            }
            const decryptedContent = await decryptWithAESKey(aesKey, msg.encrypted_content);
            return { ...msg, decryptedContent };
          } catch (error) {
            console.error('Error decrypting fetched message:', error);
            return { ...msg, decryptedContent: 'Failed to decrypt' };
          }
        }));
        setMessages(decryptedMessages);
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, rsaKeyPair, userId, decryptWithRSA, decryptWithAESKey]);

  // Update online status every 30 seconds
  useEffect(() => {
    if (!token) return;

    const updateOnlineStatus = async () => {
      try {
        await fetch(`${apiUrl}/auth/update-online-status`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // Update immediately
    updateOnlineStatus();

    // Set up interval to update every 30 seconds
    const interval = setInterval(updateOnlineStatus, 30000);

    return () => clearInterval(interval);
  }, [apiUrl, token]);

  useEffect(() => {
    if (token) {
      fetchFriends();
      fetchUnreadCounts();
    }
  }, [token, fetchFriends, fetchUnreadCounts]);

  // Refresh friends list every 60 seconds to update online status
  useEffect(() => {
    if (!token) return;

    const refreshFriends = () => {
      fetchFriends();
    };

    // Set up interval to refresh every 60 seconds
    const interval = setInterval(refreshFriends, 60000);

    return () => clearInterval(interval);
  }, [token, fetchFriends]);

  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  useEffect(() => {
    if (selectedFriend && rsaKeyPair) {
      fetchMessages(selectedFriend.user.id);
    }
  }, [selectedFriend, rsaKeyPair, fetchMessages]);


  // Pusher connection setup
  useEffect(() => {
    if (userId && token) {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherHost = process.env.NEXT_PUBLIC_PUSHER_HOST;
      const pusherPort = process.env.NEXT_PUBLIC_PUSHER_PORT;
      const pusherScheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME;
      if (!pusherKey) {
        console.warn('Pusher key not configured, skipping WebSocket integration');
        return;
      }
      try {
        const p = new Pusher(pusherKey, {
          wsHost: pusherHost,
          wsPort: pusherPort ? parseInt(pusherPort) : undefined,
          wssPort: pusherPort ? parseInt(pusherPort) : undefined,
          forceTLS: pusherScheme === 'wss',
          cluster: 'local', // dummy
          authEndpoint: `${apiUrl.replace('/v1', '')}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        } as any);
        const channel = p.subscribe(`private-user.${userId}`);
        channelRef.current = channel;
        return () => {
          p.disconnect();
        };
      } catch (error) {
        console.error('Error initializing Pusher:', error);
      }
    }
  }, [userId, token, apiUrl]);

  // Pusher event bindings
  useEffect(() => {
    if (channelRef.current && rsaKeyPair) {
      const channel = channelRef.current;
      channel.bind('message.sent', async (data: any) => {
        const msg = data.message;
        try {
          let decryptedContent: string;
          let aesKey: CryptoKey;

          if (msg.sender_id === userId) {
            // For own messages, get AES key from IndexedDB or database
            const db = await openDB();
            const transaction = db.transaction(['aesKeys'], 'readonly');
            const store = transaction.objectStore('aesKeys');
            const getRequest = store.get(msg.receiver_id);
            let result = await new Promise<any>((resolve, reject) => {
              getRequest.onsuccess = () => resolve(getRequest.result);
              getRequest.onerror = () => reject(getRequest.error);
            });
            if (!result) {
              // Try to get from database
              try {
                const response = await fetch(`${apiUrl}/chat/aes-key/${msg.receiver_id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                  const data = await response.json();
                  if (data.statusCode === 2000) {
                    const derivedKey = await getDerivedKey();
                    if (derivedKey) {
                      const encryptedKeyData = new Uint8Array(Array.from(atob(data.data.encrypted_aes_key), c => c.charCodeAt(0)));
                      const keyData = await decryptWithAES(derivedKey, encryptedKeyData.buffer);
                      aesKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
                      // Store in IndexedDB for future use
                      const storeWrite = db.transaction(['aesKeys'], 'readwrite').objectStore('aesKeys');
                      storeWrite.put({ friendId: msg.receiver_id, keyData });
                    } else {
                      throw new Error('Derived key not available');
                    }
                  } else {
                    throw new Error('AES key not found in db');
                  }
                } else {
                  throw new Error('Failed to fetch AES key from db');
                }
              } catch (error) {
                throw new Error('AES key not found for own message');
              }
            } else {
              aesKey = await crypto.subtle.importKey('raw', result.keyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
            }
            decryptedContent = await decryptWithAESKey(aesKey, msg.encrypted_content);
          } else {
            // For received messages, decrypt the encrypted_key
            const aesKeyEncrypted = msg.encrypted_key;
            const aesKeyData = await decryptWithRSA(rsaKeyPair!.privateKey, Uint8Array.from(atob(aesKeyEncrypted), c => c.charCodeAt(0)).buffer);
            aesKey = await crypto.subtle.importKey('raw', aesKeyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
            decryptedContent = await decryptWithAESKey(aesKey, msg.encrypted_content);
          }

          const decryptedMsg = { ...msg, decryptedContent };
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
        } catch (error) {
          console.error('Error decrypting incoming message:', error);
        }
      });
      channel.bind('message.read', (data: any) => {
        const { friend_id } = data;
        setUnreadCounts(prev => ({
          ...prev,
          total_unread: prev.total_unread - (prev.unread_by_friend[friend_id] || 0),
          unread_by_friend: { ...prev.unread_by_friend, [friend_id]: 0 },
        }));
      });
    }
  }, [rsaKeyPair, userId, decryptWithRSA, decryptWithAESKey]);

  return {
    friends,
    unreadCounts,
    selectedFriend,
    setSelectedFriend,
    messages,
    loading,
    friendsLoading,
    sendMessage,
    markAsRead,
    fetchUnreadCounts,
    encryptionLoaded,
  };
};
