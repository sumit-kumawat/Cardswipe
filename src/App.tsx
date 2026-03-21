import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  Download,
  Filter,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Activity,
  TrendingUp,
  LayoutDashboard,
  UserCircle,
  PlusCircle,
  UserPlus,
  Info,
  Wallet,
  Edit,
  Trash
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
  username: string;
  isVerified: boolean;
  role: string;
}

interface Card {
  id: string;
  cardNumber: string;
  cardName: string;
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

// --- Utils ---
const isUserAdmin = (user: UserData | null) => {
  if (!user) return false;
  const adminEmails = ['sukumawa45@gmail.com', 'kumawatsumit45@gmail.com'];
  return (adminEmails.includes(user.email) || user.username === 'admin') && user.isVerified;
};

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants: any = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20',
    secondary: 'bg-white text-[#54656f] border border-[#d1d7db] hover:bg-[#f0f2f5]',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20',
    ghost: 'bg-transparent hover:bg-black/5 text-[#54656f]',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20',
  };
  return (
    <button 
      className={cn(
        'px-6 py-2.5 rounded-[10px] font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2', 
        variants[variant], 
        className
      )} 
      {...props} 
    />
  );
};

const Input = ({ label, error, icon: Icon, ...props }: any) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-bold text-[#667781] uppercase tracking-wider ml-1">{label}</label>}
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8696a0] group-focus-within:text-primary transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input 
        className={cn(
          "w-full px-4 py-3 bg-white border border-[#e9edef] rounded-[10px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm placeholder:text-[#8696a0]",
          Icon && "pl-11",
          error && "border-rose-500 ring-rose-200",
          props.type === 'date' && "appearance-none cursor-pointer"
        )} 
        {...props} 
      />
    </div>
    {error && <p className="text-[10px] font-bold text-rose-500 ml-1">{error}</p>}
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-bold text-[#667781] uppercase tracking-wider ml-1">{label}</label>}
    <select 
      className="w-full px-4 py-3 bg-white border border-[#e9edef] rounded-[10px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-[#54656f]"
      {...props}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const StatCard = ({ title, value, icon, trend, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  
  return (
    <div className="bg-white p-6 rounded-[10px] shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-[10px]", colors[color] || colors.blue)}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-[10px]">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, collapsed, onClick }: any) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-[10px] transition-all duration-200 group relative",
        active 
          ? "bg-[#202C33] text-white shadow-lg" 
          : "text-[#AEBAC1] hover:bg-[#202C33] hover:text-white",
        collapsed && "justify-center px-0"
      )}
    >
      <div className={cn(
        "flex items-center justify-center transition-transform group-hover:scale-110",
        active ? "text-primary" : ""
      )}>
        {icon}
      </div>
      {!collapsed && (
        <span className="text-sm font-bold truncate">{label}</span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-[#202C33] text-white text-xs rounded-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </button>
  );
};

// --- Pages ---

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-quicksand">
      <header className="sticky top-0 z-50 bg-white border-b border-[#e9edef] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src="https://cdn.conzex.com/files/logo/circle-icon.png" 
            alt="CardSwipe Logo" 
            className="w-10 h-10 rounded-[10px]"
            referrerPolicy="no-referrer"
          />
          <span className="text-xl font-bold text-[#111b21] tracking-tight">CardSwipe</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="sticky bottom-0 z-50 bg-white border-t border-[#e9edef] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-sm text-[#667781]">
          © CardSwipe. All rights reserved.
        </p>
        <div className="text-sm">
          <a 
            href="https://www.conzex.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary font-bold hover:underline"
          >
            A Conzex Global Product
          </a>
        </div>
      </footer>
    </div>
  );
};

