import { encryptData, decryptData } from './utils/encryption';
import path from 'path';
import fs from 'fs';

// Define the database structure
export interface User {
  id: string;
  fullName: string;
  email: string;
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

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

export const getDb = (): DatabaseSchema => {
  if (!fs.existsSync(DB_PATH)) {
    saveDb(defaultData);
    return defaultData;
  }
  const encrypted = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    const data = decryptData(encrypted);
    return { ...defaultData, ...data };
  } catch (e) {
    console.error('Failed to decrypt DB, returning default', e);
    return defaultData;
  }
};

export const saveDb = (data: DatabaseSchema) => {
  const encrypted = encryptData(data);
  fs.writeFileSync(DB_PATH, encrypted, 'utf-8');
};
