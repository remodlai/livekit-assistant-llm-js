import type { Agent } from '@livekit/agents';
import type OpenAI from 'openai';

export interface JobContext {
  input: string;
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

export type AssistantTool = OpenAI.Beta.Assistants.AssistantTool;

export type BuiltInToolType = 'code_interpreter' | 'file_search' | 'function';

export interface FileSearchConfig {
  max_num_results?: number;
  ranking_options?: {
    score_threshold?: number;
    ranker?: 'auto' | 'semantic' | 'lexical';
  };
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: {
        type: string;
        enum?: string[];
      };
    }>;
    required?: string[];
  };
}

export type ToolFunctionHandler = (args: any) => Promise<any>;

export interface ToolFunction {
  definition: FunctionDefinition;
  handler: ToolFunctionHandler;
}

export interface BuiltInTool {
  type: BuiltInToolType;
  file_search?: Partial<FileSearchConfig>;
  function?: ToolFunction;
}

export interface AssistantLoadOptions {
  assistant_id: string;
  thread_id?: string;
}

export interface ResponseFormat {
  type: 'text' | 'json_object';
  schema?: object;  // JSON Schema when type is json_object
}

export type ToolChoice = 'none' | 'auto' | { type: 'function'; function: { name: string } };

export interface RunOptions extends AssistantLoadOptions {
  additional_instructions?: string;
  tools?: BuiltInTool[];
  response_format?: ResponseFormat;
  strict?: boolean;
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } };
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface RunState {
  run: OpenAI.Beta.Threads.Run;
  messages: OpenAI.Beta.Threads.Message[];
}

// Helper function to convert BuiltInTool to AssistantTool
export function convertToAssistantTool(tool: BuiltInTool): AssistantTool {
  if (tool.type === 'function' && tool.function) {
    return {
      type: 'function',
      function: tool.function.definition
    };
  }
  return { type: tool.type } as AssistantTool;
}

// Export OpenAI type for convenience
export type { OpenAI };

// Export Agent type
export type { Agent }; 