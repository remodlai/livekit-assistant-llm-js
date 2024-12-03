import OpenAI from 'openai';
import { LLMOptions, LLM } from '@livekit/agents';
import { AssistantOptions, RunOptions, RunState, ToolCall, ToolChoice } from './types';

export class AssistantLLM implements LLM {
  private openai: OpenAI;
  private assistant_id: string;
  private thread_id: string;
  private options: AssistantOptions;

  constructor(openai: OpenAI, options: AssistantOptions) {
    this.openai = openai;
    this.options = options;
  }

  async init() {
    const { assistant_id, thread_id } = this.options.load_options;
    this.assistant_id = assistant_id;

    // Create or load thread
    if (thread_id) {
      this.thread_id = thread_id;
    } else {
      const thread = await this.openai.beta.threads.create();
      this.thread_id = thread.id;
    }

    // Update assistant if needed
    if (this.options.tools || this.options.response_format || this.options.tool_choice) {
      await this.openai.beta.assistants.update(this.assistant_id, {
        tools: this.options.tools,
        response_format: this.options.response_format,
        tool_choice: this.options.tool_choice
      });
    }
  }

  async *process(input: string, options?: RunOptions): AsyncGenerator<string | ToolCall> {
    // Add message to thread
    await this.openai.beta.threads.messages.create(this.thread_id, {
      role: 'user',
      content: input
    });

    // Create run with options
    const run = await this.openai.beta.threads.runs.create(this.thread_id, {
      assistant_id: this.assistant_id,
      additional_instructions: options?.additional_instructions,
      tools: options?.tools,
      response_format: options?.response_format,
      tool_choice: options?.tool_choice
    });

    // Track run state
    let currentRun = run;
    
    while (true) {
      // Get updated run state
      currentRun = await this.openai.beta.threads.runs.retrieve(this.thread_id, currentRun.id);

      // Handle completion
      if (currentRun.status === 'completed') {
        // Get messages added since last check
        const messages = await this.openai.beta.threads.messages.list(this.thread_id, {
          after: currentRun.created_at,
          order: 'asc'
        });

        // Yield each message content
        for (const message of messages.data) {
          for (const content of message.content) {
            if (content.type === 'text') {
              yield content.text.value;
            }
          }
        }
        break;
      }

      // Handle tool calls
      if (currentRun.status === 'requires_action' && currentRun.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
        for (const toolCall of toolCalls) {
          yield {
            id: toolCall.id,
            type: toolCall.type,
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments
            }
          };
        }
      }

      // Handle failures
      if (currentRun.status === 'failed') {
        throw new Error(`Run failed: ${currentRun.last_error?.message || 'Unknown error'}`);
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async submitToolOutputs(runId: string, outputs: Array<{ tool_call_id: string; output: string }>) {
    await this.openai.beta.threads.runs.submitToolOutputs(this.thread_id, runId, {
      tool_outputs: outputs
    });
  }

  getRunState(): RunState {
    return {
      run: null as any, // Will be implemented
      messages: [] // Will be implemented
    };
  }
} 