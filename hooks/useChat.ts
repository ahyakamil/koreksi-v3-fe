import { useState, useEffect, useCallback } from 'react';
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

export const useChat = (apiUrl: string, token: string, userId?: string) => {
  const { rsaKeyPair, isLoaded: encryptionLoaded, generateRSAKeyPair, generateAESKey, encryptWithRSA, decryptWithRSA, encryptWithAESKey, decryptWithAESKey } = useEncryption(apiUrl, token);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ total_unread: 0, unread_by_friend: {} });
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);

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
      const transaction = db.transaction(['aesKeys'], 'readwrite');
      const store = transaction.objectStore('aesKeys');
      const getRequest = store.get(friendId);

      getRequest.onsuccess = async () => {
        let aesKey: CryptoKey;
        let isFirstMessage = false;

        if (getRequest.result) {
          // Existing AES key
          aesKey = await crypto.subtle.importKey('raw', getRequest.result.keyData, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
        } else {
          // Generate new AES key
          aesKey = await generateAESKey();
          const exportedKey = await crypto.subtle.exportKey('raw', aesKey);
          store.put({ friendId, keyData: exportedKey });
          isFirstMessage = true;
        }

        // Encrypt content
        const encryptedContent = await encryptWithAESKey(aesKey, content);

        // If first message, encrypt AES key with friend's public key
        let encryptedKey: string;
        if (isFirstMessage) {
          const friend = friends.find(f => f.user.id === friendId);
          if (!friend) throw new Error('Friend not found');
          const friendPublicKey = await crypto.subtle.importKey(
            'jwk',
            JSON.parse(friend.user.public_key),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['encrypt']
          );
          const exportedAES = await crypto.subtle.exportKey('raw', aesKey);
          const encryptedAES = await encryptWithRSA(friendPublicKey, exportedAES);
          encryptedKey = btoa(Array.from(new Uint8Array(encryptedAES), b => String.fromCharCode(b)).join(''));
        } else {
          // For subsequent, still send encrypted_key? Wait, backend expects it always.
          // Actually, since backend stores it per message, need to send it always.
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
          encryptedKey = btoa(Array.from(new Uint8Array(encryptedAES)).map(b => String.fromCharCode(b)).join(''));
        }

        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ivString = btoa(Array.from(iv, b => String.fromCharCode(b)).join(''));

        // Send to API
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
        if (data.statusCode === 2000) {
          // Add to messages
          const newMsg: Message = {
            id: Date.now(), // Temporary ID
            sender_id: userId || '',
            receiver_id: friendId,
            encrypted_content: encryptedContent,
            encrypted_key: encryptedKey,
            iv: ivString,
            sent_at: new Date().toISOString(),
            read_at: null,
            decryptedContent: content,
          };
          setMessages(prev => [...prev, newMsg]);
        } else {
          throw new Error(data.message);
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [apiUrl, token, rsaKeyPair, friends, generateAESKey, encryptWithAESKey, encryptWithRSA]);

  const markAsRead = useCallback(async (friendId: string) => {
    try {
      await fetch(`${apiUrl}/chat/mark-read/${friendId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local unread counts
      setUnreadCounts(prev => ({
        ...prev,
        total_unread: prev.total_unread - (prev.unread_by_friend[friendId] || 0),
        unread_by_friend: { ...prev.unread_by_friend, [friendId]: 0 },
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [apiUrl, token]);

  const fetchMessages = useCallback(async (friendId: string) => {
    if (!rsaKeyPair) return;
    try {
      const response = await fetch(`${apiUrl}/chat/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 2000) {
        const decryptedMessages = await Promise.all(data.data.map(async (msg: any) => {
          try {
            let aesKey: CryptoKey;
            if (msg.sender_id === userId) {
              // For own messages, get AES key from IndexedDB
              const db = await openDB();
              const transaction = db.transaction(['aesKeys'], 'readonly');
              const store = transaction.objectStore('aesKeys');
              const getRequest = store.get(friendId);
              const result = await new Promise<any>((resolve, reject) => {
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => reject(getRequest.error);
              });
              if (!result) throw new Error('AES key not found for sent message');
              aesKey = await crypto.subtle.importKey('raw', result.keyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
            } else {
              // For received messages, decrypt the encrypted_key
              const aesKeyEncrypted = msg.encrypted_key;
              const aesKeyData = await decryptWithRSA(rsaKeyPair!.privateKey, Uint8Array.from(atob(aesKeyEncrypted), c => c.charCodeAt(0)).buffer);
              aesKey = await crypto.subtle.importKey('raw', aesKeyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
            }
            const decryptedContent = await decryptWithAESKey(aesKey, msg.encrypted_content);
            return { ...msg, decryptedContent };
          } catch (error) {
            console.error('Error decrypting message:', error);
            return { ...msg, decryptedContent: 'Failed to decrypt' };
          }
        }));
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [apiUrl, token, rsaKeyPair, userId, decryptWithRSA, decryptWithAESKey]);

  useEffect(() => {
    if (token) {
      fetchFriends();
      fetchUnreadCounts();
    }
  }, [token, fetchFriends, fetchUnreadCounts]);

  useEffect(() => {
    if (selectedFriend && rsaKeyPair) {
      fetchMessages(selectedFriend.user.id);
    }
  }, [selectedFriend, rsaKeyPair, fetchMessages]);


  useEffect(() => {
    if (encryptionLoaded && rsaKeyPair && userId) {
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
        channel.bind('message.sent', async (data: any) => {
          const msg = data.message;
          try {
            const aesKeyEncrypted = msg.encrypted_key;
            const aesKeyData = await decryptWithRSA(rsaKeyPair!.privateKey, Uint8Array.from(atob(aesKeyEncrypted), c => c.charCodeAt(0)).buffer);
            const aesKey = await crypto.subtle.importKey('raw', aesKeyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
            const decryptedContent = await decryptWithAESKey(aesKey, msg.encrypted_content);
            const decryptedMsg = { ...msg, decryptedContent };
            if (selectedFriend && (msg.sender_id === selectedFriend.user.id || msg.receiver_id === selectedFriend.user.id)) {
              setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, decryptedMsg];
              });
            }
            if (msg.receiver_id === userId) {
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
        return () => {
          p.disconnect();
        };
      } catch (error) {
        console.error('Error initializing Pusher:', error);
      }
    }
  }, [encryptionLoaded, rsaKeyPair, userId, token, selectedFriend, decryptWithRSA, decryptWithAESKey]);

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
