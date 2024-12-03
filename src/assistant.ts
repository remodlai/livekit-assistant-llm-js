import OpenAI from 'openai';
import { AssistantTool, RunOptions, MessageContent, MessageMethods, MessageOptions } from './types';

export class AssistantLLM {
  private openai: OpenAI;
  private assistant_id: string;
  private thread_id?: string;
  private options: RunOptions;

  constructor(openai: OpenAI, options: RunOptions) {
    this.openai = openai;
    this.assistant_id = options.assistant_id;
    this.thread_id = options.thread_id;
    this.options = options;
  }

  createRun() {
    return new AssistantRun(this);
  }
}

class AssistantRun {
  private content: MessageContent[] = [];
  private assistant: AssistantLLM;

  constructor(assistant: AssistantLLM) {
    this.assistant = assistant;
  }

  messages: MessageMethods = {
    add: {
      text: (text: string, options?: MessageOptions) => {
        const content = options?.hidden 
          ? `${options.hiddenInstructions || DEFAULT_HIDDEN_PREFIX}${text}`
          : text;
          
        this.content.push({ type: 'text', text: content });
        return this;
      },
      image: {
        file: (fileId: string, options?: MessageOptions) => {
          if (options?.hidden) {
            // Add hidden text message first
            this.content.push({ 
              type: 'text', 
              text: `${options.hiddenInstructions || DEFAULT_HIDDEN_PREFIX}Image attached` 
            });
          }
          this.content.push({ type: 'image_file', file_id: fileId });
          return this;
        },
        url: (url: string, options?: MessageOptions) => {
          this.content.push({ type: 'image_url', url });
          return this;
        }
      }
    },

    remove: {
      text: (text: string) => {
        this.content = this.content.filter(c => 
          !(c.type === 'text' && c.text === text)
        );
        return this;
      },
      image: {
        file: (fileId: string) => {
          this.content = this.content.filter(c => 
            !(c.type === 'image_file' && c.file_id === fileId)
          );
          return this;
        },
        url: (url: string) => {
          this.content = this.content.filter(c => 
            !(c.type === 'image_url' && c.url === url)
          );
          return this;
        }
      }
    },

    clear: {
      all: () => {
        this.content = [];
        return this;
      },
      images: () => {
        this.content = this.content.filter(c => 
          !['image_file', 'image_url'].includes(c.type)
        );
        return this;
      },
      text: () => {
        this.content = this.content.filter(c => c.type !== 'text');
        return this;
      }
    }
  };

  async execute(options?: { stream?: boolean }) {
    // Implementation
  }
} 