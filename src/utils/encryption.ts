import CryptoJS from 'crypto-js';

const getEncryptionKey = (): string => {
  return process.env.ENCRYPTION_KEY || 'ad1be3523f9bc7b8bdedcbe2ecc375850c2e35961bd9c05a974d16dc61259fa7';
};

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, getEncryptionKey()).toString();
};

export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey());
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptData = (data: any): string => {
  return encrypt(JSON.stringify(data));
};

export const decryptData = (ciphertext: string): any => {
  const decrypted = decrypt(ciphertext);
  return decrypted ? JSON.parse(decrypted) : null;
};