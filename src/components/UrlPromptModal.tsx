import React, { useState } from 'react';
import { X, Link as LinkIcon, Image as ImageIcon, Check } from 'lucide-react';

interface UrlPromptModalProps {
  type: 'link' | 'image';
  initialUrl?: string;
  onSubmit: (url: string) => void;
  onClose: () => void;
}

export const UrlPromptModal: React.FC<UrlPromptModalProps> = ({
  type,
  initialUrl = '',
  onSubmit,
  onClose,
}) => {
  const [url, setUrl] = useState(initialUrl || (type === 'link' ? 'https://' : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
              type === 'link' ? 'bg-blue-50 text-brand-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {type === 'link' ? <LinkIcon className="w-4.5 h-4.5" /> : <ImageIcon className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {type === 'link' ? 'Insert Link' : 'Insert Image'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {type === 'link' ? 'Add web address or URL' : 'Embed image from web URL or data URI'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {type === 'link' ? 'Web Address (URL)' : 'Image Address (URL)'}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={type === 'link' ? 'https://example.com' : 'https://images.unsplash.com/...'}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            {type === 'link' && initialUrl && (
              <button
                type="button"
                onClick={() => {
                  onSubmit('');
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors mr-auto"
              >
                Remove Link
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 shadow-sm shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{type === 'link' ? 'Apply Link' : 'Insert Image'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
