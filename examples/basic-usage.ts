import OpenAI from 'openai';
import { AssistantLLM } from '../src';
import weatherTool from '../src/tools/weather';
import calculatorTool from '../src/tools/calculator';

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Initialize assistant with tools
  const assistant = new AssistantLLM(openai, {
    load_options: {
      assistant_id: 'asst_...' // Your assistant ID
    },
    tools: [
      {
        type: 'function',
        function: weatherTool
      },
      {
        type: 'function',
        function: calculatorTool
      }
    ]
  });

  await assistant.init();

  // Process with auto tool choice
  console.log('Processing with auto tool choice...');
  for await (const response of assistant.process(
    'What is the weather in London and what is 5 plus 3?',
    {
      tool_choice: 'auto'
    }
  )) {
    if (typeof response === 'string') {
      console.log('Assistant:', response);
    } else {
      console.log('Tool call:', response);
    }
  }

  // Process with required tool
  console.log('\nProcessing with required calculator tool...');
  for await (const response of assistant.process(
    'What is 10 divided by 2?',
    {
      tool_choice: {
        type: 'function',
        function: { name: 'calculate' }
      }
    }
  )) {
    if (typeof response === 'string') {
      console.log('Assistant:', response);
    } else {
      console.log('Tool call:', response);
    }
  }
}

main().catch(console.error); 