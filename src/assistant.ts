import { Agent, JobContext } from '@livekit/agents';
import { AssistantTool, convertToAssistantTool, RunOptions } from './types';
import OpenAI from 'openai';

export class AssistantLLM implements Agent {
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

  async init() {
    if (!this.thread_id) {
      const thread = await this.openai.beta.threads.create();
      this.thread_id = thread.id;
    }

    if (this.options.tools || this.options.response_format) {
      await this.openai.beta.assistants.update(this.assistant_id, {
        tools: this.options.tools?.map(convertToAssistantTool) as AssistantTool[],
        response_format: this.options.response_format
      });
    }
  }

  async handleInput(input: string) {
    await this.openai.beta.threads.messages.create(this.thread_id!, {
      role: 'user',
      content: input
    });

    const run = await this.openai.beta.threads.runs.create(this.thread_id!, {
      assistant_id: this.assistant_id,
      additional_instructions: this.options?.additional_instructions,
      tools: this.options?.tools?.map(convertToAssistantTool) as AssistantTool[]
    });

    let currentRun = run;
    while (currentRun.status === 'queued' || currentRun.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentRun = await this.openai.beta.threads.runs.retrieve(this.thread_id!, currentRun.id);
    }

    if (currentRun.status === 'completed') {
      const messages = await this.openai.beta.threads.messages.list(this.thread_id!);
      const lastMessage = messages.data[0];
      const textContent = lastMessage.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content found in response');
      }
      return textContent.text.value;
    } else {
      throw new Error(`Run failed with status: ${currentRun.status}`);
    }
  }

  async entry(ctx: JobContext): Promise<void> {
    await this.init();
    
    const input = ctx.room.localParticipant?.metadata;
    if (!input) {
      throw new Error('No input provided');
    }

    try {
      const response = await this.handleInput(input);
      await ctx.room.localParticipant?.publishData(
        Buffer.from(JSON.stringify({ type: 'text', content: response })),
        { reliable: true }
      );
    } catch (error) {
      await ctx.room.localParticipant?.publishData(
        Buffer.from(JSON.stringify({ type: 'error', content: error })),
        { reliable: true }
      );
    }
  }
} 