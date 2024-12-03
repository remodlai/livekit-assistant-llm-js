import OpenAI from 'openai';
import { LLMOptions, LLM } from '@livekit/agents';
import { AssistantOptions, RunOptions, RunState, ToolCall, ToolChoice, ToolFunction } from './types';

export class AssistantLLM implements LLM {
  private openai: OpenAI;
  private assistant_id!: string;
  private thread_id!: string;
  private options: AssistantOptions;
  private toolFunctions: Map<string, ToolFunction> = new Map();

  constructor(openai: OpenAI, options: AssistantOptions) {
    this.openai = openai;
    this.options = options;

    // Register tool functions from options
    if (options.tools) {
      for (const tool of options.tools) {
        if (tool.type === 'function' && tool.function) {
          this.toolFunctions.set(tool.function.definition.name, tool.function);
        }
      }
    }
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
        tools: this.options.tools?.map(tool => ({
          type: tool.type,
          function: tool.type === 'function' ? tool.function?.definition : undefined
        })),
        response_format: this.options.response_format,
        tool_choice: this.options.tool_choice
      });
    }
  }

  private async getNewMessages(after?: string): Promise<string[]> {
    const messages = await this.openai.beta.threads.messages.list(this.thread_id, {
      after,
      order: 'asc'
    });

    const textMessages: string[] = [];
    for (const message of messages.data) {
      for (const content of message.content) {
        if (content.type === 'text') {
          textMessages.push(content.text.value);
        }
      }
    }
    return textMessages;
  }

  async *process(input: string, options?: RunOptions): AsyncGenerator<string | ToolCall> {
    // Register any run-specific tool functions
    if (options?.tools) {
      for (const tool of options.tools) {
        if (tool.type === 'function' && tool.function) {
          this.toolFunctions.set(tool.function.definition.name, tool.function);
        }
      }
    }

    // Add message to thread
    await this.openai.beta.threads.messages.create(this.thread_id, {
      role: 'user',
      content: input
    });

    // Create run with options
    const run = await this.openai.beta.threads.runs.create(this.thread_id, {
      assistant_id: this.assistant_id,
      additional_instructions: options?.additional_instructions,
      tools: options?.tools?.map(tool => ({
        type: tool.type,
        function: tool.type === 'function' ? tool.function?.definition : undefined
      })),
      response_format: options?.response_format,
      tool_choice: options?.tool_choice
    });

    // Track run state and last message timestamp
    let currentRun = run;
    let lastMessageTime = run.created_at;
    
    while (true) {
      // Get updated run state
      currentRun = await this.openai.beta.threads.runs.retrieve(this.thread_id, currentRun.id);

      // Check for new messages first
      const newMessages = await this.getNewMessages(lastMessageTime);
      if (newMessages.length > 0) {
        for (const message of newMessages) {
          yield message;
        }
        // Update last message time to the most recent message
        const messages = await this.openai.beta.threads.messages.list(this.thread_id, {
          order: 'desc',
          limit: 1
        });
        if (messages.data.length > 0) {
          lastMessageTime = messages.data[0].created_at;
        }
      }

      // Handle completion
      if (currentRun.status === 'completed') {
        // Get any final messages
        const finalMessages = await this.getNewMessages(lastMessageTime);
        for (const message of finalMessages) {
          yield message;
        }
        break;
      }

      // Handle tool calls
      if (currentRun.status === 'requires_action' && currentRun.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          // Yield tool call first
          yield {
            id: toolCall.id,
            type: toolCall.type,
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments
            }
          };

          // Execute tool function
          const toolFunction = this.toolFunctions.get(toolCall.function.name);
          if (!toolFunction) {
            throw new Error(`Tool function ${toolCall.function.name} not found`);
          }

          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await toolFunction.handler(args);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(result)
            });
          } catch (error) {
            console.error(`Error executing tool function ${toolCall.function.name}:`, error);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: error.message })
            });
          }
        }

        // Submit all tool outputs together
        if (toolOutputs.length > 0) {
          await this.openai.beta.threads.runs.submitToolOutputs(
            this.thread_id,
            currentRun.id,
            { tool_outputs: toolOutputs }
          );
        }
      }

      // Handle failures
      if (currentRun.status === 'failed') {
        throw new Error(`Run failed: ${currentRun.last_error?.message || 'Unknown error'}`);
      }

      // Handle cancellation
      if (currentRun.status === 'cancelled') {
        break;
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