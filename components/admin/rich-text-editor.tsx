// components/admin/rich-text-editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import "highlight.js/styles/atom-one-dark.css";

const lowlight = createLowlight(common);
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useCallback, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  FileUp,
  Table as TableIcon,
  Trash2,
  Wand2,
  Sparkles,
  ClipboardPaste,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// ─── Toolbar Button ──────────────────────────────────────

function ToolbarBtn({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${isActive
          ? "bg-violet-500/20 text-violet-300"
          : "text-slate-400 hover:text-white hover:bg-white/5"
        } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-white/10 mx-0.5" />;
}

// ─── Main Editor ─────────────────────────────────────────

export function RichTextEditor({
  content,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [aiFormatting, setAiFormatting] = useState(false);
  const [aiMode, setAiMode] = useState<'fix' | 'full'>('fix');
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: { class: "code-block hljs" },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing your content...",
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "editor-table",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      attributes: {
        class: "rich-editor-content outline-none min-h-[400px] px-5 py-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false as any);
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Parse markdown to HTML
        const html = await marked.parse(text);
        // Set editor content
        editor.commands.setContent(html);
      } catch (error) {
        console.error("Error parsing markdown file:", error);
        alert("Failed to parse the markdown file.");
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (error: any) {
      console.error("Image upload error:", error);
      alert(error.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleFormatCode = async () => {
    if (!editor || !editor.isActive("codeBlock")) return;

    const { $from } = editor.state.selection;
    let targetNode = null;
    let targetDepth = 0;

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "codeBlock") {
        targetNode = node;
        targetDepth = depth;
        break;
      }
    }

    if (targetNode) {
      try {
        // dynamically import prettier and plugins
        const [prettier, babelPlugin, estreePlugin] = await Promise.all([
          import("prettier/standalone"),
          import("prettier/plugins/babel"),
          import("prettier/plugins/estree"),
        ]);

        // Extract formatting function and plugins robustly for ESM vs CommonJS
        const formatFn = prettier.default?.format || prettier.format;
        const plugins = [
          babelPlugin.default || babelPlugin,
          estreePlugin.default || estreePlugin,
        ];

        const formatted = await formatFn(targetNode.textContent, {
          parser: "babel",
          plugins,
          singleQuote: true,
          semi: true,
          printWidth: 60,
        });

        const nodePos = $from.before(targetDepth);
        editor.commands.command(({ tr }) => {
          tr.replaceWith(
            nodePos + 1,
            nodePos + 1 + targetNode.content.size,
            editor.schema.text(formatted.trimEnd()),
          );
          return true;
        });
      } catch (err) {
        console.error("Prettier formatting error:", err);
        alert("Could not format code. Verify that it is valid JavaScript.");
      }
    }
  };

  // Handle paste markdown → convert to HTML and set in editor
  const handlePasteMarkdown = async () => {
    if (!editor || !pasteContent.trim()) return;
    const html = await marked.parse(pasteContent, { breaks: true, gfm: true });
    editor.commands.setContent(html as string);
    setPasteContent("");
    setShowPasteModal(false);
  };

  // Handle AI Smart Format
  const handleAiFormat = async (mode: 'fix' | 'full') => {
    if (!editor) return;
    setAiFormatting(true);
    setShowAiDropdown(false);
    try {
      // Get current content as plain text for AI processing
      const currentText = editor.getText();
      if (!currentText.trim()) {
        alert('No content to format. Add some content first.');
        return;
      }

      const res = await fetch('/api/admin/format-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentText, mode }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error + (data.hint ? `\n\n${data.hint}` : ''));
        return;
      }

      // Convert AI-returned markdown to HTML for TipTap
      const html = await marked.parse(data.formatted, { breaks: true, gfm: true });
      editor.commands.setContent(html as string);
    } catch (err: any) {
      alert('AI formatting failed: ' + err.message);
    } finally {
      setAiFormatting(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/5 bg-[#0d0d14]/80 flex-wrap flex-shrink-0">
        {/* Content Import Tools */}
        <input
          type="file"
          accept=".md,.txt"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-colors text-xs font-medium border border-violet-500/20"
          title="Upload Markdown File"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload .md</span>
        </button>
        <button
          onClick={() => setShowPasteModal(true)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors text-xs font-medium border border-blue-500/20"
          title="Paste Markdown Content"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Paste MD</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowAiDropdown(!showAiDropdown)}
            disabled={aiFormatting}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              aiFormatting
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 cursor-wait'
                : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 hover:from-purple-500/20 hover:to-pink-500/20 hover:text-purple-300 border-purple-500/20'
            }`}
            title="AI Smart Format"
          >
            {aiFormatting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{aiFormatting ? 'Formatting...' : 'AI Format'}</span>
          </button>
          {showAiDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => handleAiFormat('fix')}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className="font-medium">🔧 Fix & Clean Up</span>
                <p className="text-xs text-slate-500 mt-0.5">Fix formatting, code blocks, grammar</p>
              </button>
              <button
                onClick={() => handleAiFormat('full')}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className="font-medium">✨ Full Rewrite</span>
                <p className="text-xs text-slate-500 mt-0.5">Complete professional restructure</p>
              </button>
              <div className="border-t border-white/5 mx-2 my-1" />
              <button
                onClick={() => setShowAiDropdown(false)}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <ToolbarSep />

        {/* Text formatting */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (⌘B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (⌘I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline (⌘U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Headings */}
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph") && !editor.isActive("heading")}
          title="Normal text"
        >
          <Type className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Lists */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Block elements */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Insert/Toggle Code Block"
        >
          <div className="w-4 h-4 flex items-center justify-center text-[10px] font-mono font-bold">
            {"</>"}
          </div>
        </ToolbarBtn>
        {editor.isActive("codeBlock") && (
          <ToolbarBtn onClick={handleFormatCode} title="Format JavaScript Code (Prettier)">
            <Wand2 className="w-4 h-4 text-violet-400" />
          </ToolbarBtn>
        )}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Tables */}
        <ToolbarBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </ToolbarBtn>
        {editor.isActive("table") && (
          <ToolbarBtn
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete Table"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </ToolbarBtn>
        )}

        <ToolbarSep />

        {/* Link */}
        <ToolbarBtn
          onClick={setLink}
          isActive={editor.isActive("link")}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink className="w-4 h-4" />
          </ToolbarBtn>
        )}

        <ToolbarSep />

        {/* Media */}
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <ToolbarBtn
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploadingImage}
          title="Insert Image"
        >
          {isUploadingImage ? (
             <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </ToolbarBtn>

        <ToolbarSep />

        {/* Alignment */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Undo/Redo */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (⌘Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (⌘⇧Z)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Paste Markdown Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <h3 className="text-white font-semibold text-sm">Paste Markdown</h3>
                <p className="text-slate-500 text-xs mt-0.5">Paste your raw markdown content below — it will be auto-converted to formatted HTML</p>
              </div>
              <button onClick={() => { setShowPasteModal(false); setPasteContent(""); }} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder={`# Your Heading\n\nYour content here...\n\n\`\`\`javascript\nconsole.log('Hello');\n\`\`\``}
                className="w-full h-80 bg-[#0d0d1a] border border-white/10 rounded-xl p-4 text-sm text-slate-300 font-mono resize-none outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 placeholder-slate-600"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
              <p className="text-slate-600 text-xs">{pasteContent.split('\n').length} lines · {pasteContent.length} chars</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPasteModal(false); setPasteContent(""); }}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteMarkdown}
                  disabled={!pasteContent.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Convert & Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor styles */}
      <style jsx global>{`
        .rich-editor-content {
          color: #e2e8f0;
          font-size: 15px;
          line-height: 1.75;
        }
        .rich-editor-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #fff;
          margin: 1.5rem 0 0.75rem;
          line-height: 1.3;
        }
        .rich-editor-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          margin: 1.25rem 0 0.5rem;
          line-height: 1.35;
        }
        .rich-editor-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 1rem 0 0.5rem;
          line-height: 1.4;
        }
        .rich-editor-content p {
          margin: 0.5rem 0;
        }
        .rich-editor-content strong {
          color: #fff;
        }
        .rich-editor-content em {
          font-style: italic;
        }
        .rich-editor-content u {
          text-decoration: underline;
        }
        .rich-editor-content s {
          text-decoration: line-through;
          opacity: 0.6;
        }
        .rich-editor-content code {
          background: rgba(139, 92, 246, 0.1);
          color: #c4b5fd;
          padding: 0.15rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: "Fira Code", "JetBrains Mono", monospace;
        }
        .rich-editor-content pre {
          background: #0d0d1a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin: 0.75rem 0;
          overflow-x: auto;
        }
        .rich-editor-content pre code {
          background: none;
          color: #e2e8f0;
          padding: 0;
          font-size: 0.85rem;
        }
        .rich-editor-content ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-editor-content ol {
          list-style: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-editor-content li {
          margin: 0.2rem 0;
        }
        .rich-editor-content li::marker {
          color: #8b5cf6;
        }
        .rich-editor-content blockquote {
          border-left: 3px solid #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
          padding: 0.5rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
          margin: 0.75rem 0;
          color: #cbd5e1;
        }
        .rich-editor-content hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin: 1.5rem 0;
        }
        .rich-editor-content a,
        .rich-editor-content .editor-link {
          color: #a78bfa;
          text-decoration: underline;
          cursor: pointer;
        }
        .rich-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255, 255, 255, 0.15);
          pointer-events: none;
          height: 0;
        }
        .rich-editor-content table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.5rem 0;
          overflow: hidden;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rich-editor-content th,
        .rich-editor-content td {
          min-width: 1em;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1rem;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .rich-editor-content th {
          background-color: rgba(139, 92, 246, 0.1);
          font-weight: 600;
          text-align: left;
          color: #fff;
        }
        .rich-editor-content td {
          background-color: rgba(255, 255, 255, 0.02);
        }
        .rich-editor-content table p {
          margin: 0;
        }
        .rich-editor-content img,
        .rich-editor-content .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem auto;
          display: block;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .rich-editor-content img.ProseMirror-selectednode {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
