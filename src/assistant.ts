import OpenAI from 'openai';
import { AssistantTool, RunOptions, MessageContent, MessageMethods, MessageOptions } from './types';
import { MemorySystem, MemoryMetadata, ProgressiveMemoryFactory } from './types/memory';

export class AssistantLLM {
  private openai: OpenAI;
  private assistant_id: string;
  private thread_id?: string;
  private options: RunOptions;
  private memory: MemorySystem;

  constructor(openai: OpenAI, options: RunOptions) {
    this.openai = openai;
    this.assistant_id = options.assistant_id;
    this.thread_id = options.thread_id;
    this.options = options;
    this.memory = new ProgressiveMemoryFactory();
  }

  createRun() {
    return new AssistantRun(this);
  }

  // Memory methods
  async storeMemory(content: string, metadata: MemoryMetadata) {
    return this.memory.store.memory(content, metadata);
  }

  async searchMemory(query: string) {
    return this.memory.search.semantic(query);
  }

  async startTraining(sequence: TrainingSequence) {
    return this.memory.training.sequence.start(sequence);
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
      },
      file: {
        attachment: async (file: File, options?: MessageOptions & {
          vectorize?: boolean;
          namespace?: string;
        }) => {
          // 1. Upload to OpenAI
          const fileResponse = await this.assistant.openai.files.create({
            file,
            purpose: 'assistants'
          });

          // 2. Vectorize if requested
          if (options?.vectorize) {
            const vector = await generateVector(file);
            await upsertToPinecone({
              id: fileResponse.id,
              vector,
              metadata: {
                name: file.name,
                type: file.type,
                size: file.size
              },
              namespace: options.namespace
            });
          }

          // 3. Add to content
          this.content.push({
            type: 'file_attachment',
            file_id: fileResponse.id,
            metadata: {
              name: file.name,
              type: file.type,
              size: file.size,
              vectorized: options?.vectorize,
              pinecone_namespace: options?.namespace
            }
          });

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