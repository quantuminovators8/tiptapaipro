# TiptapAiPro

A production-ready, AI-powered WYSIWYG editor built with Tiptap, React, and Tailwind CSS 4.

## Features

- **AI-Powered Writing**: Generate, rewrite, and continue text using Gemini.
- **AI Agent Mode**: Ask the agent to format text, insert tables, or perform research.
- **Plan Mode**: Research-driven document planning and autonomous execution.
- **Image Generation**: Generate high-quality images directly within the editor.
- **Collaboration**: Built-in discussion threads and comment summarization.
- **Modern Stack**: Built with React 19, Tiptap, and Tailwind CSS 4.

## Installation

```bash
npm install tiptapaipro
```

## Setup

After installing, initialize the configuration file in your project root:

```bash
npx tiptapaipro init
```

This creates a `tiptapaipro.config.ts` file where you can configure API keys, custom tools, and MCP servers.

## Usage

Wrap your application (or the editor) with the `TiptapAiProProvider` and pass the config:

```tsx
import { AiEditor, TiptapAiProProvider } from 'tiptapaipro';
import config from '../tiptapaipro.config'; // Import your config

const MyEditor = () => {
  return (
    <TiptapAiProProvider config={config}>
      <AiEditor 
        onChange={(content) => console.log(content)}
      />
    </TiptapAiProProvider>
  );
};
```

## Configuration (tiptapaipro.config.ts)

The configuration file allows you to:

- **Configure AI Providers**: Set default provider (Gemini, OpenAI, etc.), API keys, and model IDs.
- **Add Custom Tools**: Define custom functions that the AI Agent can call.
- **Add MCP Servers**: Connect to external Model Context Protocol servers for specialized tools and context.
- **Feature Flags**: Enable or disable specific editor features globally.

Example:

```ts
import { defineConfig } from 'tiptapaipro';

export default defineConfig({
  ai: {
    provider: 'gemini',
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
  tools: [
    {
      name: "fetchUserData",
      description: "Fetch user data from the database",
      parameters: {
        type: "OBJECT",
        properties: {
          userId: { type: "STRING" }
        }
      }
    }
  ],
  mcpServers: [
    {
      name: "github-mcp",
      url: "https://mcp.github.com"
    }
  ]
});
```

## Configuration

The `AiEditor` component accepts the following props:

- `initialContent`: Initial HTML or JSON content.
- `onChange`: Callback function when content changes.
- `aiConfig`: Configuration for the AI services (Gemini, OpenAI, etc.).
- `features`: Array of enabled features (`'ai'`, `'image-gen'`, `'collaboration'`, `'agent'`, `'plan'`).
- `classNames`: Custom CSS classes for various editor parts.
- `placeholder`: Placeholder text.
- `readOnly`: Whether the editor is in read-only mode.

## License

Apache-2.0
