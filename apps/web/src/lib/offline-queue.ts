type QueueItem = {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  createdAt: number;
};

const DB_NAME = 'fitflow-offline';
const STORE_NAME = 'mutations';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueMutation(item: Omit<QueueItem, 'createdAt'>) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...item, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushMutationQueue() {
  if (!navigator.onLine) return;
  const db = await openDb();
  const items = await new Promise<QueueItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as QueueItem[]);
    request.onerror = () => reject(request.error);
  });

  for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      const request: RequestInit = {
        method: item.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      };
      if (item.body !== undefined) request.body = JSON.stringify(item.body);
      const response = await fetch(item.url, request);
      if (!response.ok && (response.status >= 500 || response.status === 401)) break;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(item.id);
    } catch {
      break;
    }
  }
}

export function installQueueSync() {
  const flush = () => void flushMutationQueue();
  window.addEventListener('online', flush);
  flush();
  return () => window.removeEventListener('online', flush);
}
