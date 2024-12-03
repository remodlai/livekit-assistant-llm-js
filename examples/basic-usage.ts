import { AssistantLLM } from '@livekit/agents-plugin-assistant';

async function main() {
  // Example 1: Auto-create thread
  const llmAutoThread = new AssistantLLM({
    load_options: {
      assistant_id: 'YOUR_ASSISTANT_ID'
      // thread_id not provided - will create new thread
    },
    tools: [
      { type: 'code_interpreter' },
      { type: 'file_search' }
    ]
  });

  // Example 2: Use existing thread
  const llmExistingThread = new AssistantLLM({
    load_options: {
      assistant_id: 'YOUR_ASSISTANT_ID',
      thread_id: 'EXISTING_THREAD_ID'  // Use existing thread
    },
    tools: [
      { type: 'code_interpreter' },
      { type: 'file_search' }
    ]
  });

  // Example with auto-created thread
  try {
    for await (const chunk of llmAutoThread.process(
      'Tell me about TypeScript',
      true,
      'Be concise'
    )) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Example with existing thread
  try {
    for await (const chunk of llmExistingThread.process(
      'What are the benefits of using TypeScript?',
      true,
      'Focus on practical examples'
    )) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 