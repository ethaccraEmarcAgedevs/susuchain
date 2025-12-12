interface PendingTransaction {
  id?: number;
  type: 'contribution' | 'join' | 'create';
  groupAddress?: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface CachedGroup {
  address: string;
  data: any;
  timestamp: number;
}

const DB_NAME = 'susuchain-db';
const DB_VERSION = 1;
const TRANSACTION_STORE = 'pending-transactions';
const GROUP_STORE = 'cached-groups';

/**
 * Open IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
        db.createObjectStore(TRANSACTION_STORE, { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(GROUP_STORE)) {
        db.createObjectStore(GROUP_STORE, { keyPath: 'address' });
      }
    };
  });
}

/**
 * Add transaction to offline queue
 */
export async function queueTransaction(transaction: Omit<PendingTransaction, 'id' | 'timestamp' | 'retries'>): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(TRANSACTION_STORE, 'readwrite');
  const store = tx.objectStore(TRANSACTION_STORE);

  const pendingTx: Omit<PendingTransaction, 'id'> = {
    ...transaction,
    timestamp: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(pendingTx);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending transactions
 */
export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  const db = await openDB();
  const tx = db.transaction(TRANSACTION_STORE, 'readonly');
  const store = tx.objectStore(TRANSACTION_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove transaction from queue
 */
export async function removeTransaction(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(TRANSACTION_STORE, 'readwrite');
  const store = tx.objectStore(TRANSACTION_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update transaction retry count
 */
export async function updateTransactionRetries(id: number, retries: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(TRANSACTION_STORE, 'readwrite');
  const store = tx.objectStore(TRANSACTION_STORE);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const transaction = getRequest.result;
      if (transaction) {
        transaction.retries = retries;
        const putRequest = store.put(transaction);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Transaction not found'));
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Cache group data
 */
export async function cacheGroup(address: string, data: any): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(GROUP_STORE, 'readwrite');
  const store = tx.objectStore(GROUP_STORE);

  const cachedGroup: CachedGroup = {
    address,
    data,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(cachedGroup);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached group data
 */
export async function getCachedGroup(address: string): Promise<CachedGroup | null> {
  const db = await openDB();
  const tx = db.transaction(GROUP_STORE, 'readonly');
  const store = tx.objectStore(GROUP_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(address);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all cached groups
 */
export async function getAllCachedGroups(): Promise<CachedGroup[]> {
  const db = await openDB();
  const tx = db.transaction(GROUP_STORE, 'readonly');
  const store = tx.objectStore(GROUP_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear old cached data (older than 24 hours)
 */
export async function clearOldCache(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(GROUP_STORE, 'readwrite');
  const store = tx.objectStore(GROUP_STORE);
  const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const groups: CachedGroup[] = request.result;
      const deletePromises: Promise<void>[] = [];

      groups.forEach(group => {
        if (group.timestamp < cutoffTime) {
          deletePromises.push(
            new Promise((res, rej) => {
              const deleteRequest = store.delete(group.address);
              deleteRequest.onsuccess = () => res();
              deleteRequest.onerror = () => rej(deleteRequest.error);
            })
          );
        }
      });

      Promise.all(deletePromises).then(() => resolve()).catch(reject);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Register background sync for pending transactions
 */
export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-transactions');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

/**
 * Listen for online/offline events
 */
export function setupOnlineListener(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
