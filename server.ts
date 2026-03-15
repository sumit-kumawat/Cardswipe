import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import session from 'express-session';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb, User, Card, Transaction, Party } from './src/db';
import { encrypt, decrypt } from './src/utils/encryption';
import { sendVerificationEmail, sendPasswordResetEmail } from './src/utils/email';
import dotenv from 'dotenv';

dotenv.config();

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  const requireVerified = (req: any, res: any, next: any) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user?.isVerified && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Email not verified' });
    }
    next();
  };

  // --- Auth Routes ---
  app.post('/api/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    const db = getDb();
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const newUser: User = {
      id: uuidv4(),
      fullName,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      role: 'user'
    };
    db.users.push(newUser);
    saveDb(db);
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error('Failed to send email', e);
    }
    res.json({ message: 'Registration successful. Please check your email for verification.' });
  });
  
  app.post('/api/resend-verification', requireAuth, async (req: any, res) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Email already verified' });
    
    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    saveDb(db);
    
    try {
      await sendVerificationEmail(user.email, verificationToken);
      res.json({ message: 'Verification email resent successfully.' });
    } catch (e) {
      console.error('Failed to resend email', e);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    console.log(`Verification attempt with token: ${token}`);
    const db = getDb();
    const user = db.users.find(u => u.verificationToken === token);
    if (!user) {
      console.log(`Verification failed: No user found for token ${token}`);
      return res.status(400).send('Invalid or expired verification token.');
    }
    console.log(`Verifying user: ${user.email}`);
    user.isVerified = true;
    delete user.verificationToken;
    saveDb(db);
    console.log(`User ${user.email} verified successfully`);
    // Redirect to home page with a success flag
    res.redirect('/?verified=true');
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Hardcoded Admin
    if (email === 'admin' && password === 'admin') {
      req.session.userId = 'admin-id';
      return res.json({ user: { id: 'admin-id', fullName: 'Administrator', role: 'admin' } });
    }

    const db = getDb();
    const user = db.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, isVerified: user.isVerified, role: user.role } });
  });

  app.get('/api/me', (req: any, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    if (req.session.userId === 'admin-id') {
      return res.json({ id: 'admin-id', fullName: 'Administrator', role: 'admin' });
    }
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, fullName: user.fullName, email: user.email, isVerified: user.isVerified, role: user.role });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });

  app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    saveDb(db);

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (e) {
      console.error('Failed to send reset email', e);
    }
    
    res.json({ message: 'Password reset instructions sent to your email.' });
  });

  app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.resetToken === token);
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    delete user.resetToken;
    saveDb(db);

    res.json({ message: 'Password has been reset successfully.' });
  });

  // --- Party Routes ---
  app.get('/api/parties', requireAuth, (req: any, res) => {
    const db = getDb();
    const parties = db.parties.filter(p => p.userId === req.session.userId);
    res.json(parties);
  });

  app.post('/api/parties', requireAuth, (req: any, res) => {
    const db = getDb();
    const newParty: Party = {
      ...req.body,
      id: uuidv4(),
      userId: req.session.userId,
      createdAt: new Date().toISOString()
    };
    db.parties.push(newParty);
    saveDb(db);
    res.json(newParty);
  });

  // --- Card Routes ---
  app.get('/api/cards', requireAuth, (req: any, res) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    // Allow admin or verified users
    if (req.session.userId !== 'admin-id' && user && !user.isVerified) {
      return res.json([]); // Return empty if not verified
    }
    const cards = db.cards.filter(c => c.userId === req.session.userId).map(c => ({
      ...c,
      cardNumber: decrypt(c.cardNumber),
      cvv: decrypt(c.cvv)
    }));
    res.json(cards);
  });

  app.post('/api/cards', requireAuth, requireVerified, (req: any, res) => {
    const db = getDb();
    try {
      const newCard: Card = {
        ...req.body,
        id: uuidv4(),
        userId: req.session.userId,
        cardNumber: encrypt(req.body.cardNumber),
        cvv: encrypt(req.body.cvv),
        createdAt: new Date().toISOString()
      };
      db.cards.push(newCard);
      saveDb(db);
      res.json(newCard);
    } catch (e) {
      res.status(500).json({ error: 'Failed to save card' });
    }
  });

  app.delete('/api/cards/:id', requireAuth, (req: any, res) => {
    const db = getDb();
    db.cards = db.cards.filter(c => !(c.id === req.params.id && c.userId === req.session.userId));
    db.transactions = db.transactions.filter(t => t.cardId !== req.params.id);
    saveDb(db);
    res.json({ message: 'Card deleted' });
  });

  // --- Transaction Routes ---
  app.get('/api/transactions', requireAuth, (req: any, res) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (req.session.userId !== 'admin-id' && user && !user.isVerified) {
      return res.json([]);
    }
    const transactions = db.transactions.filter(t => t.userId === req.session.userId);
    res.json(transactions);
  });

  app.post('/api/transactions', requireAuth, requireVerified, (req: any, res) => {
    const db = getDb();
    // Interconnectedness check: Must have a card
    const card = db.cards.find(c => c.id === req.body.cardId && c.userId === req.session.userId);
    if (!card) return res.status(400).json({ error: 'Invalid card selected' });

    const newTransaction: Transaction = {
      ...req.body,
      id: uuidv4(),
      userId: req.session.userId,
      createdAt: new Date().toISOString()
    };
    db.transactions.push(newTransaction);
    saveDb(db);
    res.json(newTransaction);
  });

  app.post('/api/settle/:id', requireAuth, (req: any, res) => {
    const db = getDb();
    const transaction = db.transactions.find(t => t.id === req.params.id && t.userId === req.session.userId);
    if (transaction) {
      transaction.isPaid = true;
      saveDb(db);
    }
    res.json({ message: 'Settled' });
  });

  app.get('/api/party-balances', requireAuth, requireVerified, (req: any, res) => {
    const db = getDb();
    const transactions = db.transactions.filter(t => t.userId === req.session.userId && t.partyType !== 'self');
    const parties: any = {};
    transactions.forEach(t => {
      if (!parties[t.partyName]) {
        parties[t.partyName] = { name: t.partyName, totalOwed: 0, transactions: [] };
      }
      if (!t.isPaid) {
        parties[t.partyName].totalOwed += t.amount;
      }
      parties[t.partyName].transactions.push(t);
    });
    res.json(Object.values(parties));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
