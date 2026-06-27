/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Bill {
  id: string;
  folderId: string;
  name: string;
  merchant: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  fileData: string; // base64 or DataURL of the uploaded bill file/image
  fileType: string; // e.g., "image/jpeg", "image/png", "application/pdf"
  fileSize: number; // in bytes
  isPaid: boolean;
  category: string;
  tags?: string[];
  remindersEnabled: boolean;
  reminderDaysBefore: number; // e.g. 3 days before
  createdAt: number;
  notes?: string;
}

export interface Reminder {
  id: string;
  billId: string;
  billName: string;
  amount: number;
  dueDate: string;
  triggerDate: string; // Date when reminder should fire
  sent: boolean;
  daysBefore: number;
}

export interface StorageInfo {
  usedBytes: number;
  limitBytes: number; // 100MB = 100 * 1024 * 1024 bytes
}
