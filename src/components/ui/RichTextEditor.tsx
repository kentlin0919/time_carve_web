"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import React, { useCallback, useRef, useState } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

const MenuBar = ({ editor, onImageUpload, isUploading }: { editor: any; onImageUpload?: (file: File) => Promise<string>, isUploading?: boolean }) => {
  if (!editor) {
    return null;
  }

  const Button = ({ onClick, isActive, disabled, children, title }: any) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isActive
        ? "bg-primary/10 text-primary"
        : "text-slate-600 dark:text-slate-300"
        } ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  const addImage = async () => {
    if (onImageUpload) {
      // Create file input and trigger click
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const url = await onImageUpload(file);
            editor.chain().focus().setImage({ src: url }).run();
          } catch (error) {
            console.error('Image upload failed:', error);
          }
        }
      };
      input.click();
    } else {
      const url = window.prompt("輸入圖片網址");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  };

  const addYoutube = () => {
    const url = window.prompt("輸入 YouTube 連結");

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <span className="material-symbols-outlined text-[20px]">
          format_bold
        </span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <span className="material-symbols-outlined text-[20px]">
          format_italic
        </span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="H2"
      >
        <span className="material-symbols-outlined text-[20px]">format_h2</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="H3"
      >
        <span className="material-symbols-outlined text-[20px]">format_h3</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <span className="material-symbols-outlined text-[20px]">
          format_list_bulleted
        </span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Ordered List"
      >
        <span className="material-symbols-outlined text-[20px]">
          format_list_numbered
        </span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <span className="material-symbols-outlined text-[20px]">
          format_quote
        </span>
      </Button>
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />
      <Button onClick={addImage} title="Image" disabled={isUploading}>
        <span className="material-symbols-outlined text-[20px]">image</span>
      </Button>
      <Button onClick={addYoutube} title="Video" disabled={isUploading}>
        <span className="material-symbols-outlined text-[20px]">
          smart_display
        </span>
      </Button>
    </div>
  );
};

export default function RichTextEditor({
  content,
  onChange,
  editable = true,
  onImageUpload,
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const wrappedUpload = async (file: File) => {
    if (!onImageUpload) throw new Error("No upload handler");
    setIsUploading(true);
    try {
      return await onImageUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Use ref to store upload handler for access in editorProps
  const uploadHandlerRef = useRef<((file: File) => Promise<string>) | undefined>(onImageUpload ? wrappedUpload : undefined);
  uploadHandlerRef.current = onImageUpload ? wrappedUpload : undefined;

  // Use ref to store editor instance for external handlers
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 停用 StarterKit 內建的 Link (TipTap v3+)，使用自訂配置
        link: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
      }),
      Placeholder.configure({
        placeholder: "開始撰寫精彩的內容...（可直接拖放或貼上圖片）",
      }),
      Youtube.configure({
        controls: false,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4",
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/') && uploadHandlerRef.current && editorRef.current) {
            event.preventDefault();
            const currentEditor = editorRef.current;
            uploadHandlerRef.current(file).then((url) => {
              currentEditor.chain().focus().setImage({ src: url }).run();
            }).catch((error) => {
              console.error('Image upload failed:', error);
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/') && uploadHandlerRef.current && editorRef.current) {
            event.preventDefault();
            const currentEditor = editorRef.current;
            uploadHandlerRef.current(file).then((url) => {
              currentEditor.chain().focus().setImage({ src: url }).run();
            }).catch((error) => {
              console.error('Image upload failed:', error);
            });
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  // Update editor ref when editor changes
  React.useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Handle drag over for visual feedback
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && uploadHandlerRef.current && editor) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        uploadHandlerRef.current(file).then((url) => {
          editor.chain().focus().setImage({ src: url }).run();
        }).catch((error) => {
          console.error('Image upload failed:', error);
        });
      }
    }
  }, [editor]);

  return (
    <div
      className="border border-border-light dark:border-border-dark rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {editable && <MenuBar editor={editor} onImageUpload={onImageUpload ? wrappedUpload : undefined} isUploading={isUploading} />}
      <EditorContent editor={editor} />
      
      {isUploading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">圖片上傳中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
