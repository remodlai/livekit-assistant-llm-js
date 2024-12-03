import type OpenAI from 'openai';
import { RunReturn, MessageOptions } from './types/base';

// Core Assistant Types
export interface AssistantLoadOptions {
  assistant_id: string;
  thread_id?: string;
}

export interface RunOptions extends AssistantLoadOptions {
  additional_instructions?: string;
  tools?: AssistantTool[];
  response_format?: OpenAI.Beta.AssistantCreateParams['response_format'];
}

export type AssistantTool = NonNullable<OpenAI.Beta.AssistantCreateParams['tools']>[number];

// Message Types
export interface MessageContent {
  type: 'text' | 'image_file' | 'image_url';
  text?: string;
  file_id?: string;
  url?: string;
}

export interface MessageOptions {
  hidden?: boolean;
  hiddenInstructions?: string;
}

export const DEFAULT_HIDDEN_PREFIX = "THIS IS A HIDDEN SECRET MESSAGE FOR YOU: ";

// Message handling types
export interface MessageMethods {
  add: {
    text: (text: string, options?: MessageOptions) => RunReturn;
    image: {
      file: (fileId: string, options?: MessageOptions) => RunReturn;
      url: (url: string, options?: MessageOptions) => RunReturn;
    };
  };
  remove: {
    text: (text: string) => RunReturn;
    image: {
      file: (fileId: string) => RunReturn;
      url: (url: string) => RunReturn;
    };
  };
  clear: {
    all: () => RunReturn;
    images: () => RunReturn;
    text: () => RunReturn;
  };
} 