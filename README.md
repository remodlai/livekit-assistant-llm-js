# @livekit/agents-plugin-assistant

A LiveKit Agents plugin for OpenAI's Assistant API, providing real-time streaming responses and tool integration.

## Features

- 🔄 Real-time streaming responses
- 🛠️ Built-in tool support (code_interpreter, file_search, function)
- 🧵 Automatic thread management
- ⚡ Interruption handling
- 🔄 Run queue management
- 🎯 Per-run tool configuration

## Installation

```bash
npm install @livekit/agents-plugin-assistant
```

## Quick Start

```typescript
import { AssistantLLM } from '@livekit/agents-plugin-assistant';

// Initialize with auto-created thread
const llm = new AssistantLLM({
  load_options: {
    assistant_id: 'YOUR_ASSISTANT_ID'
    // thread_id is optional - will create new thread if not provided
  },
  tools: [
    { type: 'code_interpreter' },
    { type: 'file_search' },
    {
      type: 'function',
      function: {
        name: 'search_knowledge_base',
        description: 'Search the knowledge base for relevant information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of results to return'
            }
          },
          required: ['query']
        }
      }
    }
  ]
});

// Handle function calls
llm.onToolCallCreated = async (toolCall) => {
  if (toolCall.type === 'function' && toolCall.function.name === 'search_knowledge_base') {
    const args = JSON.parse(toolCall.function.arguments);
    // Implement your function logic here
    return { results: ['result1', 'result2'] };
  }
  return null;
};

// Process messages with streaming response
try {
  for await (const chunk of llm.process(
    'Tell me about TypeScript',
    true, // allow interruption
    'Be concise' // additional instructions
  )) {
    process.stdout.write(chunk);
  }
} catch (error) {
  console.error('Error:', error);
}
```

## Configuration

### Assistant Options

```typescript
interface AssistantOptions {
  load_options: {
    assistant_id: string;    // Required: Your OpenAI Assistant ID
    thread_id?: string;      // Optional: Existing thread ID
  };
  tools?: BuiltInTool[];     // Optional: Default tools for all runs
}
```

### Built-in Tools

```typescript
// Available tool types
type BuiltInToolType = 'code_interpreter' | 'file_search' | 'function';

// Basic tool configuration
const tools = [
  { type: 'code_interpreter' },
  { type: 'file_search' }
];

// File search with optional configuration
const fileSearchTool = { 
  type: 'file_search',
  file_search: {
    max_num_results?: number;
    ranking_options?: {
      score_threshold?: number;
      ranker?: 'auto' | 'semantic' | 'lexical';
    }
  }
};

// Function tool configuration
const functionTool = {
  type: 'function',
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: {
        [key: string]: {
          type: string;
          description: string;
          enum?: string[];      // Optional: list of allowed values
          items?: {             // For array types
            type: string;
            enum?: string[];
          };
        };
      };
      required?: string[];      // Optional: list of required parameters
    };
  }
};
```

## Advanced Usage

### Using Custom Functions

```typescript
const llm = new AssistantLLM({
  load_options: {
    assistant_id: 'YOUR_ASSISTANT_ID'
  },
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name or coordinates'
            },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature unit'
            }
          },
          required: ['location']
        }
      }
    }
  ]
});

// Handle function calls
llm.onToolCallCreated = async (toolCall) => {
  if (toolCall.type === 'function') {
    const args = JSON.parse(toolCall.function.arguments);
    switch (toolCall.function.name) {
      case 'get_weather':
        return await getWeather(args.location, args.unit);
      // Add more function handlers
    }
  }
  return null;
};
```

### Using Existing Thread

```typescript
const llm = new AssistantLLM({
  load_options: {
    assistant_id: 'YOUR_ASSISTANT_ID',
    thread_id: 'EXISTING_THREAD_ID'
  }
});
```

### Run-specific Tools

```typescript
for await (const chunk of llm.process(
  'Analyze this code and check the weather',
  true,
  'Be concise',
  [ // Run-specific tools
    { type: 'code_interpreter' },
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location name'
            }
          },
          required: ['location']
        }
      }
    }
  ]
)) {
  process.stdout.write(chunk);
}
```

### Interruption Handling

```typescript
const llm = new AssistantLLM({...});

// Start processing
const processPromise = llm.process('Long task...');

// Interrupt after 5 seconds
setTimeout(() => {
  llm.interrupt();
}, 5000);

// Handle the response
try {
  for await (const chunk of processPromise) {
    process.stdout.write(chunk);
  }
} catch (error) {
  console.error('Error:', error);
}
```

## Error Handling

The plugin provides specific error types for better error handling:

```typescript
import { AssistantError, RunError, InterruptionError } from '@livekit/agents-plugin-assistant';

try {
  for await (const chunk of llm.process('...')) {
    process.stdout.write(chunk);
  }
} catch (error) {
  if (error instanceof RunError) {
    console.error('Run failed:', error.runId);
  } else if (error instanceof InterruptionError) {
    console.log('Process was interrupted');
  } else if (error instanceof AssistantError) {
    console.error('Assistant error:', error.message);
  }
}
```

## Requirements

- Node.js >= 20.0.0
- OpenAI API key with Assistant API access
- LiveKit Agents ^0.11.3

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache-2.0 - see LICENSE file for details. 