import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Building2, 
  User, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Download,
  Filter,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  Link,
  useSearchParams
} from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { format, isAfter, addDays, differenceInDays } from 'date-fns';
import { cn, formatCurrency, formatCardNumber, formatExpiryDate } from './utils/ui';

// --- Types ---
interface UserData {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  role: string;
}

interface Card {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  cardType: string;
  limit: number;
  billingDate: number;
  dueDate: number;
  theme: string;
}

interface Transaction {
  id: string;
  cardId: string;
  amount: number;
  partyType: 'self' | 'individual' | 'business';
  partyName: string;
  paymentMode: string;
  date: string;
  isPaid: boolean;
  notes?: string;
}

interface Party {
  id: string;
  type: 'individual' | 'business';
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  businessName?: string;
}

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants: any = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50', variants[variant], className)} 
      {...props} 
    />
  );
};

const Input = ({ label, error, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      className={cn(
        "w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all",
        error && "border-red-500 ring-red-200"
      )} 
      {...props} 
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// --- Pages ---

const Login = ({ onLogin }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowForgot(false);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-gray-500 mt-2">Enter your email to receive reset instructions</p>
          </div>
          <form onSubmit={handleForgot} className="space-y-4">
            <Input 
              label="Email Address" 
              type="email" 
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />
            <Button className="w-full py-3" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
              Back to Login
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-gray-100"
      >
        <div className="mb-8 flex justify-center">
          <img src="https://cdn.conzex.com/files/logo/circle-icon.png" alt="CardSwipe Logo" className="w-16 h-16" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Welcome Back</h1>
        <p className="text-gray-500 mt-2 mb-8">Sign in to manage your credit cards</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input 
            label="Email Address" 
            type="text" 
            placeholder="admin or your email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />
          <Button className="w-full py-3" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
          <div className="text-center">
            <button 
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-primary font-medium hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register now</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        navigate('/login');
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-gray-100"
      >
        <div className="mb-8 flex justify-center">
          <img src="https://cdn.conzex.com/files/logo/circle-icon.png" alt="CardSwipe Logo" className="w-16 h-16" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Create Account</h1>
        <p className="text-gray-500 mt-2 mb-8">Start managing your cards professionally</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input 
            label="Full Name" 
            value={form.fullName}
            onChange={(e: any) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <Input 
            label="Email Address" 
            type="email"
            value={form.email}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input 
            label="Password" 
            type="password"
            value={form.password}
            onChange={(e: any) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button className="w-full py-3" disabled={loading}>
            {loading ? 'Registering...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, setUser }: { user: UserData, setUser: (u: UserData | null) => void }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const verified = searchParams.get('verified');

  const checkVerificationStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        if (data.isVerified) {
          setUser(data);
          toast.success('Email verified successfully!');
          setSearchParams({});
        } else {
          toast.error('Email still not verified. Please check your inbox.');
        }
      }
    } catch (e) {
      toast.error('Failed to check status');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchData = async () => {
    try {
      // If we just verified via redirect, check status
      if (verified === 'true') {
        const meRes = await fetch('/api/me');
        if (meRes.ok) {
          const userData = await meRes.json();
          if (userData.isVerified) {
            setUser(userData);
            toast.success('Email verified successfully!');
            setSearchParams({});
            return;
          }
        }
      }

      const [cardsRes, transRes, partiesRes] = await Promise.all([
        fetch('/api/cards'),
        fetch('/api/transactions'),
        fetch('/api/parties')
      ]);
      if (cardsRes.ok) setCards(await cardsRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
      if (partiesRes.ok) setParties(await partiesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh user data if not verified to catch verification from another tab
    let interval: any;
    if (!user.isVerified && user.role !== 'admin') {
      interval = setInterval(async () => {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          if (data.isVerified) {
            setUser(data);
            toast.success('Email verified!');
          }
        }
      }, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const totalUsed = transactions.reduce((sum, t) => sum + t.amount, 0);
  const recoverable = transactions.filter(t => t.partyType !== 'self' && !t.isPaid).reduce((sum, t) => sum + t.amount, 0);

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, 'yyyy-MM-dd');
  }).reverse();

  const spendingData = last7Days.map(date => {
    const dayTotal = transactions
      .filter(t => format(new Date(t.date), 'yyyy-MM-dd') === date)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(new Date(date), 'dd MMM'),
      amount: dayTotal
    };
  });

  const categoryData = [
    { name: 'Self', value: transactions.filter(t => t.partyType === 'self').reduce((sum, t) => sum + t.amount, 0), color: '#0F172B' },
    { name: 'Individual', value: transactions.filter(t => t.partyType === 'individual').reduce((sum, t) => sum + t.amount, 0), color: '#10B981' },
    { name: 'Business', value: transactions.filter(t => t.partyType === 'business').reduce((sum, t) => sum + t.amount, 0), color: '#F59E0B' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!user.isVerified && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-gray-100">
          <div className="mb-6 flex justify-center">
            <img src="https://cdn.conzex.com/files/logo/circle-icon.png" alt="CardSwipe Logo" className="w-16 h-16" referrerPolicy="no-referrer" />
          </div>
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary">Verify Your Email</h1>
          <p className="text-gray-500 mt-2">We've sent a verification link to {user.email}. Please verify your email to access the dashboard.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button 
              onClick={checkVerificationStatus} 
              disabled={refreshing}
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl py-3 h-auto font-bold"
            >
              {refreshing ? 'Checking...' : "I've Verified"}
            </Button>
            <Button 
              variant="secondary" 
              className="rounded-2xl py-3 h-auto font-medium"
              onClick={async () => {
              try {
                const res = await fetch('/api/resend-verification', { method: 'POST' });
                const data = await res.json();
                if (res.ok) toast.success(data.message);
                else toast.error(data.error);
              } catch (e) {
                toast.error('Failed to resend email');
              }
            }}>Resend Verification Email</Button>
            <Button 
              variant="ghost" 
              className="rounded-2xl py-3 h-auto font-medium"
              onClick={async () => {
              await fetch('/api/logout', { method: 'POST' });
              window.location.href = '/login';
            }}>Sign Out & Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://cdn.conzex.com/files/logo/circle-icon.png" alt="CardSwipe Logo" className="w-8 h-8" referrerPolicy="no-referrer" />
            <span className="font-bold text-xl tracking-tight text-primary hidden sm:block">CardSwipe</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <Button variant="ghost" className="p-2" onClick={async () => {
              await fetch('/api/logout', { method: 'POST' });
              window.location.href = '/login';
            }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Cards', value: cards.length, icon: CreditCard, color: 'primary' },
            { label: 'Total Limit', value: formatCurrency(totalLimit), icon: ArrowUpRight, color: 'emerald' },
            { label: 'Total Used', value: formatCurrency(totalUsed), icon: ArrowDownLeft, color: 'rose' },
            { label: 'Recoverable', value: formatCurrency(recoverable), icon: Users, color: 'amber' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4", 
                stat.color === 'primary' ? "bg-primary/10 text-primary" : `bg-${stat.color}-50 text-${stat.color}-600`
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Spending Overview</h3>
                <p className="text-sm text-gray-500">Last 7 days activity</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>Live</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172B" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0F172B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0F172B" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Spending by Category</h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-gray-500 font-medium">Total Spent</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalUsed)}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Your Cards</h2>
            <Button onClick={() => setShowAddCard(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-2.5 h-auto">
              <Plus className="w-4 h-4" /> Add Card
            </Button>
          </div>
          
          {cards.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No cards added yet. Start by adding your first card.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => {
                const cardUsed = transactions.filter(t => t.cardId === card.id).reduce((sum, t) => sum + t.amount, 0);
                const percent = Math.min((cardUsed / card.limit) * 100, 100);
                
                return (
                  <motion.div 
                    key={card.id}
                    layoutId={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={cn(
                      "relative overflow-hidden p-8 rounded-[2.5rem] text-white cursor-pointer shadow-2xl transition-all hover:scale-[1.02] hover:shadow-primary/20",
                      card.theme || "bg-primary"
                    )}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-xs opacity-70 uppercase tracking-wider">{card.cardType}</p>
                        <p className="text-lg font-bold mt-1">•••• •••• •••• {card.cardNumber.slice(-4)}</p>
                      </div>
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <CreditCard className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Used: {formatCurrency(cardUsed)}</span>
                        <span>Limit: {formatCurrency(card.limit)}</span>
                      </div>
                      <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="font-medium">{card.cardholderName}</p>
                        <p className="text-sm opacity-70">{card.expiryDate}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions & Reminders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="md:col-span-1 lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Transactions</h2>
              <Button variant="secondary" onClick={() => setShowAddTransaction(true)} className="rounded-2xl px-6 py-2 h-auto">Add Transaction</Button>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[200px] flex flex-col">
              <div className="divide-y divide-gray-50 flex-1">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className={cn(
                    "p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-l-4",
                    t.partyType === 'self' ? "border-blue-500" : 
                    t.partyType === 'individual' ? "border-emerald-500" : "border-orange-500"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        t.partyType === 'self' ? "bg-blue-50 text-blue-600" : 
                        t.partyType === 'individual' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                      )}>
                        {t.partyType === 'self' ? <User className="w-5 h-5" /> : 
                         t.partyType === 'individual' ? <Users className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{t.partyName}</p>
                        <p className="text-xs text-gray-500">{format(new Date(t.date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(t.amount)}</p>
                      <p className={cn("text-xs font-medium", t.isPaid ? "text-emerald-600" : "text-amber-600")}>
                        {t.isPaid ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                    <Clock className="w-12 h-12 mb-4 opacity-20" />
                    <p>No recent transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold">Upcoming Dues</h2>
            <div className="space-y-4 min-h-[200px]">
              {cards.filter(card => {
                const today = new Date();
                const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), card.dueDate);
                const diff = differenceInDays(dueThisMonth, today);
                return diff >= 0;
              }).length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center text-gray-400 h-full">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p>No upcoming dues</p>
                </div>
              ) : (
                cards.map(card => {
                  const today = new Date();
                  const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), card.dueDate);
                  const diff = differenceInDays(dueThisMonth, today);
                  if (diff < 0) return null;
                  
                  return (
                    <div key={card.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white",
                        diff < 3 ? "bg-rose-500" : diff < 7 ? "bg-amber-500" : "bg-emerald-500"
                      )}>
                        <span className="text-xs font-bold uppercase">{format(dueThisMonth, 'MMM')}</span>
                        <span className="text-lg font-bold leading-none">{card.dueDate}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{card.cardType} Bill</p>
                        <p className="text-xs text-gray-500">{diff} days remaining</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAddCard && (
          <AddCardModal onClose={() => setShowAddCard(false)} onAdd={fetchData} />
        )}
        {showAddTransaction && (
          <AddTransactionModal cards={cards} parties={parties} onAddParty={() => setShowAddParty(true)} onClose={() => setShowAddTransaction(false)} onAdd={fetchData} />
        )}
        {showAddParty && (
          <AddPartyModal onClose={() => setShowAddParty(false)} onAdd={fetchData} />
        )}
        {selectedCard && (
          <CardDetailsModal 
            card={selectedCard} 
            transactions={transactions.filter(t => t.cardId === selectedCard.id)}
            onClose={() => setSelectedCard(null)} 
            onUpdate={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AddCardModal = ({ onClose, onAdd }: any) => {
  const [form, setForm] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    cardType: 'Visa (Credit)',
    limit: '',
    billingDate: '1',
    dueDate: '20',
    theme: 'bg-primary'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...form, 
        cardType: form.cardType === 'Other' ? (form as any).customCardType : form.cardType,
        limit: Number(form.limit), 
        billingDate: Number(form.billingDate), 
        dueDate: Number(form.dueDate) 
      })
    });
    if (res.ok) {
      toast.success('Card added!');
      onAdd();
      onClose();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to add card');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Add New Card</h2>
            <Button variant="ghost" onClick={onClose} className="p-2"><X /></Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input 
                  label="Card Number" 
                  placeholder="0000 0000 0000 0000"
                  value={form.cardNumber}
                  onChange={(e: any) => setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })}
                  maxLength={19}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input 
                  label="Cardholder Name" 
                  placeholder="JOHN DOE"
                  value={form.cardholderName}
                  onChange={(e: any) => setForm({ ...form, cardholderName: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <Input 
                label="Expiry Date" 
                placeholder="MM/YY"
                value={form.expiryDate}
                onChange={(e: any) => setForm({ ...form, expiryDate: formatExpiryDate(e.target.value) })}
                maxLength={5}
                required
              />
              <Input 
                label="CVV" 
                type="password"
                placeholder="•••"
                value={form.cvv}
                onChange={(e: any) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '') })}
                maxLength={4}
                required
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Card Type</label>
                <select 
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none"
                  value={form.cardType}
                  onChange={(e) => setForm({ ...form, cardType: e.target.value })}
                >
                  <option>Visa (Credit)</option>
                  <option>Mastercard (Credit)</option>
                  <option>RuPay (Credit)</option>
                  <option>American Express</option>
                  <option>HDFC Bank</option>
                  <option>SBI Card</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Other</option>
                </select>
              </div>
              {form.cardType === 'Other' && (
                <div className="sm:col-span-2">
                  <Input 
                    label="Custom Card Type" 
                    placeholder="Enter card type name"
                    value={(form as any).customCardType || ''}
                    onChange={(e: any) => setForm({ ...form, customCardType: e.target.value } as any)}
                    required
                  />
                </div>
              )}
              <Input 
                label="Limit (₹)" 
                type="number"
                value={form.limit}
                onChange={(e: any) => setForm({ ...form, limit: e.target.value })}
                required
              />
              <Input 
                label="Billing Date (1-31)" 
                type="number"
                min="1" max="31"
                value={form.billingDate}
                onChange={(e: any) => setForm({ ...form, billingDate: e.target.value })}
                required
              />
              <Input 
                label="Due Date (1-31)" 
                type="number"
                min="1" max="31"
                value={form.dueDate}
                onChange={(e: any) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Theme</label>
              <div className="flex flex-wrap gap-3">
                {['bg-primary', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-slate-800', 'bg-gradient-to-br from-purple-600 to-blue-500'].map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, theme: t })}
                    className={cn("w-8 h-8 rounded-full border-2", t, form.theme === t ? "border-primary/50 scale-110" : "border-transparent")}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="w-8 h-8 rounded-full border-none cursor-pointer"
                    onChange={(e) => setForm({ ...form, theme: `bg-[${e.target.value}]` })}
                  />
                  <span className="text-xs text-gray-500">Custom</span>
                </div>
              </div>
            </div>

            <Button className="w-full py-3 mt-4">Save Card</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const AddTransactionModal = ({ cards, parties, onAddParty, onClose, onAdd }: any) => {
  const [form, setForm] = useState({
    cardId: cards[0]?.id || '',
    amount: '',
    partyType: 'self',
    partyId: '',
    partyName: 'Self',
    paymentMode: 'upi',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  useEffect(() => {
    if (cards.length > 0 && !form.cardId) {
      setForm(prev => ({ ...prev, cardId: cards[0].id }));
    }
  }, [cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cards.length === 0) {
      toast.error('Please add a card first');
      return;
    }
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount), isPaid: form.partyType === 'self' })
    });
    if (res.ok) {
      toast.success('Transaction added!');
      onAdd();
      onClose();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to add transaction');
    }
  };

  const filteredParties = parties.filter((p: any) => p.type === form.partyType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Transaction</h2>
          <Button variant="ghost" onClick={onClose} className="p-2"><X /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Select Card</label>
            <select 
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none"
              value={form.cardId}
              onChange={(e) => setForm({ ...form, cardId: e.target.value })}
              required
            >
              <option value="">Select a card</option>
              {cards.map((c: any) => (
                <option key={c.id} value={c.id}>{c.cardType} - {c.cardNumber.slice(-4)}</option>
              ))}
            </select>
          </div>

          <Input 
            label="Amount (₹)" 
            type="number"
            value={form.amount}
            onChange={(e: any) => setForm({ ...form, amount: e.target.value })}
            required
          />

          <div className="grid grid-cols-3 gap-2">
            {['self', 'individual', 'business'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, partyType: type as any, partyName: type === 'self' ? 'Self' : '', partyId: '' })}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all",
                  form.partyType === type ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {form.partyType !== 'self' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Select {form.partyType}</label>
                <button 
                  type="button" 
                  onClick={onAddParty}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  + Create Profile
                </button>
              </div>
              <select 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none"
                value={form.partyId}
                onChange={(e) => {
                  const party = parties.find((p: any) => p.id === e.target.value);
                  setForm({ ...form, partyId: e.target.value, partyName: party ? `${party.firstName} ${party.lastName}` : '' });
                }}
                required
              >
                <option value="">Select {form.partyType}</option>
                {filteredParties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} {p.businessName ? `(${p.businessName})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Payment Mode</label>
              <select 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none"
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <Input 
              label="Date" 
              type="date"
              value={form.date}
              onChange={(e: any) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <Input 
            label="Notes" 
            value={form.notes}
            onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
          />

          <Button className="w-full py-3 mt-4">Add Transaction</Button>
        </form>
      </motion.div>
    </div>
  );
};

const AddPartyModal = ({ onClose, onAdd }: any) => {
  const [form, setForm] = useState({
    type: 'individual',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    businessName: '',
    gstNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success('Profile created!');
      onAdd();
      onClose();
    } else {
      toast.error('Failed to create profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Profile</h2>
          <Button variant="ghost" onClick={onClose} className="p-2"><X /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-4">
            {['individual', 'business'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type: type as any })}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                  form.type === type ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="First Name" 
              value={form.firstName}
              onChange={(e: any) => setForm({ ...form, firstName: e.target.value })}
              required
            />
            <Input 
              label="Last Name" 
              value={form.lastName}
              onChange={(e: any) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>

          <Input 
            label="Phone Number" 
            type="tel"
            value={form.phone}
            onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
            required
          />

          <Input 
            label="Email (Optional)" 
            type="email"
            value={form.email}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
          />

          {form.type === 'business' && (
            <>
              <Input 
                label="Business Name" 
                value={form.businessName}
                onChange={(e: any) => setForm({ ...form, businessName: e.target.value })}
                required
              />
              <Input 
                label="GST Number (Optional)" 
                value={form.gstNumber}
                onChange={(e: any) => setForm({ ...form, gstNumber: e.target.value })}
              />
            </>
          )}

          <Button className="w-full py-3 mt-4">Create Profile</Button>
        </form>
      </motion.div>
    </div>
  );
};

const CardDetailsModal = ({ card, transactions, onClose, onUpdate }: any) => {
  const [showFullNumber, setShowFullNumber] = useState(false);
  const cardUsed = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
  const recoverable = transactions.filter((t: any) => t.partyType !== 'self' && !t.isPaid).reduce((sum: number, t: any) => sum + t.amount, 0);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this card and all its transactions?')) {
      const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Card deleted');
        onUpdate();
        onClose();
      }
    }
  };

  const handleSettle = async (id: string) => {
    const res = await fetch(`/api/settle/${id}`, { method: 'POST' });
    if (res.ok) {
      toast.success('Settled!');
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        layoutId={card.id}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className={cn("p-8 text-white relative", card.theme)}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold">{card.cardType}</h2>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xl font-mono tracking-widest">
                  {showFullNumber ? card.cardNumber : `•••• •••• •••• ${card.cardNumber.slice(-4)}`}
                </p>
                <button onClick={() => setShowFullNumber(!showFullNumber)} className="p-1 hover:bg-white/20 rounded-lg">
                  {showFullNumber ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2 text-white hover:bg-white/20"><X /></Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="opacity-70">Limit</p>
              <p className="text-lg font-bold">{formatCurrency(card.limit)}</p>
            </div>
            <div>
              <p className="opacity-70">Used</p>
              <p className="text-lg font-bold">{formatCurrency(cardUsed)}</p>
            </div>
            <div>
              <p className="opacity-70">Recoverable</p>
              <p className="text-lg font-bold">{formatCurrency(recoverable)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Transaction History</h3>
            <div className="flex gap-2">
              <Button variant="secondary" className="p-2" title="Export CSV"><Download size={18} /></Button>
              <Button variant="danger" className="p-2" onClick={handleDelete}><Trash2 size={18} /></Button>
            </div>
          </div>

          <div className="space-y-4">
            {transactions.map((t: any) => (
              <div key={t.id} className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    t.partyType === 'self' ? "bg-blue-100 text-blue-600" : 
                    t.partyType === 'individual' ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {t.partyType === 'self' ? <User size={20} /> : 
                     t.partyType === 'individual' ? <Users size={20} /> : <Building2 size={20} />}
                  </div>
                  <div>
                    <p className="font-bold">{t.partyName}</p>
                    <p className="text-xs text-gray-500">{format(new Date(t.date), 'dd MMM yyyy')} • {t.paymentMode.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-bold">{formatCurrency(t.amount)}</p>
                    <p className={cn("text-xs font-medium", t.isPaid ? "text-emerald-600" : "text-amber-600")}>
                      {t.isPaid ? 'Settled' : 'Pending'}
                    </p>
                  </div>
                  {!t.isPaid && t.partyType !== 'self' && (
                    <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => handleSettle(t.id)}>Settle</Button>
                  )}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12 text-gray-400">No transactions for this card</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    if (res.ok) {
      toast.success('Password reset successfully!');
      navigate('/login');
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to reset password');
    }
    setLoading(false);
  };

  if (!token) return <div className="p-8 text-center">Invalid reset link</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-xl p-10"
      >
        <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-500 mb-8">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="New Password" 
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />
          <Input 
            label="Confirm New Password" 
            type="password"
            value={confirmPassword}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
            required
          />
          <Button className="w-full py-4 text-lg" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
