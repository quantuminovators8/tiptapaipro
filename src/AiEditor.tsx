"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useTransition } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

import { MessageSquare, RefreshCw } from 'lucide-react';
import { AiEditorProps, EditorFeature, AiConfig } from './types';
import { Toolbar } from './components/Toolbar';
import { AiBubbleMenu } from './components/AiBubbleMenu';
import { AiImageModal } from './components/AiImageModal';
import { cn } from './lib/utils';
import { executeAiAction } from './services/ai';
import { useTiptapAiProConfig } from './components/TiptapAiProProvider';

/**
 * AiEditor - A production-ready AI Rich Text Editor.
 */
export const AiEditor: React.FC<AiEditorProps> = ({
  initialContent = '',
  onChange,
  aiConfig: propAiConfig,
  features: propFeatures,
  classNames,
  placeholder = 'Start writing...',
  readOnly = false,
}) => {
  const globalConfig = useTiptapAiProConfig();
  
  // Merge configs
  const aiConfig: AiConfig | undefined = propAiConfig || (globalConfig?.ai as AiConfig);
  const features = propFeatures || globalConfig?.features || globalConfig?.formatting?.enabledTools;
  
  const [isAiImageModalOpen, setIsAiImageModalOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = React.useState<{ id: string; author: string; text: string; timestamp: string }[]>([
    { id: '1', author: 'Ishant', text: 'This intro needs more punch.', timestamp: new Date().toISOString() },
    { id: '2', author: 'AI Assistant', text: 'I can help rewrite that for you.', timestamp: new Date().toISOString() },
  ]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        allowBase64: true,
      }),
      Youtube.configure({
        width: 640,
        height: 480,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder || globalConfig?.editor?.placeholder || 'Start writing...',
      }),
    ],
    content: initialContent,
    editable: !readOnly && (globalConfig?.editor?.editable !== false),
    autofocus: globalConfig?.editor?.autofocus ?? true,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-zinc max-w-none focus:outline-none min-h-[300px] p-4",
          globalConfig?.editor?.theme === 'dark' ? "prose-invert" : "",
          classNames?.editor
        ),
      },
    },
  });

  // Update content if initialContent changes externally
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const isEnabled = (feature: EditorFeature) => !features || features.includes(feature);

  const handleSummarize = async () => {
    if (!editor || !aiConfig || isPending) return;

    const content = editor.getText();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const result = await executeAiAction(
          "Provide a concise summary of the entire document content.",
          content,
          aiConfig,
          false,
          globalConfig?.tools,
          globalConfig?.mcpServers,
          globalConfig?.agent
        );

        if (result.text) {
          // Insert summary at the end of the document
          editor.chain().focus().insertContent(`\n\n### Document Summary\n${result.text}`).run();
        }
      } catch (error) {
        console.error("Summarization failed:", error);
      }
    });
  };

  return (
    <div className={cn(
      "flex flex-col w-full border border-zinc-200 rounded-lg bg-white shadow-sm overflow-hidden",
      classNames?.container
    )}>
      <Toolbar 
        editor={editor} 
        features={features} 
        className={classNames?.toolbar} 
        onAiImageClick={() => setIsAiImageModalOpen(true)}
        onSummarize={handleSummarize}
      />
      
      <div className="relative flex-1 overflow-y-auto flex">
        <div className="flex-1">
          {isEnabled('ai') && (
            <AiBubbleMenu 
              editor={editor} 
              aiConfig={aiConfig} 
              className={classNames?.bubbleMenu} 
              comments={comments}
            />
          )}
          {isPending && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2">
              <RefreshCw size={14} className="animate-spin text-purple-600" />
              <span className="text-xs font-medium text-zinc-600">Summarizing...</span>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>

        {/* Simple Comments Sidebar */}
        <div className="w-64 border-l border-zinc-100 bg-zinc-50 p-4 hidden md:block">
          <div className="flex items-center gap-2 mb-4 text-zinc-500">
            <MessageSquare size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider">Discussion</h3>
          </div>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="bg-white p-3 rounded-md border border-zinc-200 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-zinc-900">{comment.author}</span>
                  <span className="text-[8px] text-zinc-400">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              const text = prompt("Add a comment:");
              if (text) {
                setComments([...comments, { id: Date.now().toString(), author: 'You', text, timestamp: new Date().toISOString() }]);
              }
            }}
            className="mt-4 w-full py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 border border-dashed border-zinc-200 rounded-md transition-colors"
          >
            + Add Comment
          </button>
        </div>
      </div>

      <AiImageModal 
        isOpen={isAiImageModalOpen}
        onClose={() => setIsAiImageModalOpen(false)}
        onGenerate={(url) => editor?.chain().focus().setImage({ src: url }).run()}
        aiConfig={aiConfig}
      />

      <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
        <span>AI Rich Text Editor</span>
        <div className="flex gap-3">
          {editor && (
            <span>{editor.storage.characterCount?.characters?.() || 0} Characters</span>
          )}
          <span>Powered by Tiptap & Gemini</span>
        </div>
      </div>
    </div>
  );
};

export default AiEditor;
