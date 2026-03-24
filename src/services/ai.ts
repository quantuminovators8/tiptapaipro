/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AiConfig } from "../types";

/**
 * Tool definitions for the AI Agent to control the editor.
 */
const editorTools: FunctionDeclaration[] = [
  {
    name: "applyFormatting",
    description: "Apply formatting to the current selection in the editor.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        format: {
          type: Type.STRING,
          enum: ["bold", "italic", "underline", "strike", "blockquote", "code"],
          description: "The type of formatting to apply."
        },
        action: {
          type: Type.STRING,
          enum: ["toggle", "set", "unset"],
          description: "The action to perform (default: toggle)."
        }
      },
      required: ["format"]
    }
  },
  {
    name: "setHeading",
    description: "Set the current line as a heading.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.NUMBER,
          description: "The heading level (1-6)."
        }
      },
      required: ["level"]
    }
  },
  {
    name: "insertTable",
    description: "Insert a table into the editor.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        rows: { type: Type.NUMBER, description: "Number of rows." },
        cols: { type: Type.NUMBER, description: "Number of columns." }
      },
      required: ["rows", "cols"]
    }
  },
  {
    name: "setTextAlign",
    description: "Set the text alignment for the current selection.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        alignment: {
          type: Type.STRING,
          enum: ["left", "center", "right", "justify"],
          description: "The alignment to apply."
        }
      },
      required: ["alignment"]
    }
  },
  {
    name: "insertLink",
    description: "Insert a link into the editor.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "The URL for the link." }
      },
      required: ["url"]
    }
  },
  {
    name: "setColor",
    description: "Set the text color or the background highlight color for the current selection.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        color: { 
          type: Type.STRING, 
          description: "The hex color code (e.g., '#ff0000' for red, '#00ff00' for green)." 
        },
        type: {
          type: Type.STRING,
          enum: ["text", "highlight"],
          description: "Specify 'text' for font color or 'highlight' for background color."
        }
      },
      required: ["color", "type"]
    }
  },
  {
    name: "insertList",
    description: "Insert a bullet or ordered list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["bullet", "ordered"],
          description: "The type of list to insert."
        }
      },
      required: ["type"]
    }
  },
  {
    name: "insertHorizontalRule",
    description: "Insert a horizontal rule (divider) into the editor.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "summarizeDiscussion",
    description: "Summarize a discussion thread or a set of comments within the editor context.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        threadId: { type: Type.STRING, description: "Optional ID of the thread to summarize." }
      }
    }
  },
  {
    name: "insertMedia",
    description: "Insert an image or video into the editor by URL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "The URL of the media." },
        type: {
          type: Type.STRING,
          enum: ["image", "youtube"],
          description: "The type of media to insert."
        }
      },
      required: ["url", "type"]
    }
  }
];

/**
 * Service to handle AI requests across different providers.
 */
export async function executeAiAction(
  prompt: string,
  context: string,
  config: AiConfig,
  isAgent: boolean = false,
  customTools: any[] = [],
  mcpServers: any[] = [],
  agentConfig?: any
): Promise<{ text: string; toolCalls?: any[]; groundingMetadata?: any }> {
  const { provider, apiKey, modelId, onAiError, enableWebSearch } = config;

  const systemInstruction = agentConfig?.systemInstruction || (isAgent 
    ? `You are an expert AI Writing Assistant and Editor Agent. 
       Your goal is to help users create high-quality content by providing writing assistance, 
       applying complex formatting, and performing research.
       
       Capabilities:
       1. Writing: You can generate, rewrite, or continue text.
       2. Formatting: You have tools to apply bold, italic, headings, lists, tables, alignment, colors, links, and horizontal rules.
       3. Research: You can use web search to find information and provide sources.
       4. Media: You can insert images or YouTube videos by URL.
       5. Collaboration: You can summarize discussion threads or comments.
       6. Custom Tools: You have access to custom tools provided by the application.
       7. MCP Servers: You can access external Model Context Protocol (MCP) servers for additional context and tools.
       
       Guidelines:
       - Context is key. Always consider the provided editor context before acting.
       - If the user asks for a formatting change, use the appropriate tool.
       - If the user asks a question that requires current information, use the web search tool.
       - You can combine text generation with tool calls. For example, if asked to "Write a summary and make it a heading", you should provide the summary text AND call the setHeading tool.
       - When asked to "Suggest edits", act as a peer reviewer. Provide constructive feedback and use the editor context to make specific suggestions.
       - When asked to "Summarize discussion", look for conversational patterns in the context and provide a concise summary of key points.
       - Be concise and professional.
       - When using web search, always attribute your findings to the sources provided in the grounding metadata.`
    : `You are a helpful AI writing assistant. 
       Provide only the requested text modification or generation. 
       Do not include conversational filler or meta-commentary.`);

  const userPrompt = `Editor Context (Selected Text or Surrounding Content):
"""
${context}
"""

User Request:
${prompt}`;

  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const model = modelId || (isAgent ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview');
      
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: agentConfig?.temperature ?? 1,
          maxOutputTokens: agentConfig?.maxTokens,
          tools: [
            ...(isAgent ? [{ functionDeclarations: [...editorTools, ...customTools] }] : []),
            ...(enableWebSearch ? [{ googleSearch: {} }] : [])
          ],
          toolConfig: isAgent && enableWebSearch ? { includeServerSideToolInvocations: true } : undefined
        }
      });

      return {
        text: response.text || "",
        toolCalls: response.functionCalls,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } else {
      // Fallback for other providers (basic text only for now)
      const text = await (provider === 'openai' 
        ? callOpenAi(`${systemInstruction}\n\n${userPrompt}`, apiKey, modelId || 'gpt-4o')
        : provider === 'openrouter'
        ? callOpenRouter(`${systemInstruction}\n\n${userPrompt}`, apiKey, modelId || 'anthropic/claude-3-haiku')
        : callCustomEndpoint(`${systemInstruction}\n\n${userPrompt}`, apiKey, config.customEndpoint!)
      );
      return { text };
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (onAiError) onAiError(err);
    throw err;
  }
}

