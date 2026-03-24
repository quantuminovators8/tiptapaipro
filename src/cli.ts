#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const defaultConfig = `import { defineConfig } from 'tiptapaipro';

/**
 * TiptapAiPro Configuration
 * 
 * Configure your AI providers, custom tools, formatting, and editor settings here.
 */
export default defineConfig({
  // AI Provider Configuration
  ai: {
    provider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    enableWebSearch: true,
    modelId: 'gemini-3.1-pro-preview',
  },

  // Editor Settings
  editor: {
    placeholder: 'Start writing your masterpiece...',
    autofocus: true,
    editable: true,
    theme: 'system',
  },

  // Formatting & Tools Configuration
  formatting: {
    enabledTools: [
      'bold', 'italic', 'underline', 'strike', 'heading', 'blockquote',
      'list', 'table', 'align', 'color', 'highlight', 'image', 'video', 'link'
    ],
    customColors: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'],
    customHighlights: ['#ffff00', '#00ff00', '#ffc0cb', '#add8e6'],
  },

  // AI Agent & Planning Configuration
  agent: {
    systemInstruction: "You are a professional writing assistant. Help the user create high-quality content.",
    temperature: 0.7,
    maxTokens: 2048,
  },

  // Custom Tools for the AI Agent
  tools: [
    /*
    {
      name: "fetchUserData",
      description: "Fetch user data from the database",
      parameters: {
        type: "OBJECT",
        properties: {
          userId: { type: "STRING" }
        },
        required: ["userId"]
      }
    }
    */
  ],

  // Model Context Protocol (MCP) Servers
  mcpServers: [
    /*
    {
      name: "github-mcp",
      url: "https://mcp.github.com",
      apiKey: process.env.MCP_API_KEY
    }
    */
  ],

  // Enabled AI & Collaboration Features
  features: [
    'ai', 'agent', 'plan', 'image-gen', 'collaboration'
  ]
});
`;

function init() {
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, 'tiptapaipro.config.ts');

  if (fs.existsSync(configPath)) {
    console.log('âœ… tiptapaipro.config.ts already exists.');
    return;
  }

  try {
    fs.writeFileSync(configPath, defaultConfig);
    console.log('âœ¨ Created tiptapaipro.config.ts in the root directory.');
    console.log('ðŸ“ Make sure to wrap your application with <TiptapAiProProvider config={config}>');
  } catch (error) {
    console.error('â Œ Failed to create config file:', error);
  }
}

const command = process.argv[2];

if (command === 'init') {
  init();
} else {
  console.log('Usage: npx tiptapaipro init');
}
