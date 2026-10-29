import React, { useState } from 'react';
import { Video, ShieldCheck, Cpu, Moon, Sun, User as UserIcon, LogOut, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onQuickJoin: (code: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onQuickJoin,
  darkMode,
  onToggleDarkMode,
  onNavigateSection,
}) => {
  const [quickCode, setQuickCode] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      onQuickJoin(quickCode.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DFE7F0] dark:border-slate-800 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigateSection('hero'); }}
          className="flex items-center gap-2.5 text-slate-900 dark:text-white font-extrabold text-xl tracking-tight shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#008F67] to-[#00B981] flex items-center justify-center text-white shadow-md shadow-[#00B981]/20">
            <Video className="w-5 h-5" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#008F67] dark:from-white dark:via-slate-200 dark:to-[#00B981] bg-clip-text text-transparent">
            AetherMeet
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button onClick={() => onNavigateSection('features')} className="hover:text-[#00B981] transition-colors whitespace-nowrap shrink-0">
            Features
          </button>
          <button onClick={() => onNavigateSection('architecture')} className="hover:text-[#00B981] transition-colors whitespace-nowrap shrink-0">
            Architecture
          </button>
          <button onClick={() => onNavigateSection('security')} className="hover:text-[#00B981] transition-colors whitespace-nowrap shrink-0">
            Security
          </button>
          <button onClick={() => onNavigateSection('history')} className="hover:text-[#00B981] transition-colors whitespace-nowrap shrink-0">
            Meeting History
          </button>
          <button onClick={() => onNavigateSection('faq')} className="hover:text-[#00B981] transition-colors whitespace-nowrap shrink-0">
            FAQ
          </button>
        </nav>

        {/* Zone 3: Quick Join + Auth & Dark Mode Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Quick Room Code Form */}
          <form onSubmit={handleJoinSubmit} className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-[#DFE7F0] dark:border-slate-700">
            <input
              type="text"
              placeholder="Enter room code..."
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              className="px-3 py-1.5 text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-36 font-mono"
            />
            <button
              type="submit"
              disabled={!quickCode.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#00B981] hover:bg-[#008F67] disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              Join
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth Button / Profile */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 pl-2.5 rounded-xl border border-[#DFE7F0] dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                {user.name}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFE7F0] dark:border-slate-700"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#00B981]" />
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
