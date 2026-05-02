"use client";

import {
  EditorContent,
  useEditor,
  type Editor as TiptapEditor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { ReactNode } from "react";

export type EditorProps = {
  initialContent?: JSONContent | string;
  onChange?: (content: JSONContent) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
};

/**
 * Editor — Tiptap-based rich text editor (StarterKit + Placeholder).
 *
 * Output format: ProseMirror JSON via onChange (DECISIONS § 1.4).
 * StarterKit v3 bundles Link by default, so no separate extension-link install.
 *
 * SSR: immediatelyRender:false prevents Next 16 hydration mismatch
 * (Tiptap v3 official guidance for App Router).
 */
export function Editor({
  initialContent,
  onChange,
  placeholder,
  className,
  editorClassName,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: initialContent ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: [
          "min-h-[140px] px-4 py-3 outline-none",
          "[&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold",
          "[&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-xl [&_h2]:font-semibold",
          "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-semibold",
          "[&_p]:my-1 [&_p]:leading-relaxed",
          "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6",
          "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_blockquote]:italic",
          "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
          "[&_a]:text-blue-600 [&_a]:underline",
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-zinc-400 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          editorClassName ?? "",
        ]
          .filter(Boolean)
          .join(" "),
      },
    },
  });

  if (!editor) return null;

  return (
    <div
      className={["rounded-lg border border-zinc-200 bg-white", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      data-component="editor"
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export type { JSONContent };

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const promptForLink = () => {
    const previousUrl = (editor.getAttributes("link").href as string) ?? "";
    const url = window.prompt("Link URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-zinc-200 p-2"
      data-component="editor-toolbar"
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        ariaLabel="Bold"
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        ariaLabel="Italic"
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        ariaLabel="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        ariaLabel="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        ariaLabel="Heading 3"
      >
        H3
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        ariaLabel="Bullet list"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        ariaLabel="Ordered list"
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        ariaLabel="Quote"
      >
        &ldquo;
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        onClick={promptForLink}
        isActive={editor.isActive("link")}
        ariaLabel="Link"
      >
        ↗
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  isActive: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      data-active={isActive ? "true" : undefined}
      className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-md border border-transparent px-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 data-[active=true]:border-zinc-300 data-[active=true]:bg-zinc-100 data-[active=true]:text-zinc-900"
    >
      {children}
    </button>
  );
}

function Separator() {
  return (
    <div className="mx-1 h-5 w-px self-center bg-zinc-200" aria-hidden="true" />
  );
}
