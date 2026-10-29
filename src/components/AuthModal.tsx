import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (user: User, token: string) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        const res = await registerUser(name.trim(), email.trim(), password);
        onSuccess(res.user, res.token);
      } else {
        const res = await loginUser(email.trim(), password);
        onSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-[#DFE7F0] dark:border-slate-700 shadow-2xl p-6 relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#008F67] to-[#00B981] text-white font-bold flex items-center justify-center mx-auto mb-2 shadow-md shadow-[#00B981]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isRegister ? 'Create AetherMeet Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRegister ? 'Sign up to persist meeting logs and AI notes' : 'Sign in to access your saved rooms and meetings'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DFE7F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00B981]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DFE7F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00B981]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DFE7F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00B981]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#008F67] to-[#00B981] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-[#00B981]/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#00B981] hover:underline font-semibold"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

      </div>
    </div>
  );
};
