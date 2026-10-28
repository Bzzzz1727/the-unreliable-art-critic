import { ArchiveRecord } from '../types';

const DB_NAME = 'UnreliableCriticArchiveDB';
const DB_VERSION = 1;
const STORE_NAME = 'artworks';
const LOCAL_STORAGE_BACKUP_KEY = 'CRITIC_ARCHIVE_RECORDS_BACKUP';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('score', 'score', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

// Fallback functions using localStorage
function getLocalBackup(): ArchiveRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBackup(records: ArchiveRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('LocalStorage backup storage limit reached:', err);
  }
}

/**
 * Save an artwork record persistently.
 */
export async function saveArchiveRecord(record: ArchiveRecord): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, falling back to localStorage:', err);
    const existing = getLocalBackup().filter(r => r.id !== record.id);
    existing.unshift(record);
    saveLocalBackup(existing);
  }
}

/**
 * Retrieve all archived artwork records sorted by creation date descending.
 */
export async function getAllArchiveRecords(): Promise<ArchiveRecord[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: ArchiveRecord[] = request.result || [];
        // Sort descending (newest first)
        records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get failed, reading from localStorage:', err);
    const records = getLocalBackup();
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return records;
  }
}

/**
 * Retrieve a single record by ID.
 */
export async function getArchiveRecordById(id: string): Promise<ArchiveRecord | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const record = getLocalBackup().find(r => r.id === id);
    return record || null;
  }
}

/**
 * Delete a single archive record.
 */
export async function deleteArchiveRecord(id: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const records = getLocalBackup().filter(r => r.id !== id);
    saveLocalBackup(records);
  }
}

/**
 * Clear all records from the archive.
 */
export async function clearAllArchiveRecords(): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {}
  saveLocalBackup([]);
}

/**
 * Retrieve prior artwork records matching a category or related keywords.
 */
export async function getPriorArtworksByCategory(
  category: string,
  excludeId?: string
): Promise<ArchiveRecord[]> {
  const all = await getAllArchiveRecords();
  return all.filter(r => {
    if (excludeId && r.id === excludeId) return false;
    if (!category) return true;
    return r.category.toLowerCase() === category.toLowerCase() ||
           category.toLowerCase().includes(r.category.toLowerCase());
  });
}
