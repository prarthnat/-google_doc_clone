import React, { useState } from 'react';
import { Document, User } from '../types';
import { X, Share2, ShieldCheck, Eye, Edit3, Trash2, Check, UserPlus, Users, Lock, MessageSquare, Globe, Copy } from 'lucide-react';
import { api } from '../utils/api';

interface ShareModalProps {
  document: Document;
  currentUser: User | null;
  users: User[];
  onClose: () => void;
  onShare: (targetUserId: string, permission: 'view' | 'comment' | 'edit') => Promise<void>;
  onRevoke: (targetUserId: string) => Promise<void>;
  onPublicUpdated?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  document,
  currentUser,
  users,
  onClose,
  onShare,
  onRevoke,
  onPublicUpdated,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('edit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = document.owner_id === currentUser?.id;

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await onShare(selectedUserId, permission);
      setSuccessMsg('Collaborator access updated successfully!');
      setSelectedUserId('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  // Filter out owner from selectable users
  const availableUsers = users.filter((u) => u.id !== document.owner_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-2xs">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Share "{document.title}"</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage permissions and general access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Add Collaborator Form (Only Owner) */}
          {isOwner ? (
            <form onSubmit={handleAddShare} className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-brand-600" /> Grant access to demo user
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full sm:flex-1 h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  <option value="">Select teammate to invite...</option>
                  {availableUsers.map((u) => {
                    const existingShare = document.shares?.find((s) => s.user_id === u.id);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) {existingShare ? `[Currently: ${existingShare.permission}]` : ''}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'view' | 'comment' | 'edit')}
                  className="w-full sm:w-auto h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  <option value="edit">Can Edit</option>
                  <option value="comment">Can Comment</option>
                  <option value="view">Can View</option>
                </select>

                <button
                  type="submit"
                  disabled={!selectedUserId || loading}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm shadow-brand-500/25 shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {loading ? 'Saving...' : 'Share'}
                </button>
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              {successMsg && <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {successMsg}</p>}
            </form>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Only the document owner (<strong>{document.owner_name}</strong>) can invite new collaborators or change permissions.</span>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> People with access
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
              {/* Owner */}
              <div className="p-4 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={document.owner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={document.owner_name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      {document.owner_name}
                      {document.owner_id === currentUser?.id && <span className="text-[11px] text-slate-400 font-normal">(You)</span>}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Document Owner</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Owner
                </span>
              </div>

              {/* Shared users */}
              {document.shares && document.shares.length > 0 ? (
                document.shares.map((share) => (
                  <div key={share.id} className="p-4 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={share.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={share.name || share.user_id}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          {share.name || share.user_id}
                          {share.user_id === currentUser?.id && <span className="text-[11px] text-slate-400 font-normal">(You)</span>}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{share.email || share.role_title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        share.permission === 'edit'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                          : share.permission === 'comment'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                      }`}>
                        {share.permission === 'edit' ? <Edit3 className="w-3.5 h-3.5" /> : share.permission === 'comment' ? <MessageSquare className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {share.permission === 'edit' ? 'Can Edit' : share.permission === 'comment' ? 'Can Comment' : 'Can View'}
                      </span>

                      {/* Revoke access button (only owner) */}
                      {isOwner && (
                        <button
                          onClick={() => onRevoke(share.user_id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs font-medium text-slate-400 bg-slate-50/50">
                  Not shared with anyone yet. Invite a teammate above!
                </div>
              )}
            </div>
          </div>

          {/* General Access (Public Link) */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> General Access (Link Sharing)
            </h4>
            <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  document.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {document.is_public ? <Globe className="w-4.5 h-4.5" /> : <Lock className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {document.is_public ? 'Anyone with the link' : 'Restricted'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {document.is_public ? `Anyone on the internet with this link can ${document.public_permission || 'view'}` : 'Only invited teammates can access with this link'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {isOwner && (
                  <select
                    value={document.is_public ? (document.public_permission || 'view') : 'restricted'}
                    onChange={async (e) => {
                      const val = e.target.value;
                      try {
                        if (val === 'restricted') {
                          await api.updatePublicAccess(document.id, document.owner_id, false, 'view');
                        } else {
                          await api.updatePublicAccess(document.id, document.owner_id, true, val as any);
                        }
                        onPublicUpdated?.();
                        setSuccessMsg('General access updated!');
                        setTimeout(() => setSuccessMsg(null), 3000);
                      } catch (err) {
                        setError('Failed to update general access');
                      }
                    }}
                    className="h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="restricted">Restricted</option>
                    <option value="view">Anyone — Can View</option>
                    <option value="comment">Anyone — Can Comment</option>
                    <option value="edit">Anyone — Can Edit</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setSuccessMsg('Link copied to clipboard!');
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  className="h-9 px-3.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                  title="Copy Document Link"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Tip: Use the Account Switcher in top bar to test live access checks.</span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

