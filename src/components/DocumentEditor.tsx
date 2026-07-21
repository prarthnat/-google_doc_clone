import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TurndownService from 'turndown';
import { toast } from 'sonner';
import { Document, User } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { UrlPromptModal } from './UrlPromptModal';
import {
  AlertCircle,
  Clock,
  ArrowLeft,
  Share2,
  History,
  CheckCircle,
  RefreshCw,
  Download,
  UploadCloud,
  ShieldCheck,
  Eye,
  Edit3,
  FileText,
  Lock,
  Users,
  Sparkles,
  Star,
  Sidebar as SidebarIcon,
  Plus,
  X,
  File,
  Folder,
  MoreHorizontal,
  Wand2,
  List,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { api } from '../utils/api';

interface DocumentEditorProps {
  document: Document;
  currentUser: User | null;
  onBack: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
  onOpenImport: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  currentUser,
  onBack,
  onOpenShare,
  onOpenHistory,
  onOpenImport,
  onUpdateTitle,
}) => {
  const [title, setTitle] = useState(document.title);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');
  const [exportOpen, setExportOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showSidebarTabs, setShowSidebarTabs] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [aiPromptText, setAiPromptText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; level: number; text: string; pos: number }[]>([]);
  const [urlModalConfig, setUrlModalConfig] = useState<{ isOpen: boolean; type: 'link' | 'image'; initialUrl?: string }>({
    isOpen: false,
    type: 'link',
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = document.owner_id === currentUser?.id;
  const permission = document.permission || (isOwner ? 'owner' : 'view');
  const readOnly = permission === 'view';

  useEffect(() => {
    setTitle(document.title);
  }, [document.title]);

  useEffect(() => {
    const handleOnline = async () => {
      const bufferedHtml = localStorage.getItem(`doc_draft_${document.id}`);
      if (bufferedHtml && !readOnly && currentUser) {
        try {
          setSaveStatus('saving');
          await api.updateDocument(document.id, currentUser.id, {
            content: bufferedHtml,
            createVersion: false,
          });
          localStorage.removeItem(`doc_draft_${document.id}`);
          setSaveStatus('saved');
          toast.success('⚡ Online! Local changes synced to SQLite.');
        } catch (err) {
          console.error('Failed to sync buffered draft when online:', err);
          setSaveStatus('error');
        }
      } else {
        setSaveStatus('saved');
      }
    };

    const handleOffline = () => {
      setSaveStatus('offline');
      toast.warning('Offline mode: changes will buffer locally in localStorage.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) setSaveStatus('offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [document.id, readOnly, currentUser]);

  const updateHeadingsList = (editorInstance: any) => {
    if (!editorInstance) return;
    const extracted: { id: string; level: number; text: string; pos: number }[] = [];
    editorInstance.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        extracted.push({
          id: `heading-${pos}`,
          level: node.attrs.level || 1,
          text: node.textContent || 'Untitled Heading',
          pos,
        });
      }
    });
    setHeadings(extracted);
  };

  const triggerManualSync = async () => {
    if (readOnly || !currentUser || !editor) return;
    const html = editor.getHTML();
    setSaveStatus('saving');
    try {
      await api.updateDocument(document.id, currentUser.id, {
        content: html,
        createVersion: false,
      });
      localStorage.removeItem(`doc_draft_${document.id}`);
      setSaveStatus('saved');
      toast.success('Synced successfully to SQLite.');
    } catch (err) {
      console.error('Manual sync error:', err);
      setSaveStatus(!navigator.onLine ? 'offline' : 'error');
      toast.error('Could not sync to SQLite.');
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote', 'listItem'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Highlight,
      Placeholder.configure({
        placeholder: readOnly ? 'This document is view-only.' : 'Start typing or use "/" shortcuts for rich content...',
      }),
    ],
    content: document.content,
    editable: !readOnly,
    onCreate: ({ editor }) => {
      updateHeadingsList(editor);
    },
    onUpdate: ({ editor }) => {
      updateHeadingsList(editor);
      if (readOnly || !currentUser) return;

      const html = editor.getHTML();
      localStorage.setItem(`doc_draft_${document.id}`, html);

      if (!navigator.onLine) {
        setSaveStatus('offline');
        return;
      }

      setSaveStatus('saving');

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await api.updateDocument(document.id, currentUser.id, {
            content: html,
            createVersion: false,
          });
          localStorage.removeItem(`doc_draft_${document.id}`);
          setSaveStatus('saved');
        } catch (err) {
          console.error('Autosave error:', err);
          setSaveStatus(!navigator.onLine ? 'offline' : 'error');
        }
      }, 700);
    },
  });

  useEffect(() => {
    if (editor) {
      const bufferedHtml = localStorage.getItem(`doc_draft_${document.id}`);
      const contentToLoad = bufferedHtml || document.content;
      if (contentToLoad !== editor.getHTML()) {
        editor.commands.setContent(contentToLoad);
        updateHeadingsList(editor);
      }
    }
  }, [document.id, document.content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  const handleGeminiPrompt = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPromptText;
    if (!promptToUse.trim() || readOnly || isAiGenerating) return;

    setIsAiGenerating(true);
    const toastId = toast.loading(`✨ Gemini generating: "${promptToUse}"...`);
    try {
      const { result } = await api.aiAssist(promptToUse, 'expand', editor?.getText() || '');
      toast.dismiss(toastId);
      if (editor) {
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, `<p>${result.replace(/\n/g, '<br/>')}</p>`).run();
      }
      setAiPromptText('');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Failed to generate text');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    onUpdateTitle(val);

    if (readOnly || !currentUser) return;
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.updateDocument(document.id, currentUser.id, {
          title: val,
        });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }, 700);
  };

  const handleExport = (format: 'md' | 'html' | 'txt') => {
    if (!editor) return;
    let contentStr = '';
    let mimeType = 'text/plain';
    let ext = format;

    if (format === 'html') {
      contentStr = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body>${editor.getHTML()}</body></html>`;
      mimeType = 'text/html';
    } else if (format === 'txt') {
      contentStr = editor.getText();
      mimeType = 'text/plain';
    } else if (format === 'md') {
      // Clean conversion from HTML to Markdown using Turndown
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
      });
      const mdContent = turndownService.turndown(editor.getHTML());
      contentStr = `# ${title}\n\n` + mdContent;
      mimeType = 'text/markdown';
    }

    const blob = new Blob([contentStr], { type: `${mimeType};charset=utf-8;` });
    const link = window.document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    link.click();
    setExportOpen(false);
  };

  // Collect active collaborator avatars to display right next to the Share button
  const allCollaborators = [
    {
      id: document.owner_id,
      name: document.owner_name || 'Owner',
      avatar: document.owner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      permission: 'owner' as const,
    },
    ...(document.shares || []).map(s => ({
      id: s.user_id,
      name: s.name || s.user_id,
      avatar: s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      permission: s.permission,
    })),
  ];

  const isPrivate = !document.shares || document.shares.length === 0;

  const textContent = editor?.getText() || '';
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex-1 flex flex-col bg-doc-bg min-h-[calc(100vh-65px)] overflow-y-auto">
      {/* Top Document Header Bar (Polished like exact Google Docs layout) */}
      <div className="bg-white border-b border-slate-200/90 px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs min-h-[65px]">
        {/* Left Section: Back button, Doc Icon, Title & Save Status */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20 hidden sm:flex">
            <FileText className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1 max-w-xl">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                disabled={readOnly}
                placeholder="Untitled Document"
                className={`font-bold text-lg text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-brand-500 rounded px-1.5 py-0.5 -ml-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/10 truncate transition-all ${
                  readOnly ? 'cursor-default hover:border-transparent' : ''
                }`}
              />
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors"
                title="Star document"
              >
                <Star className="w-4 h-4" />
              </button>
              {/* Save Status Indicator next to star */}
              <span className="flex items-center gap-1 text-xs text-slate-500 ml-2">
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-700 font-medium" title="All changes saved to SQLite">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">Saved</span>
                  </span>
                )}
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-700 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === 'offline' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold text-xs shadow-2xs" title="Changes saved locally to localStorage buffer. Will sync to SQLite when online.">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>⚡ Saved locally (Offline)</span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <button
                    type="button"
                    onClick={triggerManualSync}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 hover:bg-red-100 text-red-800 border border-red-200/80 font-semibold text-xs shadow-2xs transition-colors"
                    title="Error saving to SQLite. Click to retry syncing."
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Error saving • Retry</span>
                  </button>
                )}
              </span>
            </div>

            {/* Google Docs Top Menu Bar (File, Edit, View, Insert, Format, Tools, Gemini, Help) */}
            <div className="flex items-center gap-1 text-xs text-slate-700 -ml-1 mt-0.5 relative">
              {['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Gemini', 'Help'].map((menuItem) => (
                <div key={menuItem} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenu(activeMenu === menuItem ? null : menuItem)}
                    className={`px-2 py-0.5 rounded hover:bg-slate-100 transition-colors font-medium flex items-center gap-1 ${
                      activeMenu === menuItem ? 'bg-slate-100 text-brand-600 font-semibold' : ''
                    } ${menuItem === 'Gemini' ? 'text-brand-600 font-semibold flex items-center gap-1' : ''}`}
                  >
                    {menuItem === 'Gemini' && <Sparkles className="w-3 h-3 text-brand-500" />}
                    <span>{menuItem}</span>
                  </button>

                  {activeMenu === menuItem && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200/90 py-1.5 z-50 text-slate-700 font-normal">
                      {menuItem === 'File' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); onOpenHistory(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" />
                            <span>Version history</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); !readOnly && onOpenImport(); }} disabled={readOnly} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2 disabled:opacity-50">
                            <UploadCloud className="w-4 h-4 text-slate-400" />
                            <span>Import file...</span>
                          </button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button type="button" onClick={() => { setActiveMenu(null); setExportOpen(true); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2">
                            <Download className="w-4 h-4 text-slate-400" />
                            <span>Download as...</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); window.print(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2">
                            <span className="text-sm leading-none">🖨️</span>
                            <span>Print</span>
                          </button>
                        </>
                      )}
                      {menuItem === 'Edit' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().undo().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                            <span>Undo</span>
                            <span className="text-slate-400 text-[10px]">Ctrl+Z</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().redo().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                            <span>Redo</span>
                            <span className="text-slate-400 text-[10px]">Ctrl+Y</span>
                          </button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().selectAll().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                            <span>Select all</span>
                            <span className="text-slate-400 text-[10px]">Ctrl+A</span>
                          </button>
                        </>
                      )}
                      {menuItem === 'View' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); setShowSidebarTabs(!showSidebarTabs); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                            <span>Show document tabs / outline</span>
                            <Check className={`w-4 h-4 ${showSidebarTabs ? 'text-brand-600' : 'opacity-0'}`} />
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); setShowRuler(!showRuler); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                            <span>Show ruler</span>
                            <Check className={`w-4 h-4 ${showRuler ? 'text-brand-600' : 'opacity-0'}`} />
                          </button>
                        </>
                      )}
                      {menuItem === 'Insert' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); setUrlModalConfig({ isOpen: true, type: 'image' }); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2">
                            <span>🖼️ Image</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); setUrlModalConfig({ isOpen: true, type: 'link', initialUrl: editor?.getAttributes('link').href || '' }); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2">
                            <span>🔗 Link</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().setHorizontalRule().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2">
                            <span>— Horizontal line</span>
                          </button>
                        </>
                      )}
                      {menuItem === 'Format' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleBold().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100">Bold (Ctrl+B)</button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleItalic().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100">Italic (Ctrl+I)</button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleUnderline().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100">Underline (Ctrl+U)</button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().clearNodes().unsetAllMarks().run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-red-600">Clear formatting</button>
                        </>
                      )}
                      {(menuItem === 'Tools' || menuItem === 'Help') && (
                        <div className="px-3.5 py-2 text-xs text-slate-500">
                          {menuItem === 'Tools' ? `Word count: ${editor?.getText().split(/\s+/).filter(Boolean).length || 0} words` : 'Ajaia Collaborative Editor v1.0 — Built with AI-Native tools.'}
                        </div>
                      )}
                      {menuItem === 'Gemini' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); handleGeminiPrompt('Help me write an executive overview'); }} className="w-full text-left px-3.5 py-1.5 hover:bg-brand-50 text-brand-700 flex items-center gap-2 font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Help me write...</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); handleGeminiPrompt('Summarize key points'); }} className="w-full text-left px-3.5 py-1.5 hover:bg-brand-50 text-brand-700 flex items-center gap-2 font-medium">
                            <Wand2 className="w-4 h-4" />
                            <span>Summarize document</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Permission badge, History, Export, Collaborator Avatars & Google Docs Share Pill */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Permission indicator */}
          <span className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            permission === 'owner'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : permission === 'edit'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {permission === 'owner' ? <ShieldCheck className="w-3.5 h-3.5" /> : permission === 'edit' ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {permission === 'owner' ? 'Owner' : permission === 'edit' ? 'Can Edit' : 'View Only'}
          </span>

          {/* Import into draft button (if can edit) */}
          {!readOnly && (
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80"
              title="Import file into document"
            >
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <span className="hidden xl:inline">Import</span>
            </button>
          )}

          {/* Version History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80"
            title="View Version History"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80"
              title="Export Document"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in duration-100">
                  <button type="button" onClick={() => handleExport('md')} className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                    Markdown (.md)
                  </button>
                  <button type="button" onClick={() => handleExport('html')} className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                    HTML (.html)
                  </button>
                  <button type="button" onClick={() => handleExport('txt')} className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                    Plain Text (.txt)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Collaborator Avatars Stack */}
          <div className="hidden sm:flex items-center -space-x-2 mr-1">
            {allCollaborators.slice(0, 4).map((c, idx) => (
              <img
                key={c.id + idx}
                src={c.avatar}
                alt={c.name}
                title={`${c.name} (${c.permission})`}
                className="w-8 h-8 rounded-full object-cover border-2 border-white ring-1 ring-slate-200 shadow-xs hover:z-10 hover:scale-110 transition-all cursor-pointer"
              />
            ))}
            {allCollaborators.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                +{allCollaborators.length - 4}
              </div>
            )}
          </div>

          {/* Google Docs Styled Pill Share Button */}
          <button
            type="button"
            onClick={onOpenShare}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95 ${
              isPrivate
                ? 'bg-[#c2e7ff] text-[#001d35] hover:bg-[#b3d7f3] border border-[#a8c7df]'
                : 'bg-[#0b57d0] text-white hover:bg-[#0842a0] shadow-brand-500/25'
            }`}
          >
            {isPrivate ? <Lock className="w-4 h-4 text-[#001d35]" /> : <Share2 className="w-4 h-4 text-white" />}
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Pinned Formatting Toolbar */}
      <EditorToolbar editor={editor} readOnly={readOnly} />

      {/* Google Docs Horizontal Ruler */}
      {showRuler && (
        <div className="h-6 bg-white border-b border-slate-200/90 flex items-center select-none overflow-hidden relative z-10 shadow-2xs">
          <div className="w-64 shrink-0 hidden md:block" /> {/* Offset for sidebar if open */}
          <div className="flex-1 max-w-4xl mx-auto flex items-center justify-between px-16 text-[10px] text-slate-400 font-mono">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <div key={num} className="flex items-center gap-6 relative">
                <div className="h-2 w-[1px] bg-slate-300" />
                <div className="h-1.5 w-[1px] bg-slate-200" />
                <div className="h-1.5 w-[1px] bg-slate-200" />
                <span className="font-semibold text-slate-500 absolute -top-0.5 left-2">{num}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace: Left Sidebar + Central Paper Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Google Docs Left Sidebar: Document Navigation & Headings Outline */}
        {showSidebarTabs && (
          <div className="w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col gap-6 shrink-0 z-10 overflow-y-auto hidden md:flex">
            {/* Document Info & Quick Stats Card */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>Document Info</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-brand-100/80 text-brand-700 rounded">
                  Live Stats
                </span>
              </div>

              <div className="font-semibold text-sm text-slate-800 truncate border-b border-slate-200/60 pb-2" title={title || 'Untitled Document'}>
                {title || 'Untitled Document'}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <div className="text-[10px] font-medium text-slate-400 uppercase">Words</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{wordCount.toLocaleString()}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                  <div className="text-[10px] font-medium text-slate-400 uppercase">Characters</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{charCount.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>Est. Read Time</span>
                </span>
                <span className="font-bold text-slate-800">~{readingTimeMinutes} min read</span>
              </div>
            </div>

            {/* Headings Outline Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Headings
              </div>
              {headings.length === 0 ? (
                <div className="text-xs text-slate-400 italic leading-relaxed py-2">
                  Headings you add to the document will appear here.
                </div>
              ) : (
                <div className="flex flex-col gap-1 overflow-y-auto pr-1">
                  {headings.map((h, i) => (
                    <button
                      key={`${h.id}-${i}`}
                      type="button"
                      onClick={() => {
                        if (editor) {
                          editor.commands.focus(h.pos);
                        }
                      }}
                      className={`text-left text-xs text-slate-600 hover:text-brand-600 hover:bg-slate-50 px-2 py-1.5 rounded truncate transition-colors font-medium flex items-center gap-1.5 ${
                        h.level === 1 ? 'font-semibold text-slate-800' : h.level === 2 ? 'pl-4' : 'pl-6 text-slate-500'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                      <span className="truncate">{h.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Central Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto py-8 px-4 sm:px-8 lg:px-12 flex flex-col items-center">
          <div className="w-full max-w-4xl bg-doc-paper rounded-sm shadow-paper hover:shadow-paper-hover transition-shadow duration-300 p-8 sm:p-14 lg:p-16 border border-slate-200/60 min-h-[900px] relative flex flex-col justify-between">
            <div>
              {readOnly && (
                <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>You are in <strong>View Only</strong> mode. Ask the owner ({document.owner_name}) for edit access if needed.</span>
                  </span>
                </div>
              )}
              <EditorContent editor={editor} />
            </div>

            {/* Google Docs Floating Gemini Pill Prompt Box (At bottom of canvas) */}
            {!readOnly && (
              <div className="mt-12 pt-8 border-t border-slate-100/80 flex flex-col items-center">
                {/* Contextual Callout Bubble */}
                <div className="bg-[#f0f4f9] border border-[#d3e3fd] text-[#041e49] text-xs px-4 py-2.5 rounded-2xl shadow-xs mb-3 flex items-center gap-3 max-w-lg">
                  <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Type a prompt below to add AI-generated content to this document</span>
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
                  {['Match doc format', 'Templates', 'Meeting notes', 'Email draft', 'Project proposal'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setAiPromptText(`Write a detailed ${chip.toLowerCase()}`);
                      }}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full text-xs font-medium text-slate-700 shadow-2xs transition-all active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Primary Pill Input */}
                <div className="w-full max-w-xl bg-white rounded-full shadow-lg border border-slate-200/90 p-1.5 pl-4 flex items-center gap-2 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
                  <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
                  <input
                    type="text"
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGeminiPrompt();
                    }}
                    placeholder="Write a document about..."
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <span className="bg-blue-50 text-brand-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase shrink-0">
                    Beta
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGeminiPrompt()}
                    disabled={isAiGenerating || !aiPromptText.trim()}
                    className="w-8 h-8 rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 flex items-center justify-center transition-all shadow-sm shrink-0"
                    title="Generate with Gemini"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {urlModalConfig.isOpen && (
        <UrlPromptModal
          type={urlModalConfig.type}
          initialUrl={urlModalConfig.initialUrl}
          onSubmit={(url) => {
            if (urlModalConfig.type === 'link') {
              if (url === '') {
                editor?.chain().focus().extendMarkRange('link').unsetLink().run();
              } else {
                editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
              }
            } else if (urlModalConfig.type === 'image' && url) {
              editor?.chain().focus().setImage({ src: url }).run();
            }
          }}
          onClose={() => setUrlModalConfig({ ...urlModalConfig, isOpen: false })}
        />
      )}
    </div>
  );
};
