import { encryptData, decryptData } from './utils/encryption';
import path from 'path';
import fs from 'fs';

// Define the database structure
export interface User {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  avatar?: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  pendingEmail?: string;
  resetToken?: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export interface Card {
  id: string;
  userId: string;
  cardNumber: string; // Encrypted
  cardholderName: string;
  expiryDate: string;
  cvv: string; // Encrypted
  cardType: string;
  limit: number;
  billingDate: number;
  dueDate: number;
  theme: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  cardId: string;
  amount: number;
  partyType: 'self' | 'individual' | 'business';
  partyName: string;
  partyDetails?: string;
  paymentMode: 'cash' | 'upi' | 'bank_transfer';
  date: string;
  partyDueDate?: string;
  notes?: string;
  attachment?: string; // base64
  isPaid: boolean;
  createdAt: string;
}

export interface Party {
  id: string;
  userId: string;
  type: 'individual' | 'business';
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  createdAt: string;
}

export interface Log {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  cards: Card[];
  transactions: Transaction[];
  parties: Party[];
  logs: Log[];
}

const defaultData: DatabaseSchema = {
  users: [],
  cards: [],
  transactions: [],
  parties: [],
  logs: []
};

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const DB_BACKUP_PATH = path.join(process.cwd(), 'data', 'db.backup.json');

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

let dbInstance: DatabaseSchema | null = null;
let isCorrupted = false;

const loadDb = (): DatabaseSchema => {
  if (!fs.existsSync(DB_PATH)) {
    if (fs.existsSync(DB_BACKUP_PATH)) {
      console.log('DB missing, restoring from backup...');
      const backup = fs.readFileSync(DB_BACKUP_PATH, 'utf-8');
      fs.writeFileSync(DB_PATH, backup, 'utf-8');
    } else {
      saveDb(defaultData);
      return defaultData;
    }
  }
  const encrypted = fs.readFileSync(DB_PATH, 'utf-8');
  if (!encrypted || encrypted.trim() === '') {
    return defaultData;
  }
  try {
    const data = decryptData(encrypted);
    if (!data) {
      throw new Error('Decryption returned null');
    }
    return { ...defaultData, ...data };
  } catch (e) {
    isCorrupted = true;
    console.error('CRITICAL: Failed to decrypt DB. Data may be corrupted or key is incorrect.', e);
    // Try to restore from backup if decryption fails
    if (fs.existsSync(DB_BACKUP_PATH)) {
      console.log('Attempting to restore from backup...');
      const backup = fs.readFileSync(DB_BACKUP_PATH, 'utf-8');
      try {
        const data = decryptData(backup);
        if (data) {
          console.log('Backup restored successfully');
          isCorrupted = false;
          fs.writeFileSync(DB_PATH, backup, 'utf-8');
          return { ...defaultData, ...data };
        }
      } catch (be) {
        console.error('Backup also corrupted or key mismatch', be);
      }
    }
    throw new Error('Database decryption failed. Please check ENCRYPTION_KEY.');
  }
};

export const getDb = (): DatabaseSchema => {
  if (!dbInstance) {
    try {
      dbInstance = loadDb();
    } catch (e) {
      console.error(e);
      dbInstance = { ...defaultData };
    }
  }
  return dbInstance;
};

export const saveDb = (data: DatabaseSchema) => {
  if (isCorrupted) {
    console.error('CRITICAL: Database is in corrupted state. Saving is disabled to prevent data loss.');
    return;
  }
  dbInstance = data;
  const encrypted = encryptData(data);
  fs.writeFileSync(DB_PATH, encrypted, 'utf-8');
  // Also save a backup every time we save successfully
  fs.writeFileSync(DB_BACKUP_PATH, encrypted, 'utf-8');
};
