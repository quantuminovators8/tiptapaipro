"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useTransition } from 'react';
import { Wand2, X, RefreshCw, Layout, Maximize } from 'lucide-react';
import { cn } from '../lib/utils';
import { AiConfig } from '../types';
import { generateImage } from '../services/ai';

interface AiImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (url: string) => void;
  aiConfig?: AiConfig;
}

export const AiImageModal: React.FC<AiImageModalProps> = ({ isOpen, onClose, onGenerate, aiConfig }) => {
  const [prompt, setPrompt] = useState('');
  const [isPending, startTransition] = useTransition();
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt || !aiConfig || isPending) return;
    
    startTransition(async () => {
      setError(null);
      try {
        const imageUrl = await generateImage(prompt, aiConfig.apiKey, {
          aspectRatio,
          imageSize,
        });
        onGenerate(imageUrl);
        onClose();
        setPrompt('');
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate image");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Wand2 size={20} className="text-purple-600" />
            <h2 className="text-lg font-semibold text-zinc-900">AI Image Generation</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Prompt</label>
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create..."
              className="w-full p-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <Layout size={14} /> Aspect Ratio
              </label>
              <select 
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {['1:1', '3:4', '4:3', '9:16', '16:9', '21:9'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <Maximize size={14} /> Size
              </label>
              <select 
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full p-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {['1K', '2K', '4K'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!prompt || isPending}
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isPending ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Generate Image
          </button>
        </div>
      </div>
    </div>
  );
};
