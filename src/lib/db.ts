/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Folder, Bill, Reminder, StorageInfo } from '../types';

const DB_NAME = 'billoshub_db';
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bills')) {
        const billStore = db.createObjectStore('bills', { keyPath: 'id' });
        billStore.createIndex('folderId', 'folderId', { unique: false });
      }
      if (!db.objectStoreNames.contains('reminders')) {
        const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' });
        reminderStore.createIndex('billId', 'billId', { unique: false });
      }
    };
  });
}

// Folders CRUD
export async function getFolders(): Promise<Folder[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('folders', 'readonly');
    const store = transaction.objectStore('folders');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFolder(folder: Folder): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('folders', 'readwrite');
    const store = transaction.objectStore('folders');
    const request = store.put(folder);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['folders', 'bills'], 'readwrite');
    const folderStore = transaction.objectStore('folders');
    const billStore = transaction.objectStore('bills');

    // Delete folder
    folderStore.delete(id);

    // Also cascade delete bills inside this folder
    const index = billStore.index('folderId');
    const request = index.openCursor(IDBKeyRange.only(id));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Bills CRUD
export async function getBills(): Promise<Bill[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('bills', 'readonly');
    const store = transaction.objectStore('bills');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getBillsInFolder(folderId: string): Promise<Bill[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('bills', 'readonly');
    const store = transaction.objectStore('bills');
    const index = store.index('folderId');
    const request = index.getAll(IDBKeyRange.only(folderId));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBill(bill: Bill): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('bills', 'readwrite');
    const store = transaction.objectStore('bills');
    const request = store.put(bill);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteBill(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bills', 'reminders'], 'readwrite');
    const billStore = transaction.objectStore('bills');
    const reminderStore = transaction.objectStore('reminders');

    billStore.delete(id);

    // Cascade delete reminders associated with this bill
    const index = reminderStore.index('billId');
    const request = index.openCursor(IDBKeyRange.only(id));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Reminders CRUD
export async function getReminders(): Promise<Reminder[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('reminders', 'readonly');
    const store = transaction.objectStore('reminders');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveReminder(reminder: Reminder): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('reminders', 'readwrite');
    const store = transaction.objectStore('reminders');
    const request = store.put(reminder);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('reminders', 'readwrite');
    const store = transaction.objectStore('reminders');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Helper to calculate total storage size used
export async function getStorageInfo(): Promise<StorageInfo> {
  const bills = await getBills();
  let usedBytes = 0;
  for (const bill of bills) {
    if (bill.fileSize) {
      usedBytes += bill.fileSize;
    } else if (bill.fileData) {
      // Estimate if size is not set (base64 string size estimation: length * 0.75)
      usedBytes += Math.round(bill.fileData.length * 0.75);
    }
  }

  return {
    usedBytes,
    limitBytes: 100 * 1024 * 1024, // 100MB
  };
}
