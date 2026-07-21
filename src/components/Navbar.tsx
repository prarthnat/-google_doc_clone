import React, { useState } from 'react';
import { User } from '../types';
import { FileText, Plus, Search, ChevronDown, Check, Sparkles, Users } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  onCreateNewDoc: () => void;
  onOpenImportModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView: 'dashboard' | 'editor';
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSelectUser,
  onCreateNewDoc,
  onOpenImportModal,
  searchQuery,
  onSearchChange,
  activeView,
  onNavigateHome,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onNavigateHome}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Ajaia Docs</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 border border-brand-100">
                <Sparkles className="w-3 h-3" /> AI-Native
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Collaborative Workspace for Hiring Teams</p>
          </div>
        </div>

        {/* Search Bar (Dashboard Only) */}
        {activeView === 'dashboard' && (
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search documents by title or content..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-transparent rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions & Account Switcher */}
        <div className="flex items-center gap-3">
          {activeView === 'dashboard' && (
            <>
              <button
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80"
              >
                <span>Upload File</span>
              </button>
              <button
                onClick={onCreateNewDoc}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Document</span>
              </button>
            </>
          )}

          {/* User Account Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full sm:rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors bg-white shadow-sm"
              title="Switch Demo User Account"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 leading-none">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{currentUser?.role_title || 'Demo User'}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200/80 py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Demo Account Switcher
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Switch instantly to test multi-user sharing & live permissions.
                    </p>
                  </div>
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {users.map((u) => {
                      const isSelected = u.id === currentUser?.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSelectUser(u);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            isSelected ? 'bg-brand-50/80 text-brand-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                            <div>
                              <div className="text-sm font-medium flex items-center gap-1.5">
                                {u.name}
                                {u.email.includes('prarthna') && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-semibold">Candidate</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">{u.role_title}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                    <span>SQLite Persistent State</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> Active
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