const Login = ({ onLogin }: any) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        if (data.unverified) {
          setUnverifiedEmail(identifier);
        }
        toast.error(data.error || 'Login failed');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setLoading(true);
    try {
      const res = await fetch('/api/resend-verification-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUnverifiedEmail(null);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Failed to resend email');
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
        body: JSON.stringify({ identifier })
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
      <PublicLayout>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-[10px] shadow-xl border border-[#e9edef]"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-[10px] flex items-center justify-center mx-auto mb-4">
              <Key size={32} />
            </div>
            <h1 className="text-2xl font-bold text-[#111b21]">Forgot Password</h1>
            <p className="text-[#667781] mt-2 text-sm">Enter your email or username to receive reset instructions</p>
          </div>
          <form onSubmit={handleForgot} className="space-y-4">
            <Input 
              label="Email or Username" 
              type="text" 
              icon={User}
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(e: any) => setIdentifier(e.target.value)}
              required
            />
            <Button className="w-full py-3.5" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
              Back to Login
            </Button>
          </form>
        </motion.div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[10px] shadow-xl border border-[#e9edef]"
      >
        <div className="mb-8 flex flex-col items-center">
          <img 
            src="https://cdn.conzex.com/files/logo/circle-icon.png" 
            alt="CardSwipe Logo" 
            className="w-20 h-20 rounded-[10px] shadow-lg shadow-primary/20 mb-4"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-bold text-[#111b21] tracking-tight">Sign In</h1>
          <p className="text-[#667781] mt-1 text-sm">Access your CardSwipe account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <Input 
            label="Email or Username" 
            type="text" 
            icon={User}
            placeholder="Enter your email or username"
            value={identifier}
            onChange={(e: any) => setIdentifier(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />
          
          <Button className="w-full py-4 rounded-[10px] text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          {unverifiedEmail && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-50 rounded-[10px] border border-amber-100 text-center"
            >
              <p className="text-xs text-amber-800 mb-3 font-bold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Email not verified yet
              </p>
              <Button 
                type="button"
                variant="secondary" 
                className="w-full py-2 text-[10px] font-bold rounded-[10px] uppercase tracking-wider"
                onClick={handleResend}
                disabled={loading}
              >
                Resend Verification Email
              </Button>
            </motion.div>
          )}

          <div className="text-center">
            <button 
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-primary font-bold hover:text-primary-dark transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <div className="mt-10 pt-8 border-t border-[#e9edef] text-center">
          <p className="text-sm text-[#667781]">
            Don't have an account? <Link to="/register" className="text-primary font-bold hover:text-primary-dark transition-colors">Create Account</Link>
          </p>
        </div>
      </motion.div>
    </PublicLayout>
  );
};

const Register = () => {
  const [form, setForm] = useState({ fullName: '', email: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [lastAutoGenerated, setLastAutoGenerated] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (form.fullName) {
      const nameParts = form.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join('') || '';
      if (firstName) {
        // First letter of first name + entire last name
        const candidate = (firstName.substring(0, 1) + lastName).toLowerCase().replace(/[^a-z0-9]/g, '');
        setGeneratedUsername(candidate);
        
        // Live reflection: update the form username if it's currently empty or matches the previous auto-gen
        setForm(prev => {
          if (!prev.username || prev.username === lastAutoGenerated) {
            return { ...prev, username: candidate };
          }
          return prev;
        });
        setLastAutoGenerated(candidate);
      } else {
        setGeneratedUsername('');
        setLastAutoGenerated('');
      }
    } else {
      setGeneratedUsername('');
      setLastAutoGenerated('');
      setForm(prev => ({ ...prev, username: '' }));
    }
  }, [form.fullName]);

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
    <PublicLayout>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[10px] shadow-xl border border-[#e9edef]"
      >
        <div className="mb-8 flex flex-col items-center">
          <img 
            src="https://cdn.conzex.com/files/logo/circle-icon.png" 
            alt="CardSwipe Logo" 
            className="w-20 h-20 rounded-[10px] shadow-lg shadow-primary/20 mb-4"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-bold text-[#111b21] tracking-tight">Join CardSwipe</h1>
          <p className="text-[#667781] mt-1 text-center text-sm">Start managing your cards professionally</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <Input 
            label="Full Name" 
            placeholder="John Doe"
            icon={User}
            value={form.fullName}
            onChange={(e: any) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <div className="relative">
            <Input 
              label="Username (Optional)" 
              placeholder="Leave blank to auto-generate"
              icon={Shield}
              value={form.username}
              onChange={(e: any) => setForm({ ...form, username: e.target.value })}
            />
            {!form.username && generatedUsername && (
              <p className="text-[10px] text-primary font-bold mt-1 absolute right-0 -bottom-4">
                Auto-generated: <span className="text-[#111b21]">{generatedUsername}</span>
              </p>
            )}
          </div>
          <Input 
            label="Email Address" 
            type="email" 
            icon={Activity}
            placeholder="john@example.com"
            value={form.email}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            icon={Lock}
            placeholder="••••••••"
            value={form.password}
            onChange={(e: any) => setForm({ ...form, password: e.target.value })}
            required
          />
          
          <Button className="w-full py-4 rounded-[10px] text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#e9edef] text-center">
          <p className="text-sm text-[#667781]">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition-colors">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </PublicLayout>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmVariant = 'primary' }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white w-full max-w-md rounded-[10px] p-8 shadow-2xl text-center border border-[#e9edef]"
    >
      <div className={cn(
        "w-16 h-16 rounded-[10px] flex items-center justify-center mx-auto mb-6",
        confirmVariant === 'danger' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
      )}>
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-[#111b21] mb-2">{title}</h2>
      <p className="text-[#667781] mb-8 text-sm">{message}</p>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 py-3" onClick={onCancel}>Cancel</Button>
        <Button variant={confirmVariant} className="flex-1 py-3" onClick={onConfirm}>{confirmText}</Button>
      </div>
    </motion.div>
  </div>
);

const ProfileSection = ({ user, setUser }: any) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone })
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      toast.success('Profile updated');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (res.ok) {
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to update password');
    }
    setLoading(false);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/user/change-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail })
    });
    if (res.ok) {
      toast.success('Verification email sent to new address');
      setNewEmail('');
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to update email');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-8 rounded-[10px] border border-[#e9edef] shadow-sm flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-lg">
          {user.fullName[0]}
        </div>
        <h2 className="text-2xl font-bold text-[#111b21]">{user.fullName}</h2>
        <p className="text-[#667781] text-sm mb-4">{user.email}</p>
        <span className={cn(
          "px-4 py-1 rounded-[10px] text-xs font-bold uppercase tracking-wider",
          user.isVerified ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        )}>
          {user.isVerified ? 'Verified Account' : 'Unverified Account'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[10px] border border-[#e9edef] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 text-primary rounded-[10px]">
              <User size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#111b21]">Personal Info</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input label="Full Name" value={fullName} onChange={(e: any) => setFullName(e.target.value)} required />
            <Input label="Phone Number" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
            <Button className="w-full" disabled={loading}>Save Changes</Button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-[10px] border border-[#e9edef] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-[10px]">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#111b21]">Security</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input label="Current Password" type="password" value={currentPassword} onChange={(e: any) => setCurrentPassword(e.target.value)} required />
            <Input label="New Password" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} required />
            <Button variant="secondary" className="w-full" disabled={loading}>Update Password</Button>
          </form>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[10px] border border-[#e9edef] shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-[10px]">
            <Activity size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#111b21]">Change Email</h3>
        </div>
        <p className="text-[#667781] mb-6 text-sm ml-11">Current: {user.email}. You will need to verify the new email address.</p>
        <form onSubmit={handleUpdateEmail} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input label="New Email Address" type="email" value={newEmail} onChange={(e: any) => setNewEmail(e.target.value)} required />
          </div>
          <Button variant="secondary" className="sm:mt-7 px-8" disabled={loading}>Update Email</Button>
        </form>
      </div>
    </div>
  );
};

const AdminSection = ({ user, setConfirmAction }: any) => {
  if (!isUserAdmin(user)) {
    return (
      <div className="bg-white p-12 rounded-[10px] shadow-sm border border-gray-100 text-center">
        <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You do not have administrative privileges to access this section.</p>
      </div>
    );
  }
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'users' | 'logs' | 'stats'>('users');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, lRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/logs')
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch (e) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchData();
  }, [user]);

  const handleViewUser = async (u: UserData) => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch(`/api/admin/user/${u.id}/cards`),
        fetch(`/api/admin/user/${u.id}/transactions`)
      ]);
      if (cRes.ok && tRes.ok) {
        setSelectedUser({
          ...u,
          cards: await cRes.json(),
          transactions: await tRes.json()
        });
      }
    } catch (e) {
      toast.error('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.action?.toLowerCase().includes(search.toLowerCase()) || 
    l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    verifiedUsers: users.filter(u => u.isVerified).length,
    admins: users.filter(u => u.role === 'admin').length,
    totalLogs: logs.length
  };

  const handleResetPassword = async (userId: string) => {
    setConfirmAction({
      title: 'Reset Password',
      message: 'This will generate a temporary password for the user. Continue?',
      onConfirm: async () => {
        const res = await fetch(`/api/admin/user/${userId}/reset-password`, { method: 'POST' });
        if (res.ok) {
          const { tempPassword } = await res.json();
          toast.success(`Temporary password: ${tempPassword}`, { duration: 10000 });
        }
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    setConfirmAction({
      title: 'Delete User',
      message: 'This action is permanent and will delete all user data. Continue?',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const res = await fetch(`/api/admin/user/${userId}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('User deleted');
          fetchData();
        }
      }
    });
  };

  const handleClearLogs = async () => {
    setConfirmAction({
      title: 'Clear Logs',
      message: 'Are you sure you want to delete all activity logs?',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const res = await fetch('/api/admin/clear-logs', { method: 'POST' });
        if (res.ok) {
          toast.success('Logs cleared');
          fetchData();
        }
      }
    });
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    const res = await fetch(`/api/admin/user/${userId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVerified: !currentStatus })
    });
    if (res.ok) {
      toast.success(currentStatus ? 'User unverified' : 'User verified');
      fetchData();
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const res = await fetch(`/api/admin/user/${userId}/toggle-admin`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(data.message);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to toggle admin role');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading admin data...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
          { label: 'Verified', value: stats.verifiedUsers, icon: CheckCircle2, color: 'emerald' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'amber' },
          { label: 'System Logs', value: stats.totalLogs, icon: Activity, color: 'slate' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-[10px] flex items-center justify-center",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
              )}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-[10px] w-full md:w-auto">
          <button 
            onClick={() => setView('users')}
            className={cn("flex-1 md:flex-none px-6 py-2 rounded-[10px] text-sm font-bold transition-all", view === 'users' ? "bg-white text-primary shadow-sm" : "text-gray-500")}
          >
            Users
          </button>
          <button 
            onClick={() => setView('logs')}
            className={cn("flex-1 md:flex-none px-6 py-2 rounded-[10px] text-sm font-bold transition-all", view === 'logs' ? "bg-white text-primary shadow-sm" : "text-gray-500")}
          >
            Logs
          </button>
          <button 
            onClick={() => setView('stats')}
            className={cn("flex-1 md:flex-none px-6 py-2 rounded-[10px] text-sm font-bold transition-all", view === 'stats' ? "bg-white text-primary shadow-sm" : "text-gray-500")}
          >
            Stats
          </button>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder={`Search ${view}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[10px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
          {view === 'logs' && (
            <Button variant="danger" className="py-2 px-6" onClick={handleClearLogs}>Clear</Button>
          )}
        </div>
      </div>

      {selectedUser ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => setSelectedUser(null)} className="p-2 rounded-[10px]">
              <X size={20} />
            </Button>
            <h2 className="text-2xl font-bold">User Details: {selectedUser.fullName}</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-4">
                    {selectedUser.fullName[0]}
                  </div>
                  <h3 className="text-xl font-bold">{selectedUser.fullName}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-[10px] text-xs font-bold uppercase">{selectedUser.role}</span>
                    <span className={cn(
                      "px-3 py-1 rounded-[10px] text-xs font-bold uppercase",
                      selectedUser.isVerified ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                    )}>
                      {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <Button variant="secondary" className="w-full justify-start gap-2 rounded-[10px]" onClick={() => handleToggleAdmin(selectedUser.id, selectedUser.role)}>
                    <Shield size={18} /> {selectedUser.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-2 rounded-[10px]" onClick={() => handleResetPassword(selectedUser.id)}>
                    <Key size={18} /> Reset Password
                  </Button>
                  <Button variant="danger" className="w-full justify-start gap-2 rounded-[10px]" onClick={() => handleDeleteUser(selectedUser.id)}>
                    <Trash2 size={18} /> Delete Account
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Cards ({selectedUser.cards.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedUser.cards.map((c: any) => (
                    <div key={c.id} className={cn("p-4 rounded-[10px] text-white", c.theme)}>
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{c.cardType}</p>
                      <p className="text-lg font-bold mt-2">•••• •••• •••• {c.cardNumber.slice(-4)}</p>
                      <div className="flex justify-between mt-4">
                        <p className="text-xs opacity-80">Limit: {formatCurrency(c.limit)}</p>
                        <p className="text-xs opacity-80">Due: {c.dueDate}</p>
                      </div>
                    </div>
                  ))}
                  {selectedUser.cards.length === 0 && <p className="text-gray-400 text-sm">No cards added</p>}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Recent Transactions ({selectedUser.transactions.length})</h3>
                <div className="space-y-3">
                  {selectedUser.transactions.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-[10px] bg-gray-50">
                      <div>
                        <p className="text-sm font-bold">{t.partyName}</p>
                        <p className="text-[10px] text-gray-500">{format(new Date(t.date), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(t.amount)}</p>
                        <p className={cn("text-[10px] font-bold", t.isPaid ? "text-emerald-600" : "text-amber-600")}>
                          {t.isPaid ? 'Settled' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {selectedUser.transactions.length === 0 && <p className="text-gray-400 text-sm">No transactions found</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : view === 'users' ? (
        <div className="bg-white rounded-[10px] border border-[#e9edef] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f2f5] border-b border-[#e9edef]">
                  <th className="px-8 py-4 text-[10px] font-bold text-[#667781] uppercase tracking-widest">User</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#667781] uppercase tracking-widest">Email</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#667781] uppercase tracking-widest">Role</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#667781] uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-[#667781] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9edef]">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[#f0f2f5]/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                          {u.fullName ? u.fullName[0] : '?'}
                        </div>
                        <span className="font-bold text-[#111b21]">{u.fullName || 'No Name'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[#667781] text-sm">{u.email}</td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider",
                        u.role === 'admin' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => handleToggleVerify(u.id, u.isVerified)}
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity",
                          u.isVerified ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-[10px]", u.isVerified ? "bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]")} />
                        {u.isVerified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleToggleAdmin(u.id, u.role)} className="p-2 hover:bg-amber-50 text-amber-600 rounded-[10px] transition-colors" title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}>
                          <Shield size={18} />
                        </button>
                        <button onClick={() => handleViewUser(u)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-[10px] transition-colors" title="View Details">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleResetPassword(u.id)} className="p-2 hover:bg-amber-50 text-amber-600 rounded-[10px] transition-colors" title="Reset Password">
                          <Key size={18} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-[10px] transition-colors" title="Delete Account">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : view === 'logs' ? (
        <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log, i) => (
              <div key={i} className="px-8 py-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-[10px] flex items-center justify-center",
                    log.type === 'admin' ? "bg-amber-100 text-amber-600" : 
                    log.type === 'auth' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {log.type === 'admin' ? <Shield size={20} /> : 
                     log.type === 'auth' ? <Lock size={20} /> : <Activity size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{log.action}</p>
                    <p className="text-xs text-gray-500">
                      {log.userEmail} • {log.ip} • {format(new Date(log.timestamp), 'dd MMM HH:mm:ss')}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono text-gray-400">
                  {log.details && JSON.stringify(log.details)}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-12 text-center text-gray-400">No activity logs found</div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm">
             <h3 className="text-lg font-bold mb-6">User Verification Status</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={[
                       { name: 'Verified', value: stats.verifiedUsers },
                       { name: 'Unverified', value: stats.totalUsers - stats.verifiedUsers }
                     ]}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     <Cell fill="#10b981" />
                     <Cell fill="#f43f5e" />
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-6 mt-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-[10px] bg-emerald-500"></div>
                 <span className="text-xs text-gray-500 font-bold">Verified</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-[10px] bg-rose-500"></div>
                 <span className="text-xs text-gray-500 font-bold">Unverified</span>
               </div>
             </div>
           </div>

           <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm">
             <h3 className="text-lg font-bold mb-6">Activity Overview</h3>
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-500">Total Logs</span>
                 <span className="text-lg font-bold">{stats.totalLogs}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-500">Admin Actions</span>
                 <span className="text-lg font-bold">{logs.filter(l => l.type === 'admin').length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-500">Auth Events</span>
                 <span className="text-lg font-bold">{logs.filter(l => l.type === 'auth').length}</span>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const CreditCardUI = ({ card, transactions, onClick }: { card: Card, transactions: Transaction[], onClick: () => void, key?: any }) => {
  const [showCvv, setShowCvv] = useState(false);
  const utilized = transactions.filter(t => t.cardId === card.id).reduce((sum, t) => {
    if (t.type === 'payment') return sum - t.amount;
    return sum + t.amount;
  }, 0);
  const available = card.limit - utilized;
  const percentage = (utilized / card.limit) * 100;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "relative h-56 rounded-[20px] p-6 text-white shadow-xl cursor-pointer overflow-hidden group",
        card.theme || "bg-primary"
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />

      <div className="relative h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{card.cardName || 'Credit Card'}</p>
            <h3 className="text-lg font-bold leading-tight">{card.cardType}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowCvv(!showCvv); }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-30 hover:opacity-100"
              title="Show CVV"
            >
              <Info size={12} />
            </button>
            <div className="w-10 h-8 bg-amber-400/90 rounded-[5px] flex items-center justify-center">
              <div className="w-6 h-4 border border-black/20 rounded-[2px]" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <p className="text-xl font-mono tracking-[0.2em] font-bold">
              •••• •••• •••• {card.cardNumber.slice(-4)}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-tighter opacity-70">Expiry</p>
                <p className="text-xs font-bold">{card.expiryDate}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-tighter opacity-70">CVV</p>
                <p className="text-xs font-bold">{showCvv ? card.cvv : '•••'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-tighter opacity-70">Available Limit</p>
              <p className="text-sm font-bold">{formatCurrency(available)}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                className={cn(
                  "h-full rounded-full",
                  percentage > 90 ? "bg-rose-400" : percentage > 70 ? "bg-amber-400" : "bg-emerald-400"
                )}
              />
            </div>
            <div className="flex justify-between text-[8px] font-bold uppercase opacity-70">
              <span>Utilized: {formatCurrency(utilized)}</span>
              <span>Limit: {formatCurrency(card.limit)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CardsSection = ({ cards, transactions, onAddCard, onSelectCard }: any) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Cards</h2>
        <Button onClick={onAddCard} className="rounded-[10px] gap-2 bg-primary hover:bg-primary/90">
          <Plus size={18} /> Add Card
        </Button>
      </div>
      
      {cards.length === 0 ? (
        <div className="bg-white p-12 rounded-[10px] border-2 border-dashed border-gray-200 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No cards added yet. Add your first card to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: any) => (
            <CreditCardUI 
              key={card.id} 
              card={card} 
              transactions={transactions}
              onClick={() => onSelectCard(card)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PartiesSection = ({ parties, onAddParty, onEditParty, onDeleteParty }: any) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Parties</h2>
        <Button onClick={onAddParty} className="rounded-[10px] gap-2 bg-primary hover:bg-primary/90">
          <UserPlus size={18} /> Add Party
        </Button>
      </div>
      
      {parties.length === 0 ? (
        <div className="bg-white p-12 rounded-[10px] border-2 border-dashed border-gray-200 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No parties added yet. Add parties to track shared expenses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((party: any) => (
            <div key={party.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEditParty(party)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                  <Edit size={14} />
                </button>
                <button onClick={() => onDeleteParty(party)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                  <Trash size={14} />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                  {party.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{party.fullName}</h3>
                  <p className="text-[10px] font-bold uppercase text-primary tracking-widest">{party.type}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{party.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{party.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ user, setUser }: { user: UserData, setUser: (u: UserData | null) => void }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [partyToEdit, setPartyToEdit] = useState<Party | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [preSelectedCardId, setPreSelectedCardId] = useState<string | null>(null);

  const handleEditParty = (party: Party) => {
    setPartyToEdit(party);
    setShowAddParty(true);
  };

  const handleDeleteParty = (party: Party) => {
    setConfirmAction({
      title: 'Delete Party?',
      message: `Are you sure you want to delete ${party.fullName}? This action cannot be undone.`,
      confirmVariant: 'danger',
      onConfirm: async () => {
        const res = await fetch(`/api/parties/${party.id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Party deleted');
          fetchData();
        }
      }
    });
  };

  const handleSpendFromCard = (card: Card) => {
    setPreSelectedCardId(card.id);
    setSelectedCard(null);
    setShowAddTransaction(true);
  };

  const handleAddTransactionClose = () => {
    setShowAddTransaction(false);
    setPreSelectedCardId(null);
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const verified = searchParams.get('verified');

  // Security check for activeTab
  useEffect(() => {
    if (activeTab === 'admin' && !isUserAdmin(user)) {
      setActiveTab('overview');
    }
  }, [activeTab, user]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

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
    if (verified === 'true') {
      checkVerificationStatus();
    }
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
      }, 5000); // Faster refresh for better UX
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [verified]);

  const [chartFilter, setChartFilter] = useState<'monthly' | 'quarterly' | 'semi-annually' | 'annually'>('monthly');

  const getFinancialYearRange = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed, 3 is April

    let startYear = currentYear;
    if (currentMonth < 3) { // Jan, Feb, Mar
      startYear = currentYear - 1;
    }
    
    const startDate = new Date(startYear, 3, 1); // April 1st
    const endDate = new Date(startYear + 1, 2, 31, 23, 59, 59); // March 31st next year
    
    return { startDate, endDate };
  };

  const { startDate: fyStart, endDate: fyEnd } = getFinancialYearRange();

  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const totalUsed = transactions.reduce((sum, t) => {
    if (t.type === 'payment') return sum - t.amount;
    return sum + t.amount;
  }, 0);
  const recoverable = transactions.filter(t => t.partyType !== 'self' && !t.isPaid).reduce((sum, t) => sum + t.amount, 0);

  // Prepare chart data for current FY
  const fyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= fyStart && d <= fyEnd;
  });

  const getSpendingData = () => {
    if (chartFilter === 'annually') {
      return [{
        date: `FY ${fyStart.getFullYear()}-${(fyStart.getFullYear() + 1).toString().slice(-2)}`,
        amount: fyTransactions.reduce((sum, t) => sum + (t.type === 'payment' ? 0 : t.amount), 0)
      }];
    }

    if (chartFilter === 'semi-annually') {
      const h1 = fyTransactions.filter(t => new Date(t.date).getMonth() >= 3 && new Date(t.date).getMonth() <= 8);
      const h2 = fyTransactions.filter(t => new Date(t.date).getMonth() > 8 || new Date(t.date).getMonth() < 3);
      return [
        { date: 'H1 (Apr-Sep)', amount: h1.reduce((sum, t) => sum + (t.type === 'payment' ? 0 : t.amount), 0) },
        { date: 'H2 (Oct-Mar)', amount: h2.reduce((sum, t) => sum + (t.type === 'payment' ? 0 : t.amount), 0) }
      ];
    }

    if (chartFilter === 'quarterly') {
      const quarters = [
        { name: 'Q1', months: [3, 4, 5] },
        { name: 'Q2', months: [6, 7, 8] },
        { name: 'Q3', months: [9, 10, 11] },
        { name: 'Q4', months: [0, 1, 2] }
      ];
      return quarters.map(q => ({
        date: q.name,
        amount: fyTransactions.filter(t => q.months.includes(new Date(t.date).getMonth())).reduce((sum, t) => sum + (t.type === 'payment' ? 0 : t.amount), 0)
      }));
    }

    // Default: Monthly
    const months = [];
    let current = new Date(fyStart);
    while (current <= fyEnd) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months.map(m => {
      const monthTotal = fyTransactions
        .filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
        })
        .reduce((sum, t) => sum + (t.type === 'payment' ? 0 : t.amount), 0);
      return {
        date: format(m, 'MMM'),
        amount: monthTotal
      };
    });
  };

  const spendingData = getSpendingData();

  const categoryData = [
    { name: 'Self', value: transactions.filter(t => t.partyType === 'self' && t.type !== 'payment').reduce((sum, t) => sum + t.amount, 0), color: '#0F172B' },
    { name: 'Individual', value: transactions.filter(t => t.partyType === 'individual' && t.type !== 'payment').reduce((sum, t) => sum + t.amount, 0), color: '#10B981' },
    { name: 'Business', value: transactions.filter(t => t.partyType === 'business' && t.type !== 'payment').reduce((sum, t) => sum + t.amount, 0), color: '#F59E0B' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!user.isVerified && !isUserAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[10px] shadow-2xl text-center border border-gray-100">
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
              className="bg-primary hover:bg-primary/90 text-white rounded-[10px] py-3 h-auto font-bold"
            >
              {refreshing ? 'Checking...' : "I've Verified"}
            </Button>
            <Button 
              variant="secondary" 
              className="rounded-[10px] py-3 h-auto font-medium"
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
              className="rounded-[10px] py-3 h-auto font-medium"
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
    <div className="min-h-screen bg-[#F0F2F5] flex font-quicksand overflow-hidden">
      {/* WhatsApp-style Sidebar */}
      <aside 
        className={cn(
          "bg-[#111B21] text-[#AEBAC1] flex flex-col transition-all duration-300 z-50 overflow-hidden",
          isSidebarCollapsed ? "w-[72px]" : "w-64",
          "hidden md:flex"
        )}
      >
        <div className="p-4 flex items-center gap-3 border-b border-[#202C33] h-16 overflow-hidden">
          <img src="https://cdn.conzex.com/files/logo/circle-icon.png" alt="Logo" className="w-8 h-8 rounded-[10px] flex-shrink-0" referrerPolicy="no-referrer" />
          {!isSidebarCollapsed && <span className="font-bold text-white text-lg tracking-tight truncate">CardSwipe</span>}
        </div>

        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1 px-2 scrollbar-hide">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            active={activeTab === 'overview'} 
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={<CreditCard size={20} />} 
            label="My Cards" 
            active={activeTab === 'cards'} 
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('cards')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Parties" 
            active={activeTab === 'parties'} 
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('parties')} 
          />
          {isUserAdmin(user) && (
            <SidebarItem 
              icon={<ShieldCheck size={20} />} 
              label="Admin Panel" 
              active={activeTab === 'admin'} 
              collapsed={isSidebarCollapsed}
              onClick={() => setActiveTab('admin')} 
            />
          )}
        </div>

        <div className="p-2 border-t border-[#202C33] space-y-1">
          <SidebarItem 
            icon={<UserCircle size={20} />} 
            label="Profile" 
            active={activeTab === 'profile'} 
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab('profile')} 
          />
          <SidebarItem 
            icon={<LogOut size={20} />} 
            label="Logout" 
            collapsed={isSidebarCollapsed}
            onClick={handleLogout} 
          />
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 hover:bg-[#202C33] rounded-[10px] transition-colors mt-2"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-[10px]" onClick={() => setShowMobileMenu(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 capitalize">
              {activeTab === 'overview' ? 'Dashboard Overview' : 
               activeTab === 'admin' ? 'Administration' : 
               activeTab === 'profile' ? 'User Profile' : activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-[10px] border border-gray-100">
              <div className="w-8 h-8 bg-primary/10 rounded-[10px] flex items-center justify-center text-primary font-bold text-xs">
                {user.fullName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    title="Total Limit" 
                    value={formatCurrency(totalLimit)} 
                    icon={<CreditCard className="text-blue-500" />}
                    trend="+2.5% from last month"
                    color="blue"
                  />
                  <StatCard 
                    title="Total Used" 
                    value={formatCurrency(totalUsed)} 
                    icon={<ArrowUpRight className="text-amber-500" />}
                    trend={`${((totalUsed/totalLimit)*100).toFixed(1)}% utilization`}
                    color="amber"
                  />
                  <StatCard 
                    title="Recoverable" 
                    value={formatCurrency(recoverable)} 
                    icon={<ArrowDownLeft className="text-emerald-500" />}
                    trend="Awaiting payments"
                    color="emerald"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions - MOVED UP */}
                    <div className="bg-white p-6 rounded-[10px] shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button 
                          onClick={() => setShowAddTransaction(true)}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-primary hover:text-white rounded-[10px] transition-all group"
                        >
                          <PlusCircle className="mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">New Spend</span>
                        </button>
                        <button 
                          onClick={() => setShowAddParty(true)}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-primary hover:text-white rounded-[10px] transition-all group"
                        >
                          <UserPlus className="mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">Add Party</span>
                        </button>
                        <button 
                          onClick={() => setShowAddCard(true)}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-primary hover:text-white rounded-[10px] transition-all group"
                        >
                          <CreditCard className="mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">Add Card</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (cards.length > 0) {
                              setSelectedCard(cards[0]);
                              // We'll trigger the "Add Fund" modal from CardDetails
                            } else {
                              toast.error('Please add a card first');
                            }
                          }}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-primary hover:text-white rounded-[10px] transition-all group"
                        >
                          <Wallet className="mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">Make Payment</span>
                        </button>
                      </div>
                    </div>

                    {/* Chart Section (Spending Spotlight) */}
                    <div className="bg-white p-8 rounded-[10px] shadow-sm border border-gray-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Spending Spotlight</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">FY {fyStart.getFullYear()}-{fyStart.getFullYear()+1}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-[10px] border border-gray-100">
                          {(['monthly', 'quarterly', 'semi-annually', 'annually'] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setChartFilter(filter)}
                              className={cn(
                                "px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all",
                                chartFilter === filter ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                              )}
                            >
                              {filter.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={spendingData}>
                            <defs>
                              <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4185F4" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4185F4" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} tickFormatter={(v) => `₹${v}`} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: number) => [formatCurrency(value), 'Amount']}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#4185F4" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Cards Preview */}
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900">My Cards</h2>
                      <Button variant="ghost" onClick={() => setActiveTab('cards')} className="text-primary font-bold text-xs">View All</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cards.slice(0, 2).map(card => (
                        <CreditCardUI 
                          key={card.id} 
                          card={card} 
                          transactions={transactions}
                          onClick={() => setSelectedCard(card)}
                        />
                      ))}
                      {cards.length === 0 && (
                        <div className="col-span-2 bg-white p-8 rounded-[10px] border-2 border-dashed border-gray-100 text-center">
                          <p className="text-gray-400 text-sm">No cards added yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-8">
                    {/* Upcoming Dues */}
                    <div className="bg-white p-6 rounded-[10px] shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Upcoming Dues</h3>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-[10px]">Next 30 Days</span>
                      </div>
                      <div className="space-y-4">
                        {cards.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4 italic">No cards found</p>
                        ) : (
                          cards
                            .sort((a, b) => a.dueDate - b.dueDate)
                            .slice(0, 5)
                            .map(card => (
                              <div key={card.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-[10px] transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center text-white", card.theme || "bg-primary")}>
                                    <Calendar size={18} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{card.cardType}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Due on {card.dueDate}th</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(transactions.filter(t => t.cardId === card.id).reduce((sum, t) => sum + t.amount, 0))}
                                  </p>
                                  <p className="text-[10px] text-amber-500 font-bold uppercase">Pending</p>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white p-6 rounded-[10px] shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold mb-6">Spending Split</h3>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: number) => [formatCurrency(value), '']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 space-y-2">
                        {categoryData.map((cat, i) => (
                          <div key={i} className="flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-[10px]" style={{ backgroundColor: cat.color }} />
                              <span className="text-gray-500">{cat.name}</span>
                            </div>
                            <span className="text-gray-900">{formatCurrency(cat.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cards' && (
              <CardsSection 
                cards={cards} 
                transactions={transactions} 
                onAddCard={() => setShowAddCard(true)}
                onSelectCard={setSelectedCard}
              />
            )}

            {activeTab === 'parties' && (
              <PartiesSection 
                parties={parties} 
                onAddParty={() => {
                  setPartyToEdit(null);
                  setShowAddParty(true);
                }}
                onEditParty={handleEditParty}
                onDeleteParty={handleDeleteParty}
              />
            )}

            {activeTab === 'admin' && isUserAdmin(user) && <AdminSection user={user} setConfirmAction={setConfirmAction} />}
            {activeTab === 'profile' && <ProfileSection user={user} setUser={setUser} />}
          </div>
        </div>

        {/* Dashboard Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky bottom-0 z-40">
           <span>© 2026 CardSwipe</span>
           <div className="flex items-center gap-4">
             <a href="https://www.conzex.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">A Conzex Global Product</a>
           </div>
        </footer>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#111B21] text-[#AEBAC1] z-[70] md:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-[#202C33]">
                <div className="flex items-center gap-3">
                  <img src="https://cdn.conzex.com/files/logo/circle-icon.png" alt="Logo" className="w-8 h-8 rounded-[10px]" referrerPolicy="no-referrer" />
                  <span className="font-bold text-white text-lg">CardSwipe</span>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-[#202C33] rounded-[10px]">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 py-6 px-4 space-y-2">
                <SidebarItem 
                  icon={<LayoutDashboard size={20} />} 
                  label="Overview" 
                  active={activeTab === 'overview'} 
                  onClick={() => { setActiveTab('overview'); setShowMobileMenu(false); }} 
                />
                <SidebarItem 
                  icon={<CreditCard size={20} />} 
                  label="My Cards" 
                  active={activeTab === 'cards'} 
                  onClick={() => { setActiveTab('cards'); setShowMobileMenu(false); }} 
                />
                <SidebarItem 
                  icon={<Users size={20} />} 
                  label="Parties" 
                  active={activeTab === 'parties'} 
                  onClick={() => { setActiveTab('parties'); setShowMobileMenu(false); }} 
                />
                {isUserAdmin(user) && (
                  <SidebarItem 
                    icon={<ShieldCheck size={20} />} 
                    label="Admin Panel" 
                    active={activeTab === 'admin'} 
                    onClick={() => { setActiveTab('admin'); setShowMobileMenu(false); }} 
                  />
                )}
                <div className="pt-6 mt-6 border-t border-[#202C33]">
                  <SidebarItem 
                    icon={<UserCircle size={20} />} 
                    label="Profile" 
                    active={activeTab === 'profile'} 
                    onClick={() => { setActiveTab('profile'); setShowMobileMenu(false); }} 
                  />
                  <SidebarItem 
                    icon={<LogOut size={20} />} 
                    label="Logout" 
                    onClick={handleLogout} 
                  />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal 
            {...confirmAction} 
            onCancel={() => setConfirmAction(null)} 
            onConfirm={() => {
              confirmAction.onConfirm();
              setConfirmAction(null);
            }} 
          />
        )}
        {showAddCard && (
          <AddCardModal onClose={() => setShowAddCard(false)} onAdd={fetchData} />
        )}
        {showAddTransaction && (
          <AddTransactionModal 
            cards={cards} 
            parties={parties} 
            onAddParty={() => setShowAddParty(true)} 
            onClose={handleAddTransactionClose} 
            onAdd={fetchData} 
            preSelectedCardId={preSelectedCardId}
          />
        )}
        {showAddParty && (
          <AddPartyModal 
            onClose={() => {
              setShowAddParty(false);
              setPartyToEdit(null);
            }} 
            onAdd={fetchData} 
            partyToEdit={partyToEdit}
          />
        )}
        {selectedCard && (
          <CardDetailsModal 
            card={selectedCard} 
            transactions={transactions.filter(t => t.cardId === selectedCard.id)}
            onClose={() => setSelectedCard(null)} 
            onUpdate={fetchData}
            setConfirmAction={setConfirmAction}
            onSpend={handleSpendFromCard}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AddCardModal = ({ onClose, onAdd }: any) => {
  const cvvRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    cardNumber: '',
    cardName: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    cardType: 'Visa',
    limit: '',
    billingDate: '1',
    dueDate: '20',
    theme: 'bg-primary'
  });

  const [isCustomBank, setIsCustomBank] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...form, 
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

  const cardTypes = [
    'Visa', 'Mastercard', 'American Express', 'RuPay', 'Discover', 
    'Cashback', 'Milennia', 'Travel Card', 'Reward Card', 
    'Co-branded Card', 'Premium Corporate Cards'
  ];

  const bankNames = [
    'HDFC Bank', 'SBI Card', 'ICICI Bank', 'Axis Bank', 'Bank of Baroda', 
    'Bank of India', 'One Card', 'Kotak Mahindra', 'IDFC First', 'RBL Bank'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[10px] shadow-2xl overflow-hidden"
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
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select 
                  label="Bank Name"
                  value={isCustomBank ? 'Other' : form.cardName}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setIsCustomBank(true);
                      setForm({ ...form, cardName: '' });
                    } else {
                      setIsCustomBank(false);
                      setForm({ ...form, cardName: val });
                    }
                  }}
                  required
                  options={[
                    { label: 'Select Bank', value: '' },
                    ...bankNames.map(b => ({ label: b, value: b })),
                    { label: 'Other (Custom)', value: 'Other' }
                  ]}
                />
                {isCustomBank && (
                  <Input 
                    label="Custom Bank Name"
                    placeholder="Enter bank name"
                    value={form.cardName}
                    onChange={(e: any) => setForm({ ...form, cardName: e.target.value })}
                    required
                  />
                )}
              </div>
              <Select 
                label="Card Type"
                value={form.cardType}
                onChange={(e: any) => setForm({ ...form, cardType: e.target.value })}
                required
                options={cardTypes.map(t => ({ label: t, value: t }))}
              />
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
                onChange={(e: any) => {
                  const val = formatExpiryDate(e.target.value);
                  setForm({ ...form, expiryDate: val });
                  if (val.length === 5) cvvRef.current?.focus();
                }}
                maxLength={5}
                required
              />
              <Input 
                ref={cvvRef}
                label="CVV" 
                type="password"
                placeholder="•••"
                value={form.cvv}
                onChange={(e: any) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '') })}
                maxLength={4}
                required
              />
              <Input 
                label="Limit (₹)" 
                type="number"
                value={form.limit}
                onChange={(e: any) => setForm({ ...form, limit: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  label="Bill Date" 
                  type="number"
                  min="1" max="31"
                  value={form.billingDate}
                  onChange={(e: any) => setForm({ ...form, billingDate: e.target.value })}
                  required
                />
                <Input 
                  label="Due Date" 
                  type="number"
                  min="1" max="31"
                  value={form.dueDate}
                  onChange={(e: any) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Card Theme</label>
              <div className="flex flex-wrap gap-3">
                {['bg-primary', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-slate-800', 'bg-indigo-600'].map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, theme: t })}
                    className={cn("w-8 h-8 rounded-[10px] border-2", t, form.theme === t ? "border-black scale-110" : "border-transparent")}
                  />
                ))}
                <div className="flex items-center gap-2 relative">
                  <input 
                    type="color" 
                    className="w-8 h-8 rounded-[10px] border-none cursor-pointer p-0 overflow-hidden"
                    value={form.theme.startsWith('bg-[') ? form.theme.slice(4, -1) : '#4185F4'}
                    onChange={(e) => setForm({ ...form, theme: `bg-[${e.target.value}]` })}
                  />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Custom</span>
                </div>
              </div>
            </div>

            <Button className="w-full py-3 mt-4 font-bold">Save Card</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const AddTransactionModal = ({ cards, parties, onAddParty, onClose, onAdd, preSelectedCardId }: any) => {
  const [form, setForm] = useState({
    cardId: preSelectedCardId || cards[0]?.id || '',
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
        className="bg-white w-full max-w-lg rounded-[10px] shadow-2xl p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Transaction</h2>
          <Button variant="ghost" onClick={onClose} className="p-2"><X /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select 
            label="Select Card"
            value={form.cardId}
            onChange={(e: any) => setForm({ ...form, cardId: e.target.value })}
            required
            options={[
              { label: 'Select a card', value: '' },
              ...cards.map((c: any) => ({ 
                label: `${c.cardName} - ${c.cardType} (**** ${c.cardNumber.slice(-4)})`, 
                value: c.id 
              }))
            ]}
          />

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
                  "py-2 px-3 rounded-[10px] text-xs font-bold capitalize transition-all",
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
              <Select 
                label={`Select ${form.partyType}`}
                value={form.partyId}
                onChange={(e: any) => {
                  const party = parties.find((p: any) => p.id === e.target.value);
                  setForm({ ...form, partyId: e.target.value, partyName: party ? `${party.firstName} ${party.lastName}` : '' });
                }}
                required
                options={[
                  { label: `Select ${form.partyType}`, value: '' },
                  ...filteredParties.map((p: any) => ({ label: `${p.firstName} ${p.lastName} ${p.businessName ? `(${p.businessName})` : ''}`, value: p.id }))
                ]}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Payment Mode"
              value={form.paymentMode}
              onChange={(e: any) => setForm({ ...form, paymentMode: e.target.value })}
              options={[
                { label: 'UPI', value: 'upi' },
                { label: 'Cash', value: 'cash' },
                { label: 'Bank Transfer', value: 'bank_transfer' },
              ]}
            />
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

const AddPartyModal = ({ onClose, onAdd, partyToEdit }: any) => {
  const [form, setForm] = useState({
    type: partyToEdit?.type || 'individual',
    fullName: partyToEdit?.fullName || '',
    phone: partyToEdit?.phone || '',
    email: partyToEdit?.email || '',
    businessName: partyToEdit?.businessName || '',
    gstNumber: partyToEdit?.gstNumber || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = partyToEdit ? `/api/parties/${partyToEdit.id}` : '/api/parties';
    const method = partyToEdit ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success(partyToEdit ? 'Party updated' : 'Party created!');
      onAdd();
      onClose();
    } else {
      toast.error(partyToEdit ? 'Failed to update party' : 'Failed to create party');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[10px] shadow-2xl p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{partyToEdit ? 'Edit Party' : 'Create Party'}</h2>
          <Button variant="ghost" onClick={onClose} className="p-2"><X /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-4">
            {['individual', 'business', 'self'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type: type as any })}
                className={cn(
                  "flex-1 py-2 rounded-[10px] text-sm font-bold capitalize transition-all",
                  form.type === type ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <Input 
            label={form.type === 'business' ? "Business Name" : "Full Name"} 
            value={form.fullName}
            onChange={(e: any) => setForm({ ...form, fullName: e.target.value })}
            required
            placeholder={form.type === 'business' ? "Enter business name" : "Enter full name"}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Phone Number" 
              type="tel"
              value={form.phone}
              onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
              placeholder="Optional"
            />
            <Input 
              label="Email Address" 
              type="email"
              value={form.email}
              onChange={(e: any) => setForm({ ...form, email: e.target.value })}
              placeholder="Optional"
            />
          </div>

          {form.type === 'business' && (
            <Input 
              label="GST Number" 
              value={form.gstNumber}
              onChange={(e: any) => setForm({ ...form, gstNumber: e.target.value })}
              placeholder="Optional"
            />
          )}

          <Button className="w-full py-3 mt-4 font-bold">
            {partyToEdit ? 'Update Party' : 'Save Party'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

const CardDetailsModal = ({ card, transactions, onClose, onUpdate, setConfirmAction, onSpend }: any) => {
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showAddFund, setShowAddFund] = useState(false);
  const cardUsed = transactions.filter((t: any) => t.cardId === card.id).reduce((sum: number, t: any) => {
    if (t.type === 'payment') return sum - t.amount;
    return sum + t.amount;
  }, 0);
  const available = card.limit - cardUsed;
  const percentage = (cardUsed / card.limit) * 100;
  const recoverable = transactions.filter((t: any) => t.cardId === card.id && t.partyType !== 'self' && !t.isPaid).reduce((sum: number, t: any) => sum + t.amount, 0);

  const handleDelete = async () => {
    setConfirmAction({
      title: 'Delete Card',
      message: 'Are you sure you want to delete this card and all its transactions? This action cannot be undone.',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Card deleted');
          onUpdate();
          onClose();
        }
      }
    });
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
        className="bg-white w-full max-w-2xl rounded-[10px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className={cn("p-8 text-white relative", card.theme)}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{card.cardName}</p>
              <h2 className="text-3xl font-bold">{card.cardType}</h2>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xl font-mono tracking-widest">
                  {showFullNumber ? card.cardNumber : `•••• •••• •••• ${card.cardNumber.slice(-4)}`}
                </p>
                <button onClick={() => setShowFullNumber(!showFullNumber)} className="p-1 hover:bg-white/20 rounded-[10px]">
                  {showFullNumber ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddFund(true)}
                className="bg-white text-gray-900 hover:bg-gray-100 rounded-[10px] gap-2 font-bold"
              >
                <Wallet size={18} /> Add Fund
              </Button>
              <Button 
                onClick={() => onSpend(card)}
                className="bg-white text-gray-900 hover:bg-gray-100 rounded-[10px] gap-2 font-bold"
              >
                <Plus size={18} /> Spend
              </Button>
              <Button variant="ghost" onClick={onClose} className="p-2 text-white hover:bg-white/20"><X /></Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm mb-6">
            <div>
              <p className="opacity-70 font-bold uppercase text-[10px]">Limit</p>
              <p className="text-lg font-bold">{formatCurrency(card.limit)}</p>
            </div>
            <div>
              <p className="opacity-70 font-bold uppercase text-[10px]">Used</p>
              <p className="text-lg font-bold">{formatCurrency(cardUsed)}</p>
            </div>
            <div>
              <p className="opacity-70 font-bold uppercase text-[10px]">Available</p>
              <p className="text-lg font-bold">{formatCurrency(available)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                className={cn(
                  "h-full rounded-full",
                  percentage > 90 ? "bg-rose-400" : percentage > 70 ? "bg-amber-400" : "bg-emerald-400"
                )}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase opacity-80">
              <span>{percentage.toFixed(1)}% Utilized</span>
              <span>{formatCurrency(recoverable)} Recoverable</span>
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
            {transactions.filter((t: any) => t.cardId === card.id).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: any) => (
              <div key={t.id} className="p-4 rounded-[10px] border border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-[10px] flex items-center justify-center",
                    t.type === 'payment' ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                  )}>
                    {t.type === 'payment' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{t.partyName}</p>
                    <p className="text-xs text-gray-500">{format(new Date(t.date), 'dd MMM yyyy')} • {t.paymentMode}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      t.type === 'payment' ? "text-emerald-600" : "text-gray-900"
                    )}>
                      {t.type === 'payment' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">{t.type === 'payment' ? 'Payment' : 'Spend'}</p>
                  </div>
                  {!t.isPaid && t.partyType !== 'self' && (
                    <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => handleSettle(t.id)}>Settle</Button>
                  )}
                </div>
              </div>
            ))}
            {transactions.filter((t: any) => t.cardId === card.id).length === 0 && (
              <div className="text-center py-12 text-gray-400">No transactions for this card</div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showAddFund && (
            <AddFundModal 
              card={card} 
              onClose={() => setShowAddFund(false)} 
              onAdd={() => {
                onUpdate();
                setShowAddFund(false);
              }} 
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const AddFundModal = ({ card, onClose, onAdd }: any) => {
  const [form, setForm] = useState({
    amount: '',
    paymentMode: 'upi',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...form, 
        cardId: card.id,
        type: 'payment',
        amount: Number(form.amount), 
        partyType: 'self',
        partyName: 'Fund Added',
        isPaid: true 
      })
    });
    if (res.ok) {
      toast.success('Fund added successfully!');
      onAdd();
      onClose();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to add fund');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-[20px] shadow-2xl p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Fund to Card</h2>
          <Button variant="ghost" onClick={onClose} className="p-2"><X /></Button>
        </div>

        <div className="mb-6 p-4 bg-primary/5 rounded-[10px] border border-primary/10">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Target Card</p>
          <p className="text-sm font-bold text-gray-900">{card.cardName} - {card.cardType}</p>
          <p className="text-xs text-gray-500">**** **** **** {card.cardNumber.slice(-4)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Amount (₹)" 
            type="number"
            value={form.amount}
            onChange={(e: any) => setForm({ ...form, amount: e.target.value })}
            required
            placeholder="Enter amount to add"
          />

          <Select 
            label="Payment Mode"
            value={form.paymentMode}
            onChange={(e: any) => setForm({ ...form, paymentMode: e.target.value })}
            options={[
              { label: 'UPI', value: 'upi' },
              { label: 'Bank Transfer', value: 'bank_transfer' },
              { label: 'Cred', value: 'cred' },
            ]}
          />

          <Input 
            label="Date" 
            type="date"
            value={form.date}
            onChange={(e: any) => setForm({ ...form, date: e.target.value })}
            required
          />

          <Input 
            label="Notes" 
            value={form.notes}
            onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes"
          />

          <Button className="w-full py-3 mt-4 font-bold">Confirm Payment</Button>
        </form>
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
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 font-quicksand">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[10px] shadow-xl p-10 border border-[#e9edef]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-[10px] flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#111b21] mb-2">Reset Password</h1>
          <p className="text-[#667781] text-sm">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="New Password" 
            type="password"
            icon={Lock}
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />
          <Input 
            label="Confirm Password" 
            type="password"
            icon={ShieldCheck}
            value={confirmPassword}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
            required
          />
          <Button className="w-full py-4 rounded-[10px] text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
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
