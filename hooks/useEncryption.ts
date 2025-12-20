import { useState, useEffect } from 'react';

// Utility to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('encryptionDB', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Get derived key from localStorage using account id as key
const getDerivedKey = async (): Promise<CryptoKey | null> => {
  const encodedAccountId = typeof window !== 'undefined' ? localStorage.getItem('encryptionPassword') : null;
  if (!encodedAccountId) return null;
  const accountId = atob(encodedAccountId);
  const keyData = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accountId));
  return crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
};

// Encrypt data with AES-GCM
const encryptWithAES = async (key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  // Prepend IV to encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  return result.buffer;
};

// Decrypt data with AES-GCM
const decryptWithAES = async (key: CryptoKey, encryptedData: ArrayBuffer): Promise<ArrayBuffer> => {
  const data = new Uint8Array(encryptedData);
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
};

export const useEncryption = (apiUrl: string, token: string) => {
  const [rsaKeyPair, setRsaKeyPair] = useState<CryptoKeyPair | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const generateRSAKeyPair = async () => {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Export keys
      const publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKeyPKCS8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      // Encrypt private key
      const derivedKey = await getDerivedKey();
      if (!derivedKey) throw new Error('Encryption key not available');
      const encryptedPrivateKey = await encryptWithAES(derivedKey, privateKeyPKCS8);

      // Store in IndexedDB
      const db = await openDB();
      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');
      store.put({ id: 'publicKey', data: publicKeyJWK });
      store.put({ id: 'privateKeyEncrypted', data: encryptedPrivateKey });

      setRsaKeyPair(keyPair);

      // Send public key to backend
      try {
        await fetch(`${apiUrl}/auth/set-public-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ public_key: JSON.stringify(publicKeyJWK) }),
        });
      } catch (error) {
        console.error('Failed to send public key to backend:', error);
      }

      // Send encrypted private key to backend
      try {
        await fetch(`${apiUrl}/auth/set-private-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ private_key_encrypted: btoa(Array.from(new Uint8Array(encryptedPrivateKey), b => String.fromCharCode(b)).join('')) }),
        });
      } catch (error) {
        console.error('Failed to send private key to backend:', error);
      }

      return keyPair;
    } catch (error) {
      console.error('Error generating RSA key pair:', error);
      throw error;
    }
  };

  const loadKeys = async () => {
    try {
      // First, fetch user data from backend
      let userData = null;
      try {
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        userData = data.user;
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }

      const db = await openDB();
      const transaction = db.transaction(['keys'], 'readonly');
      const store = transaction.objectStore('keys');

      // Get both keys using promises
      const publicKeyPromise = new Promise<any>((resolve) => {
        const request = store.get('publicKey');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });

      const privateKeyPromise = new Promise<any>((resolve) => {
        const request = store.get('privateKeyEncrypted');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });

      const [publicKeyResult, privateKeyResult] = await Promise.all([publicKeyPromise, privateKeyPromise]);

      if (publicKeyResult && privateKeyResult) {
        // Local keys exist
        // Import public key
        const publicKey = await crypto.subtle.importKey(
          'jwk',
          publicKeyResult.data,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['encrypt']
        );

        // Decrypt private key
        const derivedKey = await getDerivedKey();
        if (!derivedKey) {
          setIsLoaded(true);
          return;
        }
        const privateKeyData = await decryptWithAES(derivedKey, privateKeyResult.data);
        const privateKey = await crypto.subtle.importKey(
          'pkcs8',
          privateKeyData,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['decrypt']
        );

        setRsaKeyPair({ publicKey, privateKey });

        // If backend doesn't have private key, send it
        if (userData && !userData.private_key_encrypted) {
          try {
            await fetch(`${apiUrl}/auth/set-private-key`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ private_key_encrypted: btoa(Array.from(new Uint8Array(privateKeyResult.data), b => String.fromCharCode(b)).join('')) }),
            });
          } catch (error) {
            console.error('Failed to send private key to backend:', error);
          }
        }

        // Send public key to backend if loaded
        try {
          await fetch(`${apiUrl}/auth/set-public-key`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ public_key: JSON.stringify(publicKeyResult.data) }),
          });
        } catch (error) {
          console.error('Failed to send public key to backend:', error);
        }
      } else if (userData && userData.public_key && userData.private_key_encrypted) {
        // Load from backend
        // Store in IndexedDB
        const db = await openDB();
        const transaction = db.transaction(['keys'], 'readwrite');
        const store = transaction.objectStore('keys');
        store.put({ id: 'publicKey', data: JSON.parse(userData.public_key) });
        const privateKeyArray = new Uint8Array(Array.from(atob(userData.private_key_encrypted), c => c.charCodeAt(0)));
        store.put({ id: 'privateKeyEncrypted', data: privateKeyArray.buffer });

        // Now load them
        const derivedKey = await getDerivedKey();
        if (!derivedKey) {
          setIsLoaded(true);
          return;
        }
        const privateKeyData = await decryptWithAES(derivedKey, privateKeyArray.buffer);
        const privateKey = await crypto.subtle.importKey(
          'pkcs8',
          privateKeyData,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['decrypt']
        );
        const publicKey = await crypto.subtle.importKey(
          'jwk',
          JSON.parse(userData.public_key),
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['encrypt']
        );
        setRsaKeyPair({ publicKey, privateKey });
      } else {
        // Generate new keys
        await generateRSAKeyPair();
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading keys:', error);
      setIsLoaded(true);
    }
  };

  const generateAESKey = async (): Promise<CryptoKey> => {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const encryptWithRSA = async (publicKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> => {
    return crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );
  };

  const decryptWithRSA = async (privateKey: CryptoKey, encryptedData: ArrayBuffer): Promise<ArrayBuffer> => {
    return crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedData
    );
  };

  const encryptWithAESKey = async (aesKey: CryptoKey, data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const encrypted = await encryptWithAES(aesKey, encoder.encode(data).buffer);
    return btoa(Array.from(new Uint8Array(encrypted), b => String.fromCharCode(b)).join(''));
  };

  const decryptWithAESKey = async (aesKey: CryptoKey, encryptedData: string): Promise<string> => {
    const encrypted = new Uint8Array(Array.from(atob(encryptedData), c => c.charCodeAt(0)));
    const decrypted = await decryptWithAES(aesKey, encrypted.buffer);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  };

  return {
    rsaKeyPair,
    isLoaded,
    generateRSAKeyPair,
    generateAESKey,
    encryptWithRSA,
    decryptWithRSA,
    encryptWithAESKey,
    decryptWithAESKey,
  };
};