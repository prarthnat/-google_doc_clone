import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DocumentComment } from '../types';
import { X, MessageSquare, CheckCircle2, Plus, Quote, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

interface CommentsDrawerProps {
  documentId: string;
  currentUserId: string;
  permission: 'owner' | 'edit' | 'comment' | 'view';
  selectedText?: string;
  onClose: () => void;
  onCommentsUpdated?: () => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  documentId,
  currentUserId,
  permission,
  selectedText = '',
  onClose,
  onCommentsUpdated,
}) => {
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canComment = permission === 'owner' || permission === 'edit' || permission === 'comment';

  useEffect(() => {
    loadComments();
  }, [documentId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await api.getComments(documentId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !canComment) return;

    setSubmitting(true);
    try {
      await api.createComment(documentId, currentUserId, newText.trim(), selectedText.trim() || undefined);
      setNewText('');
      await loadComments();
      onCommentsUpdated?.();
      toast.success('Comment added successfully!');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await api.resolveComment(documentId, commentId, currentUserId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentsUpdated?.();
      toast.success('Comment resolved and removed');
    } catch (err) {
      toast.error('Failed to resolve comment');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 animate-in fade-in duration-200" onClick={onClose} />

      {/* Slide-out Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Comments & Feedback</h3>
              <p className="text-[11px] text-slate-500">{comments.length} active comment{comments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Comment Form */}
        {canComment ? (
          <form onSubmit={handleAddComment} className="p-4 border-b border-slate-200 bg-amber-50/30 space-y-3">
            {selectedText && (
              <div className="p-2.5 bg-amber-100/60 rounded-lg border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                <Quote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold block text-[10px] text-amber-700 uppercase tracking-wider mb-0.5">Selected text snippet:</span>
                  <p className="italic line-clamp-2">"{selectedText}"</p>
                </div>
              </div>
            )}
            <textarea
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={selectedText ? 'Add a comment on the highlighted text...' : 'Add a general document comment or note...'}
              className="w-full p-3 text-sm bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none placeholder:text-slate-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newText.trim() || submitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-b border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
            You have view-only access. You cannot post comments.
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-14 px-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No active comments</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {canComment ? 'Be the first to start a discussion or leave feedback on this document!' : 'No one has left comments on this document yet.'}
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const canResolve = comment.user_id === currentUserId || permission === 'owner';
              return (
                <div
                  key={comment.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs hover:border-slate-300 transition-all space-y-2.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={comment.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={comment.user_name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-800 truncate">{comment.user_name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(comment.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {canResolve && (
                      <button
                        type="button"
                        onClick={() => handleResolve(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-1 text-[11px] font-medium"
                        title="Resolve & Remove Comment"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Resolve</span>
                      </button>
                    )}
                  </div>

                  {comment.selected_text && (
                    <div className="px-2.5 py-1.5 rounded bg-amber-50 border-l-2 border-amber-400 text-[11px] text-amber-900 italic line-clamp-2">
                      "{comment.selected_text}"
                    </div>
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
