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
  ArrowLeft,
  Clock,
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
  Plus,
  X,
  MoreHorizontal,
  Wand2,
  ArrowUpRight,
  Check,
  MessageSquare,
} from 'lucide-react';
import { api } from '../utils/api';
import { CommentsDrawer } from './CommentsDrawer';

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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState('');
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
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
  const readOnly = permission === 'view' || permission === 'comment';

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

  const handleExport = (format: 'pdf' | 'md' | 'html' | 'txt') => {
    if (!editor) return;
    if (format === 'pdf') {
      window.print();
      setExportOpen(false);
      return;
    }
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
      <div className="bg-white border-b border-slate-200/90 px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-50 shadow-xs min-h-[65px] no-print">
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
                    <div className={`absolute left-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[60] text-slate-700 font-normal animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto ${
                      menuItem === 'Tools' ? 'w-[360px]' : 'w-60'
                    }`}>
                      {menuItem === 'File' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); onOpenHistory(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <History className="w-4 h-4 text-slate-400" />
                            <span>Version history</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); !readOnly && onOpenImport(); }} disabled={readOnly} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 disabled:opacity-50 font-medium">
                            <UploadCloud className="w-4 h-4 text-slate-400" />
                            <span>Import file...</span>
                          </button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button type="button" onClick={() => { setActiveMenu(null); setExportOpen(true); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <Download className="w-4 h-4 text-slate-400" />
                            <span>Download as...</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); window.print(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <span className="text-sm leading-none">🖨️</span>
                            <span>Print</span>
                          </button>
                        </>
                      )}
                      {menuItem === 'Edit' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().undo().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span>Undo</span>
                            <span className="text-slate-400 text-[10px] font-mono">Ctrl+Z</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().redo().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span>Redo</span>
                            <span className="text-slate-400 text-[10px] font-mono">Ctrl+Y</span>
                          </button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().selectAll().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span>Select all</span>
                            <span className="text-slate-400 text-[10px] font-mono">Ctrl+A</span>
                          </button>
                        </>
                      )}
                      {menuItem === 'View' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); setShowSidebarTabs(!showSidebarTabs); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span>Show document tabs / outline</span>
                            <Check className={`w-4 h-4 ${showSidebarTabs ? 'text-brand-600' : 'opacity-0'}`} />
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); setShowRuler(!showRuler); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span>Show ruler</span>
                            <Check className={`w-4 h-4 ${showRuler ? 'text-brand-600' : 'opacity-0'}`} />
                          </button>
                        </>
                      )}
                      {menuItem === 'Insert' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); setUrlModalConfig({ isOpen: true, type: 'image' }); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <span>🖼️</span>
                            <span>Image...</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); setUrlModalConfig({ isOpen: true, type: 'link', initialUrl: editor?.getAttributes('link').href || '' }); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <span>🔗</span>
                            <span>Link (Ctrl+K)...</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().setHorizontalRule().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <span>—</span>
                            <span>Horizontal line</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleBlockquote().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <span>💬</span>
                            <span>Blockquote</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleCodeBlock().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium">
                            <span>💻</span>
                            <span>Code block</span>
                          </button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button type="button" onClick={() => { setActiveMenu(null); setCommentsOpen(true); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2.5 font-medium text-amber-700">
                            <MessageSquare className="w-4 h-4 text-amber-500" />
                            <span>Comment on document</span>
                          </button>
                        </>
                      )}
                      {menuItem === 'Format' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleBold().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span className="font-bold">Bold</span>
                            <span className="text-slate-400 text-[10px] font-mono">Ctrl+B</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleItalic().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span className="italic">Italic</span>
                            <span className="text-slate-400 text-[10px] font-mono">Ctrl+I</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleUnderline().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span className="underline">Underline</span>
                            <span className="text-slate-400 text-[10px] font-mono">Ctrl+U</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleStrike().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span className="line-through">Strikethrough</span>
                            <span className="text-slate-400 text-[10px] font-mono">Alt+Shift+5</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleHighlight().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between font-medium">
                            <span className="bg-yellow-200 px-1 rounded">Highlight</span>
                          </button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Align & Indent</div>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().setTextAlign('left').run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-xs">Left align</button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().setTextAlign('center').run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-xs">Center align</button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().setTextAlign('right').run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-xs">Right align</button>
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().setTextAlign('justify').run(); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-xs">Justify</button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button type="button" onClick={() => { setActiveMenu(null); editor?.chain().focus().clearNodes().unsetAllMarks().run(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 text-red-600 font-semibold">Clear formatting</button>
                        </>
                      )}
                      {menuItem === 'Tools' && (
                        <>
                          <div className="m-2 p-4 rounded-xl border border-[#dfe5f2] bg-white shadow-2xs space-y-4 text-[#1f2937]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-[#0b57d0] shrink-0 mt-0.5" />
                                <div className="text-[13px] font-bold uppercase tracking-[0.16em] leading-snug">
                                  Document<br />Info
                                </div>
                              </div>
                              <div className="px-4 py-2 rounded-lg bg-[#e8f0fe] text-[#0842a0] text-[13px] font-bold uppercase tracking-[0.12em] leading-snug text-center">
                                Live<br />Stats
                              </div>
                            </div>

                            <div className="text-lg font-semibold truncate border-b border-[#e6eaf2] pb-3" title={title || 'Untitled Document'}>
                              {title || 'Untitled Document'}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-xl border border-[#e6eaf2] p-4 min-w-0">
                                <div className="text-xs font-semibold uppercase text-[#8a96aa] mb-2 truncate">Words</div>
                                <div className="text-xl font-bold text-[#111827]">{wordCount.toLocaleString()}</div>
                              </div>
                              <div className="rounded-xl border border-[#e6eaf2] p-4 min-w-0">
                                <div className="text-xs font-semibold uppercase text-[#8a96aa] mb-2 truncate">Characters</div>
                                <div className="text-xl font-bold text-[#111827]">{charCount.toLocaleString()}</div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#e6eaf2] px-4 py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 text-[#667085]">
                                <Clock className="w-5 h-5 text-[#0b57d0] shrink-0" />
                                <span className="text-sm leading-snug">Est. Read<br />Time</span>
                              </div>
                              <span className="text-lg font-bold text-[#111827] text-right whitespace-nowrap">~{readingTimeMinutes} min read</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => { setActiveMenu(null); setCommentsOpen(true); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 font-medium">
                            <MessageSquare className="w-4 h-4 text-slate-500" />
                            <span>View Comments Panel</span>
                          </button>
                        </>
                      )}
                      {menuItem === 'Help' && (
                        <div className="px-3.5 py-3 text-xs text-slate-600 space-y-1.5 bg-slate-50/50">
                          <div className="font-bold text-slate-800 text-sm">Ajaia Collaborative Editor v1.0</div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">Built with AI-Native tools, TipTap, SQLite & Vite.</p>
                          <div className="pt-1 text-[11px] font-semibold text-brand-600">Shortcuts: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+Z (Undo)</div>
                        </div>
                      )}
                      {menuItem === 'Gemini' && (
                        <>
                          <button type="button" onClick={() => { setActiveMenu(null); setGeminiModalOpen(true); }} className="w-full text-left px-3.5 py-2.5 hover:bg-brand-50 text-brand-700 flex items-center gap-2.5 font-bold border-b border-slate-100">
                            <Sparkles className="w-4.5 h-4.5 text-brand-600 shrink-0" />
                            <div>
                              <div className="text-sm">Open Gemini Assistant...</div>
                              <div className="text-[11px] text-slate-400 font-normal">Custom prompt & quick actions</div>
                            </div>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); handleGeminiPrompt('Help me write an executive overview'); }} className="w-full text-left px-3.5 py-2 hover:bg-brand-50 text-slate-700 flex items-center gap-2 font-medium">
                            <Wand2 className="w-4 h-4 text-brand-500 shrink-0" />
                            <span>Write executive overview</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); handleGeminiPrompt('Summarize the key points and takeaways of this document concisely'); }} className="w-full text-left px-3.5 py-2 hover:bg-brand-50 text-slate-700 flex items-center gap-2 font-medium">
                            <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                            <span>Summarize document</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); handleGeminiPrompt('Improve the tone, clarity, and professionalism of the existing text'); }} className="w-full text-left px-3.5 py-2 hover:bg-brand-50 text-slate-700 flex items-center gap-2 font-medium">
                            <Wand2 className="w-4 h-4 text-brand-500 shrink-0" />
                            <span>Polish tone & clarity</span>
                          </button>
                          <button type="button" onClick={() => { setActiveMenu(null); handleGeminiPrompt('Expand and elaborate on the core arguments with detailed examples'); }} className="w-full text-left px-3.5 py-2 hover:bg-brand-50 text-slate-700 flex items-center gap-2 font-medium">
                            <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                            <span>Expand & elaborate</span>
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
              : permission === 'comment'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {permission === 'owner' ? <ShieldCheck className="w-3.5 h-3.5" /> : permission === 'edit' ? <Edit3 className="w-3.5 h-3.5" /> : permission === 'comment' ? <MessageSquare className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {permission === 'owner' ? 'Owner' : permission === 'edit' ? 'Can Edit' : permission === 'comment' ? 'Can Comment' : 'View Only'}
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

          {/* Comments Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedSnippet('');
              setCommentsOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80 relative"
            title="View & Add Comments"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Comments</span>
            {(document.comments?.length || 0) > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center -top-1 -right-1 absolute">
                {document.comments?.length}
              </span>
            )}
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in duration-100">
                  <button type="button" onClick={() => handleExport('pdf')} className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold border-b border-slate-100 flex items-center justify-between">
                    <span>PDF / Print (.pdf)</span>
                    <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded">NEW</span>
                  </button>
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
          <div className={`${showSidebarTabs ? 'w-[324px]' : 'w-0'} shrink-0 hidden md:block`} />
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
        {/* Google Docs Left Sidebar: Document tabs and heading outline */}
        {showSidebarTabs && (
          <aside className="w-[324px] bg-[#f8fafd] border-r border-[#dadce0] shrink-0 z-10 overflow-y-auto hidden md:flex flex-col text-[#3c4043]">
            <div className="px-7 pt-5 pb-3">
              <button
                type="button"
                onClick={() => setShowSidebarTabs(false)}
                className="w-10 h-10 -ml-3 mb-8 rounded-full text-[#5f6368] hover:bg-[#eef0f4] flex items-center justify-center transition-colors"
                title="Hide document tabs"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <div className="flex items-center justify-between mb-5 pl-2 pr-3">
                <div className="text-[16px] font-semibold text-[#3c4043]">
                  Document tabs
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full text-[#5f6368] hover:bg-[#eef0f4] flex items-center justify-center transition-colors"
                  title="Add tab"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="group flex items-center gap-4 h-[54px] rounded-full bg-[#d3e3fd] text-[#0b57d0] pl-8 pr-4">
                <FileText className="w-5 h-5 shrink-0" />
                <span className="flex-1 truncate text-[16px] font-semibold">Tab 1</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full text-[#3c4043] hover:bg-[#c2d6f8] flex items-center justify-center transition-colors"
                  title="Tab options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 ml-[78px] mr-6 pb-6 pt-0 border-l-2 border-[#e1e7ef]">
              {headings.length === 0 ? (
                <div className="pl-5 pt-1 text-[16px] text-[#5f6368] italic leading-snug max-w-[210px]">
                  Headings you add to the document will appear here.
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 overflow-y-auto pr-1">
                  {headings.map((h, i) => (
                    <button
                      key={`${h.id}-${i}`}
                      type="button"
                      onClick={() => {
                        if (editor) {
                          editor.commands.focus(h.pos);
                        }
                      }}
                      className={`relative w-full min-h-10 text-left text-[16px] leading-5 hover:bg-[#eef0f4] rounded-r-full py-2 pr-2 transition-colors truncate ${
                        i === 0 ? 'text-[#0b57d0] font-medium before:absolute before:left-[-2px] before:top-1 before:bottom-1 before:w-[2px] before:bg-[#0b57d0]' : 'text-[#3c4043]'
                      } ${
                        h.level === 1 ? 'pl-7' : h.level === 2 ? 'pl-[62px] text-[#5f6368]' : 'pl-[86px] text-[#5f6368]'
                      }`}
                    >
                      <span className="truncate">{h.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
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

      {/* Gemini AI Floating Modal (from Top Menu or shortcuts) */}
      {geminiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Gemini AI Assistant</h3>
                  <p className="text-xs text-slate-500">Generate, expand, or polish your document content</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeminiModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                What would you like Gemini to write or edit?
              </label>
              <textarea
                rows={3}
                value={aiPromptText}
                onChange={(e) => setAiPromptText(e.target.value)}
                placeholder="e.g. Write a comprehensive project roadmap for Q3 with milestones..."
                className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all resize-none"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Executive Summary', 'Action Items Table', 'Professional Tone', 'Expand Section'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setAiPromptText(`Generate a detailed ${chip.toLowerCase()}`)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGeminiModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!aiPromptText.trim() || isAiGenerating}
                onClick={() => {
                  setGeminiModalOpen(false);
                  handleGeminiPrompt();
                }}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate with Gemini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commenter Mode Banner */}
      {permission === 'comment' && (
        <div className="bg-purple-50/95 border-b border-purple-200 px-4 lg:px-8 py-2 flex items-center justify-between text-xs text-purple-900 shadow-2xs no-print">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
            <span><strong>Commenter Mode</strong> — You have comment access. You can view & attach notes/feedback right here without altering the document text.</span>
          </div>
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="font-bold underline hover:text-purple-700 shrink-0 ml-2"
          >
            Open Comments ({document.comments?.length || 0})
          </button>
        </div>
      )}

      {/* Floating selection comment bar */}
      {editor && !editor.state.selection.empty && (permission === 'owner' || permission === 'edit' || permission === 'comment') && (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 animate-in fade-in slide-in-from-bottom-3 duration-150 no-print">
          <button
            type="button"
            onClick={() => {
              const from = editor.state.selection.from;
              const to = editor.state.selection.to;
              const text = editor.state.doc.textBetween(from, to, ' ');
              setSelectedSnippet(text);
              setCommentsOpen(true);
            }}
            className="px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-semibold border border-slate-700/80 active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Comment on selection</span>
          </button>
        </div>
      )}

      {/* Comments Drawer */}
      {commentsOpen && currentUser && (
        <CommentsDrawer
          documentId={document.id}
          currentUserId={currentUser.id}
          permission={permission}
          selectedText={selectedSnippet}
          onClose={() => {
            setCommentsOpen(false);
            setSelectedSnippet('');
          }}
        />
      )}
    </div>
  );
};
