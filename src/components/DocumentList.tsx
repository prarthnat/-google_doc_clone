import React from 'react';
import { Document, User } from '../types';
import { FileText, Share2, Trash2, Clock, ShieldCheck, Edit3, Eye, MoreVertical, Plus } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  currentUser: User | null;
  onOpenDocument: (id: string) => void;
  onShareDocument: (doc: Document, e: React.MouseEvent) => void;
  onDeleteDocument: (id: string, e: React.MouseEvent) => void;
  onCreateNewDoc: () => void;
  isLoading: boolean;
  activeTab: 'all' | 'owned' | 'shared';
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentUser,
  onOpenDocument,
  onShareDocument,
  onDeleteDocument,
  onCreateNewDoc,
  isLoading,
  activeTab,
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-56 bg-slate-200/60 rounded-xl border border-slate-200" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/50 rounded-2xl border border-dashed border-slate-300 m-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 shadow-sm">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No documents found</h3>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
          {activeTab === 'owned'
            ? 'You haven’t created any documents yet. Start fresh by creating one now!'
            : activeTab === 'shared'
            ? 'No documents have been shared with your current demo account.'
            : 'Get started by creating a new document or importing a file.'}
        </p>
        <button
          onClick={onCreateNewDoc}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Document</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {activeTab === 'all' && 'All Documents'}
          {activeTab === 'owned' && 'Owned by Me'}
          {activeTab === 'shared' && 'Shared with Me'}
        </h2>
        <span className="text-xs text-slate-500">{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {documents.map((doc) => {
          const isOwner = doc.owner_id === currentUser?.id;
          const permission = doc.permission || (doc as any).user_permission || (isOwner ? 'owner' : 'view');

          return (
            <div
              key={doc.id}
              onClick={() => onOpenDocument(doc.id)}
              className="group bg-white rounded-xl border border-slate-200/80 hover:border-brand-500/50 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden relative"
            >
              {/* Card Header / Preview Area */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Share Button */}
                    {isOwner && (
                      <button
                        onClick={(e) => onShareDocument(doc, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Share Document"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    {/* Delete Button (if owner) */}
                    {isOwner && (
                      <button
                        onClick={(e) => onDeleteDocument(doc.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 text-base group-hover:text-brand-600 transition-colors line-clamp-1 mb-2">
                  {doc.title}
                </h3>

                {/* Excerpt of Content */}
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-normal">
                  {doc.content.replace(/<[^>]+>/g, '') || 'No content written yet...'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3.5 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <img
                    src={doc.owner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={doc.owner_name}
                    className="w-5 h-5 rounded-full object-cover border border-slate-200"
                    title={`Owner: ${doc.owner_name}`}
                  />
                  <span className="font-medium text-slate-700 truncate max-w-[100px]">
                    {isOwner ? 'You' : doc.owner_name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(doc.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>

                  {/* Permission Badge */}
                  {permission === 'owner' ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 flex items-center gap-1 text-[10px]">
                      <ShieldCheck className="w-3 h-3" /> Owner
                    </span>
                  ) : permission === 'edit' ? (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100 flex items-center gap-1 text-[10px]">
                      <Edit3 className="w-3 h-3" /> Can Edit
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-100 flex items-center gap-1 text-[10px]">
                      <Eye className="w-3 h-3" /> Can View
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
