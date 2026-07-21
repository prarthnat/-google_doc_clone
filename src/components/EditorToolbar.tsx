import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { UrlPromptModal } from './UrlPromptModal';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  RemoveFormatting,
  Highlighter,
  Sparkles,
  Wand2,
  ChevronDown,
  Link as LinkIcon,
  Image as ImageIcon,
  Printer,
  Palette
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  readOnly?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, readOnly }) => {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlModalConfig, setUrlModalConfig] = useState<{ isOpen: boolean; type: 'link' | 'image'; initialUrl?: string }>({
    isOpen: false,
    type: 'link',
  });

  if (!editor) return null;

  const handleAddLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setUrlModalConfig({ isOpen: true, type: 'link', initialUrl: previousUrl || '' });
  };

  const handleAddImage = () => {
    setUrlModalConfig({ isOpen: true, type: 'image' });
  };

  const fonts = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'JetBrains Mono', value: 'JetBrains Mono' },
  ];

  const colors = [
    { label: 'Black', value: '#0f172a' },
    { label: 'Google Blue', value: '#0b57d0' },
    { label: 'Crimson Red', value: '#dc2626' },
    { label: 'Forest Green', value: '#16a34a' },
    { label: 'Royal Purple', value: '#9333ea' },
    { label: 'Amber Orange', value: '#d97706' },
  ];

  const handleAiAction = async (action: 'improve' | 'concise' | 'expand' | 'grammar' | 'summarize') => {
    setShowAiMenu(false);
    if (isProcessing) return;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    let text = hasSelection ? editor.state.doc.textBetween(from, to, ' ') : editor.getText();

    if (!text || !text.trim()) {
      toast.error('Please write or select some text first for AI assistance');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('✨ AI Assistant analyzing and improving text...');

    try {
      const { result } = await api.aiAssist(text, action);
      toast.dismiss(toastId);

      if (hasSelection) {
        editor.chain().focus().deleteSelection().insertContent(result).run();
      } else if (action === 'summarize') {
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, `<hr/><p><strong>Executive Summary:</strong><br/>${result.replace(/\n/g, '<br/>')}</p>`).run();
      } else {
        editor.chain().focus().setContent(`<p>${result.replace(/\n/g, '<br/>')}</p>`).run();
      }
      toast.success('✨ AI improvement applied!');
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || 'AI request failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const btnClass = (isActive: boolean) =>
    `w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
      isActive
        ? 'bg-brand-100/90 text-brand-700 font-bold shadow-2xs ring-1 ring-brand-500/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div
      onMouseDown={(e) => {
        // Prevent toolbar clicks from stealing focus from the ProseMirror editor canvas
        e.preventDefault();
      }}
      className={`flex flex-wrap items-center gap-1 px-4 py-2 bg-white border-b border-slate-200/90 sticky top-[65px] z-30 shadow-2xs ${
        readOnly ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      {/* ✨ AI Assistant Dropdown */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setShowAiMenu((prev) => !prev)}
          disabled={isProcessing}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          title="AI-Native Writing Assistant"
        >
          {isProcessing ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-pulse' : ''}`} />
          )}
          <span>AI Assistant</span>
          <ChevronDown className="w-3 h-3 opacity-80" />
        </button>

        {showAiMenu && (
          <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 mb-1">
              Writing & Editing
            </div>
            <button
              type="button"
              onClick={() => handleAiAction('improve')}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
            >
              <Wand2 className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <div className="font-semibold">Improve Writing</div>
                <div className="text-[10px] text-slate-400">Polishes tone and clarity</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleAiAction('concise')}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-base leading-none">✂️</span>
              <div>
                <div className="font-semibold">Make Concise</div>
                <div className="text-[10px] text-slate-400">Trims fluff & sharpens copy</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleAiAction('grammar')}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-base leading-none">📝</span>
              <div>
                <div className="font-semibold">Fix Grammar & Spelling</div>
                <div className="text-[10px] text-slate-400">Corrects syntax instantly</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleAiAction('expand')}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-base leading-none">📈</span>
              <div>
                <div className="font-semibold">Expand Ideas</div>
                <div className="text-[10px] text-slate-400">Elaborates with rich context</div>
              </div>
            </button>
            <div className="h-[1px] bg-slate-100 my-1" />
            <button
              type="button"
              onClick={() => handleAiAction('summarize')}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-base leading-none">📊</span>
              <div>
                <div className="font-semibold">Executive Summary</div>
                <div className="text-[10px] text-slate-400">Generates bulleted highlights</div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Print document (Ctrl+P)"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

      {/* Font Family Dropdown */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => {
            setShowFontMenu(!showFontMenu);
            setShowColorMenu(false);
            setShowAiMenu(false);
          }}
          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 flex items-center gap-1.5 w-[110px] justify-between truncate"
          title="Font Family"
        >
          <span className="truncate">{editor.getAttributes('textStyle').fontFamily || 'Arial'}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
        </button>

        {showFontMenu && (
          <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
            {fonts.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().setFontFamily(f.value).run();
                  setShowFontMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 flex items-center justify-between ${
                  editor.isActive('textStyle', { fontFamily: f.value }) ? 'bg-indigo-50 font-semibold text-brand-600' : 'text-slate-700'
                }`}
                style={{ fontFamily: f.value }}
              >
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

      {/* Headings */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
            editor.isActive('highlight')
              ? 'bg-yellow-200 text-yellow-900 font-bold shadow-2xs ring-1 ring-yellow-400/50'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Text Color Dropdown */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowFontMenu(false);
              setShowAiMenu(false);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
            <div
              className="absolute bottom-1.5 left-2 right-2 h-1 rounded-full"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || '#0f172a' }}
            />
          </button>

          {showColorMenu && (
            <div className="absolute left-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 grid grid-cols-3 gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(c.value).run();
                    setShowColorMenu(false);
                  }}
                  className="w-8 h-8 rounded-full border border-slate-200/80 hover:scale-110 transition-transform shadow-2xs flex items-center justify-center"
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

      {/* Lists & Quotes */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            // If inside a bullet/ordered list, lift out of the list first so blockquote wraps cleanly!
            if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
              editor.chain().focus().liftListItem('listItem').toggleBlockquote().run();
            } else {
              editor.chain().focus().toggleBlockquote().run();
            }
          }}
          className={btnClass(editor.isActive('blockquote'))}
          title="Quote Block (Blockquote)"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleAddLink}
          className={btnClass(editor.isActive('link'))}
          title="Insert Link (Ctrl+K)"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleAddImage}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

      {/* Alignments */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={btnClass(editor.isActive({ textAlign: 'left' }))}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={btnClass(editor.isActive({ textAlign: 'center' }))}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={btnClass(editor.isActive({ textAlign: 'right' }))}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

      {/* Clear Formatting */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {urlModalConfig.isOpen && (
        <UrlPromptModal
          type={urlModalConfig.type}
          initialUrl={urlModalConfig.initialUrl}
          onSubmit={(url) => {
            if (urlModalConfig.type === 'link') {
              if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
              } else {
                editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
              }
            } else if (urlModalConfig.type === 'image' && url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          onClose={() => setUrlModalConfig({ ...urlModalConfig, isOpen: false })}
        />
      )}
    </div>
  );
};
