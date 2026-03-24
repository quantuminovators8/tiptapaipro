/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import AiEditor from './AiEditor';
import { AiConfig } from './types';

export default function App() {
  const [content, setContent] = useState('<h1>Welcome to the AI Editor</h1><p>Select some text to see the AI bubble menu in action!</p>');

  // In a real app, this would come from environment variables or a secure backend
  const aiConfig: AiConfig = {
    provider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    modelId: 'gemini-3.1-pro-preview',
    enableWebSearch: true,
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">AI Rich Text Editor</h1>
          <p className="text-zinc-500">A production-ready, highly customizable editor with native AI integration.</p>
        </header>

        <main className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <AiEditor
            initialContent={content}
            onChange={setContent}
            aiConfig={aiConfig}
            placeholder="Start typing your masterpiece..."
            classNames={{
              container: "border-none shadow-none rounded-none",
              editor: "min-h-[500px] prose-lg"
            }}
          />
        </main>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-zinc-200 space-y-4">
            <h2 className="text-xl font-semibold">Features</h2>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-center gap-2">✅ Full Tiptap Extension Support</li>
              <li className="flex items-center gap-2">✅ Floating AI Bubble Menu</li>
              <li className="flex items-center gap-2">✅ Gemini, OpenAI & OpenRouter Integration</li>
              <li className="flex items-center gap-2">✅ Image Generation (Gemini 3 Pro)</li>
              <li className="flex items-center gap-2">✅ Tailwind CSS 4 & Shadcn Patterns</li>
            </ul>
          </div>

          <div className="p-6 bg-zinc-900 text-white rounded-xl space-y-4">
            <h2 className="text-xl font-semibold">Quick Start</h2>
            <pre className="text-xs bg-zinc-800 p-3 rounded-md overflow-x-auto">
{`import { AiEditor } from '@your-org/ai-editor';

function MyEditor() {
  return (
    <AiEditor 
      aiConfig={{
        provider: 'gemini',
        apiKey: 'YOUR_API_KEY'
      }}
    />
  );
}`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
