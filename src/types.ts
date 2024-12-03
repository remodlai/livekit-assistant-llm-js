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

export interface BuiltInTool {
  type: BuiltInToolType;
  file_search?: Partial<FileSearchConfig>;
}

export interface AssistantLoadOptions {
  assistant_id: string;
  thread_id?: string;
}

export interface AssistantOptions extends LLMOptions {
  load_options: AssistantLoadOptions;
  tools?: BuiltInTool[];
}

export interface RunOptions {
  additional_instructions?: string;
  tools?: BuiltInTool[];
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