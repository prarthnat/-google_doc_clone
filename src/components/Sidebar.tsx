import React from 'react';
import { FileText, UserCheck, Users, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface SidebarProps {
  activeTab: 'all' | 'owned' | 'shared';
  onSelectTab: (tab: 'all' | 'owned' | 'shared') => void;
  ownedCount: number;
  sharedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  ownedCount,
  sharedCount,
}) => {
  const allCount = ownedCount + sharedCount;

  return (
    <aside className="w-64 bg-doc-sidebar border-r border-slate-200/80 p-4 shrink-0 hidden md:flex flex-col justify-between min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        {/* Navigation menu */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Documents</p>
          <button
            onClick={() => onSelectTab('all')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 font-semibold'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>All Documents</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {allCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('owned')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'owned'
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 font-semibold'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4" />
              <span>Owned by Me</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'owned' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {ownedCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('shared')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'shared'
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 font-semibold'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Shared with Me</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'shared' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {sharedCount}
            </span>
          </button>
        </div>

        {/* Quick Reviewer Guide Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Quick Start</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Explore features across the collaborative workflow:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Rich Editor:</strong> TipTap engine with headings, lists & code blocks.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Account Switcher:</strong> Switch between Prarthna, Alex, Maya & David in top right.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Granular Shares:</strong> Test View vs Edit permissions.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Version History:</strong> Create snapshots and rollback anytime.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer / Candidate Info */}
      <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col gap-1">
        <span className="font-semibold text-slate-700">Built by Prarthna Tiwari</span>
        <span>prarthnatiwari04@gmail.com</span>
        <span className="text-[10px] text-slate-400 mt-1">Full Stack Product Engineer Assessment</span>
      </div>
    </aside>
  );
};
