"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import React from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
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
      className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-slate-600 dark:text-slate-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  const addImage = () => {
    const url = window.prompt("輸入圖片網址");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
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
      <Button onClick={addImage} title="Image">
        <span className="material-symbols-outlined text-[20px]">image</span>
      </Button>
      <Button onClick={addYoutube} title="Video">
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
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "開始撰寫精彩的內容...",
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
    },
    immediatelyRender: false,
  });

  return (
    <div className="border border-border-light dark:border-border-dark rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
