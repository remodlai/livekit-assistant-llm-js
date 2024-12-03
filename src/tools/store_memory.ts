import { ToolFunction } from '../types';

interface StoreMemoryArgs {
  content: string;
  metadata: {
    type: string;
    importance: 'high' | 'medium' | 'low';
    goal_status?: {
      achieved: boolean;
      status: 'completed' | 'in_progress' | 'blocked' | 'pending';
      completion_criteria: string[];
      next_steps: string[];
    };
  };
  context: {
    thread_id: string;
    assistant_id: string;
    org_id?: string;
    project_id?: string;
    property_id?: string;
    user_id?: string;
  };
}

const storeMemory: ToolFunction = {
  definition: {
    name: "store_memory",
    description: "Store important information from conversations in structured memory",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The content to store in memory"
        },
        metadata: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "The type of memory to store"
            },
            importance: {
              type: "string",
              enum: ["high", "medium", "low"]
            },
            goal_status: {
              type: "object",
              properties: {
                achieved: { type: "boolean" },
                status: { 
                  type: "string",
                  enum: ["completed", "in_progress", "blocked", "pending"]
                },
                completion_criteria: {
                  type: "array",
                  items: { type: "string" }
                },
                next_steps: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["achieved", "status", "completion_criteria", "next_steps"]
            }
          },
          required: ["type", "importance"]
        },
        context: {
          type: "object",
          properties: {
            thread_id: { type: "string" },
            assistant_id: { type: "string" },
            org_id: { type: "string" },
            project_id: { type: "string" },
            property_id: { type: "string" },
            user_id: { type: "string" }
          },
          required: ["thread_id", "assistant_id"]
        }
      },
      required: ["content", "metadata", "context"]
    }
  },
  handler: async (args: StoreMemoryArgs) => {
    // Implementation of memory storage logic here
    // This is just an example - replace with actual implementation
    console.log('Storing memory:', args);
    
    return {
      success: true,
      memory_id: `memory_${Date.now()}`,
      content: args.content
    };
  }
};

export default storeMemory; 