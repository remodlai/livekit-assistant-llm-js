import { AssistantLLM } from '../src/assistant';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('AssistantLLM', () => {
  let llm: AssistantLLM;
  const mockOptions = {
    load_options: {
      assistant_id: 'test-assistant',
      thread_id: 'test-thread'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    llm = new AssistantLLM(mockOptions);
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(llm).toBeInstanceOf(AssistantLLM);
    });
  });

  describe('process', () => {
    const mockRun = {
      id: 'test-run',
      status: 'completed'
    };

    const mockMessage = {
      role: 'assistant',
      content: [{ type: 'text', text: { value: 'test response' } }]
    };

    beforeEach(() => {
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        beta: {
          threads: {
            messages: {
              create: jest.fn().mockResolvedValue({}),
              list: jest.fn().mockResolvedValue({ data: [mockMessage] })
            },
            runs: {
              create: jest.fn().mockResolvedValue(mockRun),
              retrieve: jest.fn().mockResolvedValue(mockRun),
              cancel: jest.fn().mockResolvedValue({}),
              submitToolOutputs: jest.fn().mockResolvedValue({})
            }
          }
        }
      } as any));
    });

    it('should process input and yield response', async () => {
      const chunks: string[] = [];
      for await (const chunk of llm.process('test input')) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(['test response']);
    });

    it('should handle additional instructions', async () => {
      const mockCreateRun = jest.fn().mockResolvedValue(mockRun);
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        beta: {
          threads: {
            messages: {
              create: jest.fn().mockResolvedValue({}),
              list: jest.fn().mockResolvedValue({ data: [mockMessage] })
            },
            runs: {
              create: mockCreateRun,
              retrieve: jest.fn().mockResolvedValue(mockRun),
              cancel: jest.fn().mockResolvedValue({}),
              submitToolOutputs: jest.fn().mockResolvedValue({})
            }
          }
        }
      } as any));

      for await (const _ of llm.process('test input', true, 'test instructions')) {
        // consume generator
      }

      expect(mockCreateRun).toHaveBeenCalledWith(
        'test-thread',
        expect.objectContaining({
          assistant_id: 'test-assistant',
          additional_instructions: 'test instructions'
        })
      );
    });

    it('should handle interruptions', async () => {
      const processPromise = llm.process('test input');
      await llm.interrupt();
      const chunks: string[] = [];
      for await (const chunk of processPromise) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeLessThanOrEqual(1);
    });
  });

  describe('tool calls', () => {
    const mockToolCall = {
      id: 'test-tool',
      type: 'function',
      function: {
        name: 'test_function',
        arguments: '{"test": true}'
      }
    };

    const mockRunWithToolCall = {
      id: 'test-run',
      status: 'requires_action',
      required_action: {
        submit_tool_outputs: {
          tool_calls: [mockToolCall]
        }
      }
    };

    beforeEach(() => {
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        beta: {
          threads: {
            messages: {
              create: jest.fn().mockResolvedValue({}),
              list: jest.fn().mockResolvedValue({ data: [] })
            },
            runs: {
              create: jest.fn().mockResolvedValue(mockRunWithToolCall),
              retrieve: jest.fn()
                .mockResolvedValueOnce(mockRunWithToolCall)
                .mockResolvedValue({ status: 'completed' }),
              submitToolOutputs: jest.fn().mockResolvedValue({})
            }
          }
        }
      } as any));
    });

    it('should handle tool calls', async () => {
      let toolCallReceived = false;
      llm.onToolCallCreated = async (toolCall) => {
        toolCallReceived = true;
        expect(toolCall).toEqual(mockToolCall);
        return { result: 'success' };
      };

      const chunks: string[] = [];
      for await (const chunk of llm.process('test input')) {
        chunks.push(chunk);
      }

      expect(toolCallReceived).toBe(true);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        beta: {
          threads: {
            messages: {
              create: jest.fn().mockRejectedValue(new Error('API Error'))
            },
            runs: {}
          }
        }
      } as any));
    });

    it('should handle API errors', async () => {
      await expect(async () => {
        for await (const _ of llm.process('test input')) {
          // consume generator
        }
      }).rejects.toThrow('API Error');
    });
  });
}); 