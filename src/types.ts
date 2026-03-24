/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AiProvider = 'gemini' | 'openai' | 'openrouter' | 'custom';

export interface McpServerConfig {
  name: string;
  url: string;
  apiKey?: string;
}

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  modelId?: string;
  customEndpoint?: string;
  onAiError?: (error: Error) => void;
  enableWebSearch?: boolean;
}

export interface EditorConfig {
  placeholder?: string;
  autofocus?: boolean;
  editable?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface FormattingConfig {
  enabledTools?: EditorFeature[];
  customColors?: string[];
  customHighlights?: string[];
}

export interface AgentConfig {
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TiptapAiProConfig {
  ai?: Partial<AiConfig>;
  tools?: any[]; // FunctionDeclaration[]
  mcpServers?: McpServerConfig[];
  features?: EditorFeature[];
  editor?: EditorConfig;
  formatting?: FormattingConfig;
  agent?: AgentConfig;
}

export type EditorFeature = 
  | 'bold' 
  | 'italic' 
  | 'underline' 
  | 'strike' 
  | 'heading' 
  | 'blockquote' 
  | 'list' 
  | 'table' 
  | 'align' 
  | 'color' 
  | 'highlight' 
  | 'image' 
  | 'video' 
  | 'link' 
  | 'ai'
  | 'image-gen'
  | 'collaboration'
  | 'agent'
  | 'plan';

export interface AiEditorProps {
  /** Initial content for the editor (HTML or JSON) */
  initialContent?: string | object;
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** AI Configuration */
  aiConfig?: AiConfig;
  /** List of features to enable. If undefined, all features are enabled. */
  features?: EditorFeature[];
  /** Custom class names for various parts of the editor */
  classNames?: {
    container?: string;
    editor?: string;
    toolbar?: string;
    bubbleMenu?: string;
  };
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
}

export interface AiAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}
