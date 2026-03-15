import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-dev';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptData = (data: any): string => {
  return encrypt(JSON.stringify(data));
};

export const decryptData = (ciphertext: string): any => {
  const decrypted = decrypt(ciphertext);
  return decrypted ? JSON.parse(decrypted) : null;
};