async function callOpenAi(prompt: string, apiKey: string, model: string, endpoint?: string): Promise<string> {
  const url = endpoint || "https://api.openai.com/v1/chat/completions";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "OpenAI API request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "OpenRouter API request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callCustomEndpoint(prompt: string, apiKey: string, endpoint: string): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Custom AI endpoint request failed");
  }

  const data = await response.json();
  return data.text || data.content || data.response || "";
}

/**
 * Service to generate images using Gemini.
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  config: {
    aspectRatio: string;
    imageSize: string;
    model?: string;
  }
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const model = config.model || 'gemini-3-pro-image-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio as any,
        imageSize: config.imageSize as any,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate image");
}

/**
 * Service to handle the Planning flow for the AI Agent.
 */
export async function executeAiPlan(
  action: 'generate' | 'execute',
  prompt: string,
  context: string,
  config: AiConfig,
  currentPlan?: string,
  userFeedback?: string,
  customTools: any[] = [],
  mcpServers: any[] = [],
  agentConfig?: any
): Promise<{ text: string; toolCalls?: any[]; groundingMetadata?: any }> {
  const { apiKey, modelId, enableWebSearch } = config;
  
  let systemInstruction = "";
  let userPrompt = "";

  if (action === 'generate') {
    systemInstruction = agentConfig?.systemInstruction || `You are an expert AI Planning Agent. 
      Your goal is to research the user's topic and create a comprehensive, step-by-step plan for writing a document.
      
      Guidelines:
      1. Research: Use web search to find relevant information, trends, and data.
      2. Planning: Create a structured plan with clear sections, key points, and suggested media (images/videos).
      3. Format: Present the plan clearly using markdown.
      4. Feedback: If user feedback is provided, adjust the plan accordingly.
      5. Finality: Your output should be ONLY the plan itself. Do not include conversational filler.
      6. Custom Tools: You have access to custom tools provided by the application.
      7. MCP Servers: You can access external Model Context Protocol (MCP) servers for additional context and tools.
      
      The plan should include:
      - Outline of sections
      - Key research findings to include
      - Suggested formatting (headings, tables, etc.)
      - Suggested media placements`;

    userPrompt = `Editor Context:
"""
${context}
"""

User Goal/Topic:
${prompt}

${userFeedback ? `User Feedback on Previous Plan:\n${userFeedback}` : ""}

${currentPlan ? `Current Plan to Refine:\n${currentPlan}` : ""}

Please generate a detailed plan based on the above.`;
  } else {
    systemInstruction = agentConfig?.systemInstruction || `You are an expert AI Writing Agent executing a finalized plan.
      Your goal is to write the document content exactly as specified in the plan, using all available tools.
      
      Capabilities:
      1. Writing: Generate high-quality text for each section.
      2. Formatting: Apply headings, bold, lists, tables, etc.
      3. Media: Insert images or YouTube videos by URL.
      4. Research: Use web search to verify facts or find specific details mentioned in the plan.
      5. Custom Tools: You have access to custom tools provided by the application.
      6. MCP Servers: You can access external Model Context Protocol (MCP) servers for additional context and tools.
      
      Guidelines:
      - Follow the plan strictly.
      - Use tools to apply the suggested formatting and insert media.
      - Write the content directly into the editor context.
      - Be comprehensive and professional.`;

    userPrompt = `Finalized Plan to Execute:
"""
${currentPlan}
"""

Editor Context:
"""
${context}
"""

Please execute the plan and write the document content.`;
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = modelId || 'gemini-3.1-pro-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature: agentConfig?.temperature ?? 1,
      maxOutputTokens: agentConfig?.maxTokens,
      tools: [
        { functionDeclarations: [...editorTools, ...customTools] },
        ...(enableWebSearch ? [{ googleSearch: {} }] : [])
      ],
      toolConfig: enableWebSearch ? { includeServerSideToolInvocations: true } : undefined
    }
  });

  return {
    text: response.text || "",
    toolCalls: response.functionCalls,
    groundingMetadata: response.candidates?.[0]?.groundingMetadata
  };
}
