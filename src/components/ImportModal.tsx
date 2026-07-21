import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Check, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: (title: string, content: string, mode: 'new' | 'current') => void;
  hasCurrentDocument: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  onClose,
  onImportSuccess,
  hasCurrentDocument,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ title: string; content: string; rawContent: string; extension: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'new' | 'current'>('new');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.md', '.markdown', '.txt', '.html', '.docx'].includes(ext)) {
      setError('Supported file formats: .md, .txt, .html, .docx');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const result = await api.importFile(selectedFile);
      setParsedData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (!parsedData) return;
    onImportSuccess(parsedData.title, parsedData.content, importMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">Upload & Import File</h3>
              <p className="text-xs text-slate-500 mt-0.5">Turn local files into collaborative documents</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!parsedData ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-brand-50/20 cursor-pointer transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt,.html,.docx"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-500 mt-1">Supported formats: Word (.docx), Markdown (.md), Text (.txt), HTML (.html)</p>
              </div>
              {loading && <p className="text-xs text-brand-600 font-medium animate-pulse">Processing and parsing file...</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{file?.name}</h4>
                    <span className="text-xs text-slate-500">Converted from {parsedData.extension} to Rich Text</span>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setParsedData(null); }}
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  Change file
                </button>
              </div>

              {/* Preview excerpt */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Content Preview
                </label>
                <div className="p-3 bg-slate-100 rounded-lg max-h-36 overflow-y-auto text-xs text-slate-700 font-mono border border-slate-200">
                  {parsedData.rawContent}
                </div>
              </div>

              {/* Destination options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Import Action
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    importMode === 'new' ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="new"
                      checked={importMode === 'new'}
                      onChange={() => setImportMode('new')}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <div className="text-sm">Create New Document</div>
                      <div className="text-[11px] text-slate-500 font-normal">Opens in a fresh draft</div>
                    </div>
                  </label>

                  {hasCurrentDocument && (
                    <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      importMode === 'current' ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="importMode"
                        value="current"
                        checked={importMode === 'current'}
                        onChange={() => setImportMode('current')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="text-sm">Insert into Draft</div>
                        <div className="text-[11px] text-slate-500 font-normal">Appends to active document</div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parsedData}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm shadow-brand-500/20"
          >
            <span>Confirm Import</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
