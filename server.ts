import 'dotenv/config';
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
    if (req.session.userId === 'admin-id') return next();
    if (!user?.isVerified && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Email not verified' });
    }
    next();
  };

  // Middleware to check admin
  const isAdmin = (userId: string | undefined) => {
    if (!userId) return false;
    if (userId === 'admin-id') return true;
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if (user?.role === 'admin') return true;
    // Default admin from runtime context - strictly limited to these emails
    const adminEmails = ['sukumawa45@gmail.com', 'kumawatsumit45@gmail.com'];
    if (user && adminEmails.includes(user.email)) return true;
    return false;
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!isAdmin(req.session.userId)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  };

  const logActivity = (userId: string, action: string, details: string, req: any) => {
    const db = getDb();
    let userEmail = 'system';
    if (userId === 'admin-id') {
      userEmail = 'admin';
    } else {
      const user = db.users.find(u => u.id === userId);
      if (user) userEmail = user.email;
    }

    const log: any = {
      id: uuidv4(),
      userId,
      userEmail,
      action,
      details,
      type: action.includes('ADMIN') || action.includes('CLEAR') ? 'admin' : 
            action.includes('LOGIN') || action.includes('REGISTER') || action.includes('VERIFY') || action.includes('PASSWORD') ? 'auth' : 'activity',
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    db.logs.push(log);
    saveDb(db);
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
    logActivity(newUser.id, 'REGISTER', 'User registered', req);
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
    if (user.pendingEmail) {
      user.email = user.pendingEmail;
      delete user.pendingEmail;
    }
    user.isVerified = true;
    delete user.verificationToken;
    saveDb(db);
    logActivity(user.id, 'VERIFY_EMAIL', 'Email verified successfully', req);
    console.log(`User ${user.email} verified successfully`);
    // Redirect to home page with a success flag
    res.redirect('/?verified=true');
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Hardcoded Admin
    if (email === 'admin' && password === 'admin') {
      req.session.userId = 'admin-id';
      logActivity('admin-id', 'LOGIN', 'Admin logged in', req);
      return res.json({ user: { id: 'admin-id', fullName: 'Administrator', role: 'admin', isVerified: true } });
    }

    const db = getDb();
    const user = db.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logActivity('unknown', 'LOGIN_FAILED', `Failed login attempt for ${email}`, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified && !isAdmin(user.id)) {
      return res.status(403).json({ error: 'Email not verified. Please check your inbox or resend verification email.', unverified: true });
    }

    req.session.userId = user.id;
    logActivity(user.id, 'LOGIN', 'User logged in', req);
    const role = isAdmin(user.id) ? 'admin' : user.role;
    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, isVerified: user.isVerified, role } });
  });

  app.post('/api/resend-verification-public', async (req, res) => {
    const { email } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Email already verified' });
    
    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    saveDb(db);
    
    try {
      await sendVerificationEmail(user.email, verificationToken);
      res.json({ message: 'Verification email sent successfully.' });
    } catch (e) {
      console.error('Failed to resend email', e);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  app.get('/api/me', requireAuth, (req: any, res) => {
    if (req.session.userId === 'admin-id') {
      return res.json({ id: 'admin-id', fullName: 'Administrator', role: 'admin', isVerified: true });
    }
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const role = isAdmin(user.id) ? 'admin' : user.role;
    res.json({ 
      id: user.id, 
      fullName: user.fullName, 
      email: user.email, 
      phone: user.phone,
      avatar: user.avatar,
      isVerified: user.isVerified, 
      role
    });
  });

  app.post('/api/logout', (req: any, res) => {
    const userId = req.session.userId;
    req.session.destroy(() => {
      if (userId) logActivity(userId, 'LOGOUT', 'User logged out', req);
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
    user.isVerified = true; // Automatically verify if they reset via email link
    delete user.resetToken;
    delete user.verificationToken;
    saveDb(db);
    logActivity(user.id, 'RESET_PASSWORD', 'Password reset via token', req);
    res.json({ message: 'Password has been reset successfully.' });
  });

  // --- Profile Routes ---
  app.post('/api/profile', requireAuth, requireVerified, async (req: any, res) => {
    const { fullName, phone, avatar } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    
    saveDb(db);
    logActivity(user.id, 'UPDATE_PROFILE', 'Profile updated', req);
    res.json({ message: 'Profile updated successfully', user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, avatar: user.avatar, isVerified: user.isVerified, role: user.role } });
  });

  app.post('/api/update-email', requireAuth, requireVerified, async (req: any, res) => {
    const { email } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (db.users.find(u => u.email === email && u.id !== user.id)) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const verificationToken = uuidv4();
    user.email = email;
    user.isVerified = false;
    user.verificationToken = verificationToken;
    saveDb(db);

    logActivity(user.id, 'UPDATE_EMAIL', `Email changed to ${email}, verification required`, req);
    
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error('Failed to send verification email', e);
    }

    res.json({ message: 'Email updated. Please verify your new email address.' });
  });

  app.post('/api/update-password', requireAuth, requireVerified, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: 'Current password incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    saveDb(db);
    logActivity(user.id, 'UPDATE_PASSWORD', 'Password updated', req);
    res.json({ message: 'Password updated successfully' });
  });

  // --- Admin Routes ---
  app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
    const db = getDb();
    res.json(db.users.map(u => {
      const { password, ...rest } = u;
      return rest;
    }));
  });

  app.get('/api/admin/logs', requireAuth, requireAdmin, (req, res) => {
    const db = getDb();
    res.json(db.logs.slice().reverse());
  });

  app.post('/api/admin/clear-logs', requireAuth, requireAdmin, (req: any, res) => {
    const db = getDb();
    db.logs = [];
    saveDb(db);
    logActivity(req.session.userId, 'CLEAR_LOGS', 'Admin cleared all logs', req);
    res.json({ message: 'Logs cleared' });
  });

  app.post('/api/admin/user/:id/reset-password', requireAuth, requireAdmin, async (req: any, res) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newPassword = Math.random().toString(36).slice(-8);
    user.password = await bcrypt.hash(newPassword, 10);
    saveDb(db);
    logActivity(req.session.userId, 'ADMIN_RESET_PASSWORD', `Admin reset password for ${user.email}`, req);
    res.json({ message: `Password reset to: ${newPassword}`, temporaryPassword: newPassword });
  });

  app.post('/api/admin/user/:id/toggle-admin', requireAuth, requireAdmin, (req: any, res: any) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent self-demotion
    if (user.id === req.session.userId) {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }

    user.role = user.role === 'admin' ? 'user' : 'admin';
    saveDb(db);
    logActivity(req.session.userId, 'ADMIN_TOGGLE_ROLE', `Admin toggled role for ${user.email} to ${user.role}`, req);
    res.json({ message: `User role updated to ${user.role}`, role: user.role });
  });

  app.post('/api/admin/user/:id/update', requireAuth, requireAdmin, (req: any, res) => {
    const db = getDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { fullName, role, isVerified } = req.body;
    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

    saveDb(db);
    logActivity(req.session.userId, 'ADMIN_UPDATE_USER', `Admin updated user ${user.email}`, req);
    res.json({ message: 'User updated successfully' });
  });

  app.delete('/api/admin/user/:id', requireAuth, requireAdmin, (req: any, res) => {
    const db = getDb();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const user = db.users[userIndex];
    db.users.splice(userIndex, 1);
    // Clean up user data
    db.cards = db.cards.filter(c => c.userId !== req.params.id);
    db.transactions = db.transactions.filter(t => t.userId !== req.params.id);
    db.parties = db.parties.filter(p => p.userId !== req.params.id);
    
    saveDb(db);
    logActivity(req.session.userId, 'ADMIN_DELETE_USER', `Admin deleted user ${user.email}`, req);
    res.json({ message: 'User and all associated data deleted' });
  });

  app.get('/api/admin/user/:id/cards', requireAuth, requireAdmin, (req, res) => {
    const db = getDb();
    const cards = db.cards.filter(c => c.userId === req.params.id);
    res.json(cards);
  });

  app.get('/api/admin/user/:id/transactions', requireAuth, requireAdmin, (req, res) => {
    const db = getDb();
    const transactions = db.transactions.filter(t => t.userId === req.params.id);
    res.json(transactions);
  });

  // --- Party Routes ---
  app.get('/api/parties', requireAuth, requireVerified, (req: any, res) => {
    const db = getDb();
    const parties = db.parties.filter(p => p.userId === req.session.userId);
    res.json(parties);
  });

  app.post('/api/parties', requireAuth, requireVerified, (req: any, res) => {
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
  app.get('/api/cards', requireAuth, requireVerified, (req: any, res) => {
    const db = getDb();
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

  app.delete('/api/cards/:id', requireAuth, requireVerified, (req: any, res) => {
    const db = getDb();
    db.cards = db.cards.filter(c => !(c.id === req.params.id && c.userId === req.session.userId));
    db.transactions = db.transactions.filter(t => t.cardId !== req.params.id);
    saveDb(db);
    res.json({ message: 'Card deleted' });
  });

  // --- Transaction Routes ---
  app.get('/api/transactions', requireAuth, requireVerified, (req: any, res) => {
    const db = getDb();
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

  app.post('/api/settle/:id', requireAuth, requireVerified, (req: any, res) => {
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