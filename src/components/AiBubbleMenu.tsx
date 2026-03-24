"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useTransition } from 'react';
import { Editor, BubbleMenu } from '@tiptap/react';
import { Sparkles, Wand2, RefreshCw, Type, Image as ImageIcon, MessageSquare, Search, Bot, Layout, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { AiConfig } from '../types';
import { executeAiAction, generateImage, executeAiPlan } from '../services/ai';
import { useTiptapAiProConfig } from './TiptapAiProProvider';

interface AiBubbleMenuProps {
  editor: Editor | null;
  aiConfig?: AiConfig;
  className?: string;
  comments?: { author: string; text: string; timestamp: string }[];
}

export const AiBubbleMenu: React.FC<AiBubbleMenuProps> = ({ editor, aiConfig: propAiConfig, className, comments = [] }) => {
  const globalConfig = useTiptapAiProConfig();
  const aiConfig = propAiConfig || (globalConfig?.ai as AiConfig);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'text' | 'image' | 'agent' | 'plan'>('text');
  const [planStatus, setPlanStatus] = useState<'idle' | 'generating' | 'reviewing' | 'executing'>('idle');
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [planFeedback, setPlanFeedback] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [groundingSources, setGroundingSources] = useState<any[]>([]);

  if (!editor || !aiConfig) return null;

  const handleAiAction = async (customPrompt?: string) => {
    if (isPending) return;
    
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );

    const discussionContext = comments.length > 0 
      ? `\n\nDiscussion Threads:\n${comments.map(c => `[${c.author}]: ${c.text}`).join('\n')}`
      : '';

    startTransition(async () => {
      setGroundingSources([]);
      try {
        if (mode === 'plan') {
          setPlanStatus('generating');
          const result = await executeAiPlan(
            'generate',
            customPrompt || prompt,
            selectedText + discussionContext,
            aiConfig,
            currentPlan || undefined,
            planFeedback || undefined,
            globalConfig?.tools,
            globalConfig?.mcpServers,
            globalConfig?.agent
          );
          setCurrentPlan(result.text);
          setPlanStatus('reviewing');
          if (result.groundingMetadata?.groundingChunks) {
            setGroundingSources(result.groundingMetadata.groundingChunks);
          }
        } else if (mode === 'text' || mode === 'agent') {
          const result = await executeAiAction(
            customPrompt || prompt,
            selectedText + discussionContext,
            aiConfig,
            mode === 'agent',
            globalConfig?.tools,
            globalConfig?.mcpServers,
            globalConfig?.agent
          );

          if (result.toolCalls) {
            for (const call of result.toolCalls) {
              if (call.name === 'applyFormatting') {
                const { format, action = 'toggle' } = call.args;
                if (action === 'toggle') editor.chain().focus()[`toggle${format.charAt(0).toUpperCase() + format.slice(1)}`]().run();
              } else if (call.name === 'setHeading') {
                editor.chain().focus().toggleHeading({ level: call.args.level }).run();
              } else if (call.name === 'insertTable') {
                editor.chain().focus().insertTable({ rows: call.args.rows, cols: call.args.cols }).run();
              } else if (call.name === 'setTextAlign') {
                editor.chain().focus().setTextAlign(call.args.alignment).run();
              } else if (call.name === 'insertLink') {
                editor.chain().focus().setLink({ href: call.args.url }).run();
              } else if (call.name === 'setColor') {
                const { color, type } = call.args;
                if (type === 'text') {
                  editor.chain().focus().setColor(color).run();
                } else if (type === 'highlight') {
                  editor.chain().focus().setHighlight({ color }).run();
                }
              } else if (call.name === 'insertList') {
                const { type } = call.args;
                if (type === 'bullet') {
                  editor.chain().focus().toggleBulletList().run();
                } else if (type === 'ordered') {
                  editor.chain().focus().toggleOrderedList().run();
                }
              } else if (call.name === 'insertHorizontalRule') {
                editor.chain().focus().setHorizontalRule().run();
              } else if (call.name === 'insertMedia') {
                const { url, type } = call.args;
                if (type === 'image') {
                  editor.chain().focus().setImage({ src: url }).run();
                } else if (type === 'youtube') {
                  editor.chain().focus().setYoutubeVideo({ src: url }).run();
                }
              } else if (call.name === 'summarizeDiscussion') {
                // The text result will contain the summary
              }
            }
          }

          if (result.text) {
            editor.chain().focus().insertContent(result.text).run();
          }

          if (result.groundingMetadata?.groundingChunks) {
            setGroundingSources(result.groundingMetadata.groundingChunks);
          }

          if (!result.groundingMetadata) {
            setIsOpen(false);
            setPrompt('');
          }
        } else {
          const imageUrl = await generateImage(prompt, aiConfig.apiKey, {
            aspectRatio,
            imageSize,
          });
          editor.chain().focus().setImage({ src: imageUrl }).run();
          setIsOpen(false);
          setPrompt('');
        }
      } catch (error) {
        console.error("AI Action failed:", error);
      }
    });
  };

  const handleExecutePlan = async () => {
    if (!editor || !aiConfig || !currentPlan || isPending) return;

    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );

    startTransition(async () => {
      setPlanStatus('executing');
      try {
        const result = await executeAiPlan(
          'execute',
          '',
          selectedText,
          aiConfig,
          currentPlan,
          undefined,
          globalConfig?.tools,
          globalConfig?.mcpServers,
          globalConfig?.agent
        );

        if (result.toolCalls) {
          for (const call of result.toolCalls) {
            if (call.name === 'applyFormatting') {
              const { format, action = 'toggle' } = call.args;
              if (action === 'toggle') editor.chain().focus()[`toggle${format.charAt(0).toUpperCase() + format.slice(1)}`]().run();
            } else if (call.name === 'setHeading') {
              editor.chain().focus().toggleHeading({ level: call.args.level }).run();
            } else if (call.name === 'insertTable') {
              editor.chain().focus().insertTable({ rows: call.args.rows, cols: call.args.cols }).run();
            } else if (call.name === 'setTextAlign') {
              editor.chain().focus().setTextAlign(call.args.alignment).run();
            } else if (call.name === 'insertLink') {
              editor.chain().focus().setLink({ href: call.args.url }).run();
            } else if (call.name === 'setColor') {
              const { color, type } = call.args;
              if (type === 'text') {
                editor.chain().focus().setColor(color).run();
              } else if (type === 'highlight') {
                editor.chain().focus().setHighlight({ color }).run();
              }
            } else if (call.name === 'insertList') {
              const { type } = call.args;
              if (type === 'bullet') {
                editor.chain().focus().toggleBulletList().run();
              } else if (type === 'ordered') {
                editor.chain().focus().toggleOrderedList().run();
              }
            } else if (call.name === 'insertHorizontalRule') {
              editor.chain().focus().setHorizontalRule().run();
            } else if (call.name === 'insertMedia') {
              const { url, type } = call.args;
              if (type === 'image') {
                editor.chain().focus().setImage({ src: url }).run();
              } else if (type === 'youtube') {
                editor.chain().focus().setYoutubeVideo({ src: url }).run();
              }
            }
          }
        }

        if (result.text) {
          editor.chain().focus().insertContent(result.text).run();
        }

        setIsOpen(false);
        setPrompt('');
        setCurrentPlan(null);
        setPlanStatus('idle');
      } catch (error) {
        console.error("Plan execution failed:", error);
      }
    });
  };

  const quickActions = [
    { label: 'Summarize', prompt: 'Provide a concise summary of the selected text.', icon: <FileText size={14} /> },
    { label: 'Suggest Edits', prompt: 'Suggest improvements and edits for this text as if you were a collaborative editor. Show changes clearly.', icon: <MessageSquare size={14} /> },
    { label: 'Summarize Thread', prompt: 'Summarize the key points and decisions from this discussion thread.', icon: <Layout size={14} /> },
    { label: 'Web Search', prompt: 'Research this topic on the web and provide a summary with sources.', icon: <Search size={14} /> },
    { label: 'Fix Grammar', prompt: 'Correct any grammatical or spelling errors in this text.', icon: <Type size={14} /> },
    { label: 'Create Plan', prompt: 'Research and create a detailed writing plan for this topic.', icon: <Layout size={14} />, mode: 'plan' },
  ];

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, maxWidth: 'none' }}
      shouldShow={({ editor, from, to }) => {
        // Only show if there is a selection
        return from !== to;
      }}
    >
      <div className={cn(
        "flex flex-col bg-white rounded-lg shadow-xl border border-zinc-200 overflow-hidden min-w-[300px]",
        className
      )}>
        {!isOpen ? (
          <div className="flex items-center p-1 gap-1">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <Sparkles size={16} className="text-purple-600" />
              Ask AI
            </button>
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            {quickActions.slice(0, 2).map((action, i) => (
              <button
                key={i}
                onClick={() => handleAiAction(action.prompt)}
                className="px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => setMode('text')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    mode === 'text' ? "bg-purple-100 text-purple-700" : "text-zinc-500 hover:bg-zinc-100"
                  )}
                  title="Text Mode"
                >
                  <Type size={16} />
                </button>
                <button 
                  onClick={() => setMode('agent')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    mode === 'agent' ? "bg-purple-100 text-purple-700" : "text-zinc-500 hover:bg-zinc-100"
                  )}
                  title="Agent Mode (Formatting & Tools)"
                >
                  <Bot size={16} />
                </button>
                <button 
                  onClick={() => setMode('plan')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    mode === 'plan' ? "bg-purple-100 text-purple-700" : "text-zinc-500 hover:bg-zinc-100"
                  )}
                  title="Plan Mode (Research & Write)"
                >
                  <Layout size={16} />
                </button>
                <button 
                  onClick={() => setMode('image')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    mode === 'image' ? "bg-purple-100 text-purple-700" : "text-zinc-500 hover:bg-zinc-100"
                  )}
                  title="Image Generation"
                >
                  <ImageIcon size={16} />
                </button>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setGroundingSources([]);
                  setCurrentPlan(null);
                  setPlanStatus('idle');
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Cancel
              </button>
            </div>

            {mode === 'plan' && currentPlan && planStatus === 'reviewing' ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 max-h-[200px] overflow-y-auto">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Proposed Plan</span>
                  <div className="text-xs text-zinc-700 whitespace-pre-wrap prose prose-sm">
                    {currentPlan}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Feedback / Edits</label>
                  <textarea
                    value={planFeedback}
                    onChange={(e) => setPlanFeedback(e.target.value)}
                    placeholder="Add comments to edit the plan..."
                    className="w-full p-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px] resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAiAction()}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isPending ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Regenerate Plan
                  </button>
                  <button
                    onClick={handleExecutePlan}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Execute Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === 'text' ? "Tell AI what to do..." : 
                    mode === 'agent' ? "Ask the agent to format or research..." :
                    mode === 'plan' ? "Describe the topic you want to plan and write..." :
                    "Describe the image to generate..."
                  }
                  className="w-full p-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] resize-none"
                />
                <button
                  disabled={!prompt || isPending}
                  onClick={() => {
                    if (mode === 'plan') {
                      handleAiAction();
                    } else {
                      handleAiAction();
                    }
                  }}
                  className="absolute bottom-2 right-2 p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                </button>
              </div>
            )}

            {groundingSources.length > 0 && (
              <div className="p-2 bg-zinc-50 rounded-md border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sources</span>
                <div className="flex flex-wrap gap-2">
                  {groundingSources.map((chunk, i) => (
                    chunk.web && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-purple-600 hover:underline truncate max-w-[150px]"
                      >
                        {chunk.web.title || chunk.web.uri}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

            {mode === 'image' && (
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 font-medium">Aspect Ratio</span>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="block w-full p-1 border border-zinc-200 rounded"
                  >
                    {['1:1', '3:4', '4:3', '9:16', '16:9', '21:9'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 font-medium">Size</span>
                  <select 
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="block w-full p-1 border border-zinc-200 rounded"
                  >
                    {['1K', '2K', '4K'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {mode === 'text' && (
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleAiAction(action.prompt)}
                    className="flex items-center gap-2 text-left px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 border border-zinc-100 rounded transition-colors"
                  >
                    <span className="text-purple-500">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </BubbleMenu>
  );
};
