"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Heading1, Heading2, Heading3, Quote, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Table as TableIcon,
  Image as ImageIcon, Video, Link as LinkIcon, Sparkles,
  Type, Palette, Highlighter, Wand2, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { EditorFeature } from '../types';
import { useTiptapAiProConfig } from './TiptapAiProProvider';

interface ToolbarProps {
  editor: Editor | null;
  features?: EditorFeature[];
  className?: string;
  onAiImageClick?: () => void;
  onSummarize?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  editor, 
  features: propFeatures, 
  className, 
  onAiImageClick,
  onSummarize
}) => {
  const globalConfig = useTiptapAiProConfig();
  const features = propFeatures || globalConfig?.features || globalConfig?.formatting?.enabledTools;

  if (!editor) return null;

  const isEnabled = (feature: EditorFeature) => !features || features.includes(feature);

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title,
    className: btnClassName
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode;
    title: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-md transition-colors hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed",
        isActive ? "bg-zinc-200 text-zinc-900" : "text-zinc-600",
        btnClassName
      )}
    >
      {children}
    </button>
  );

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addVideo = () => {
    const url = window.prompt('Enter YouTube URL');
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-1 p-1 bg-white border-b border-zinc-200 sticky top-0 z-10",
      className
    )}>
      {isEnabled('bold') && (
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>
      )}
      {isEnabled('italic') && (
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>
      )}
      {isEnabled('underline') && (
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>
      )}
      {isEnabled('strike') && (
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </ToolbarButton>
      )}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {isEnabled('heading') && (
        <>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </ToolbarButton>
        </>
      )}

      {isEnabled('blockquote') && (
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={18} />
        </ToolbarButton>
      )}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {isEnabled('list') && (
        <>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </ToolbarButton>
        </>
      )}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {isEnabled('align') && (
        <>
          <ToolbarButton 
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight size={18} />
          </ToolbarButton>
        </>
      )}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {isEnabled('table') && (
        <ToolbarButton 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table"
        >
          <TableIcon size={18} />
        </ToolbarButton>
      )}

      {isEnabled('link') && (
        <ToolbarButton 
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon size={18} />
        </ToolbarButton>
      )}

      {isEnabled('image') && (
        <ToolbarButton onClick={addImage} title="Insert Image">
          <ImageIcon size={18} />
        </ToolbarButton>
      )}

      {isEnabled('video') && (
        <ToolbarButton onClick={addVideo} title="Insert Video">
          <Video size={18} />
        </ToolbarButton>
      )}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      {isEnabled('color') && (
        <div className="flex items-center gap-1">
          {globalConfig?.formatting?.customColors?.map(color => (
            <button
              key={color}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="w-4 h-4 rounded-full border border-zinc-200"
              style={{ backgroundColor: color }}
              title={`Set color to ${color}`}
            />
          ))}
          <input
            type="color"
            onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-6 h-6 p-0.5 rounded cursor-pointer border-none bg-transparent"
            title="Custom Color"
          />
        </div>
      )}

      {isEnabled('highlight') && (
        <div className="flex items-center gap-1">
          {globalConfig?.formatting?.customHighlights?.map(color => (
            <button
              key={color}
              onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
              className="w-4 h-4 rounded-sm border border-zinc-200"
              style={{ backgroundColor: color }}
              title={`Highlight with ${color}`}
            />
          ))}
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Toggle Highlight"
          >
            <Highlighter size={18} />
          </ToolbarButton>
        </div>
      )}

      {isEnabled('image-gen') && (
        <ToolbarButton 
          onClick={() => onAiImageClick?.()}
          title="AI Image Generation"
          className="text-purple-600 hover:bg-purple-50"
        >
          <Wand2 size={18} />
        </ToolbarButton>
      )}

      {isEnabled('ai') && (
        <ToolbarButton 
          onClick={() => onSummarize?.()}
          title="Summarize Document"
          className="text-purple-600 hover:bg-purple-50"
        >
          <FileText size={18} />
        </ToolbarButton>
      )}
    </div>
  );
};
