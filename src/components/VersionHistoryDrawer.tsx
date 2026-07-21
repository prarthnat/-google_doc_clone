import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DocumentVersion } from '../types';
import { X, History, Clock, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

interface VersionHistoryDrawerProps {
  documentId: string;
  currentUserId: string;
  canEdit: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => Promise<any> | void;
  onCreateCheckpoint: (summary: string) => Promise<any> | void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  documentId,
  currentUserId,
  canEdit,
  onClose,
  onRestore,
  onCreateCheckpoint,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await api.getVersions(documentId);
      setVersions(data);
      if (data.length > 0 && !selectedVersion) {
        setSelectedVersion(data[0]);
      }
    } catch (err: any) {
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointName.trim() || !canEdit) return;

    setCreating(true);
    try {
      await onCreateCheckpoint(checkpointName.trim());
      setCheckpointName('');
      await loadVersions();
      toast.success('Checkpoint snapshot saved');
    } catch (err: any) {
      setError(err.message || 'Failed to save checkpoint');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreClick = async () => {
    if (!selectedVersion || !canEdit) return;
    setRestoring(true);
    try {
      await onRestore(selectedVersion.id);
      toast.success(`Restored to version ${selectedVersion.version_number}`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to restore');
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">Version History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological snapshots & rollback</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Named Checkpoint */}
        {canEdit && (
          <form onSubmit={handleCreateSnapshot} className="p-4 border-b border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              placeholder="Name new checkpoint (e.g., Before major refactor)..."
              value={checkpointName}
              onChange={(e) => setCheckpointName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!checkpointName.trim() || creating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              <span>Snapshot</span>
            </button>
          </form>
        )}

        {/* Content split: List of versions vs Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* List of versions */}
          <div className="w-full md:w-56 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50 shrink-0">
            {loading ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-200 rounded-lg" />)}
              </div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No versions recorded yet.</div>
            ) : (
              versions.map((ver) => {
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full p-3 text-left transition-colors flex flex-col gap-1 ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100/80 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Version #{ver.version_number}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 font-medium">
                      {ver.summary || 'Autosaved changes'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <img
                        src={ver.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={ver.creator_name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="truncate">{ver.creator_name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Preview of selected version */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between bg-white">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Preview: {selectedVersion.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Recorded on {new Date(selectedVersion.created_at).toLocaleString()} by {selectedVersion.creator_name}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 max-h-[60vh] overflow-y-auto text-sm text-slate-700 leading-relaxed ProseMirror">
                  <div dangerouslySetInnerHTML={{ __html: selectedVersion.content || '<p>No content in this checkpoint</p>' }} />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a version on the left to preview content.
              </div>
            )}

            {/* Restore Action */}
            <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {canEdit ? 'Restoring will create a new checkpoint.' : 'Only editors can restore versions.'}
              </span>
              {canEdit && selectedVersion && (
                <button
                  onClick={handleRestoreClick}
                  disabled={restoring}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{restoring ? 'Restoring...' : `Restore Version #${selectedVersion.version_number}`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
