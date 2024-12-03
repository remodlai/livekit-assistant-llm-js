import { LLMOptions } from '@livekit/agents';
import { ThreadMessage } from 'openai/resources/beta/threads/messages';
import { Run } from 'openai/resources/beta/threads/runs';

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

export interface BuiltInTool {
  type: BuiltInToolType;
  file_search?: Partial<FileSearchConfig>;
  function?: FunctionDefinition;
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

export interface AssistantOptions extends LLMOptions {
  load_options: AssistantLoadOptions;
  tools?: BuiltInTool[];
  response_format?: ResponseFormat;
  strict?: boolean;
  tool_choice?: ToolChoice;
}

export interface RunOptions {
  additional_instructions?: string;
  tools?: BuiltInTool[];
  response_format?: ResponseFormat;
  strict?: boolean;
  tool_choice?: ToolChoice;
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
  run: Run;
  messages: ThreadMessage[];
} 