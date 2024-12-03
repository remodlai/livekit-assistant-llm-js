import { LLM } from '@livekit/agents';
import OpenAI from 'openai';
import { AssistantOptions, ToolCall, RunOptions, BuiltInTool } from './types';
import { RunQueue } from './utils/run-queue';
import { RunError, InterruptionError } from './utils/errors';

export class AssistantLLM extends LLM {
  private client: OpenAI;
  private assistant_id: string;
  private thread_id: string;
  private current_run: any | null = null;
  private runQueue = new RunQueue();
  private tools?: BuiltInTool[];
  private currentInterruption: {
    resolve: () => void;
    reject: (error: Error) => void;
  } | null = null;

  constructor(options: AssistantOptions) {
    super();
    this.client = new OpenAI();
    this.assistant_id = options.load_options.assistant_id;
    this.tools = options.tools;
  }

  async init(): Promise<void> {
    // If thread_id is provided, use it; otherwise create a new thread
    if (this.options?.load_options.thread_id) {
      this.thread_id = this.options.load_options.thread_id;
    } else {
      const thread = await this.client.beta.threads.create();
      this.thread_id = thread.id;
    }
  }

  async *process(
    input: string, 
    allowInterruption = true, 
    additional_instructions?: string,
    runTools?: BuiltInTool[]
  ): AsyncGenerator<string> {
    try {
      // Ensure thread is initialized
      if (!this.thread_id) {
        await this.init();
      }

      // Handle interruption if there's a current run
      if (allowInterruption && this.current_run) {
        await this.cancelCurrentRun();
        if (this.currentInterruption) {
          this.currentInterruption.resolve();
        }
      }

      // Set up interruption promise
      const interruptionPromise = allowInterruption ? new Promise<void>((resolve, reject) => {
        this.currentInterruption = { resolve, reject };
      }) : null;

      // Add message to thread
      await this.client.beta.threads.messages.create(this.thread_id, {
        role: 'user',
        content: input
      });

      // Create run with options
      const runOptions: any = {
        assistant_id: this.assistant_id
      };

      // Add additional instructions if present
      if (additional_instructions) {
        runOptions.additional_instructions = additional_instructions;
      }

      // Add tools - combine constructor tools with run-specific tools
      const combinedTools = [...(this.tools || []), ...(runTools || [])];
      if (combinedTools.length > 0) {
        runOptions.tools = combinedTools;
      }

      // Queue the run
      await this.runQueue.add(async () => {
        this.current_run = await this.client.beta.threads.runs.create(
          this.thread_id,
          runOptions
        );

        // Stream response with interruption handling
        try {
          for await (const chunk of this._streamResponse()) {
            yield chunk;

            // Check for interruption
            if (interruptionPromise) {
              const interrupted = await Promise.race([
                interruptionPromise,
                Promise.resolve(false)
              ]);
              if (interrupted) {
                break;
              }
            }
          }
        } catch (error) {
          if (error instanceof InterruptionError) {
            return;
          }
          throw error;
        }
      });

    } catch (error) {
      console.error('Error in process:', error);
      throw error;
    } finally {
      this.currentInterruption = null;
      this.current_run = null;
    }
  }

  private async *_streamResponse(): AsyncGenerator<string> {
    while (true) {
      const run = await this.client.beta.threads.runs.retrieve(
        this.thread_id,
        this.current_run.id
      );

      if (run.status === 'completed') {
        const messages = await this.client.beta.threads.messages.list(this.thread_id);
        const lastMessage = messages.data[0];
        if (lastMessage.role === 'assistant') {
          for (const content of lastMessage.content) {
            if (content.type === 'text') {
              yield content.text.value;
            }
          }
        }
        break;
      }

      if (run.status === 'requires_action' && run.required_action) {
        await this._handleToolCalls(run.required_action.submit_tool_outputs.tool_calls);
        continue;
      }

      if (run.status === 'failed') {
        throw new RunError(run.last_error?.message || 'Unknown error', run.id);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async _handleToolCalls(toolCalls: any[]) {
    const outputs = [];
    
    for (const toolCall of toolCalls) {
      const output = await this.onToolCallCreated?.(toolCall);
      outputs.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(output)
      });
    }

    await this.client.beta.threads.runs.submitToolOutputs(
      this.thread_id,
      this.current_run.id,
      { tool_outputs: outputs }
    );
  }

  async cancelCurrentRun() {
    if (this.current_run) {
      try {
        await this.client.beta.threads.runs.cancel(
          this.thread_id,
          this.current_run.id
        );
      } catch (error: any) {
        // If run is already completed, that's fine
        if (!error.message?.includes('already completed')) {
          throw error;
        }
      }
    }
  }

  async interrupt() {
    if (this.currentInterruption) {
      this.currentInterruption.resolve();
      await this.cancelCurrentRun();
    }
  }

  onToolCallCreated?(toolCall: ToolCall): Promise<any>;
} 