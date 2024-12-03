# Migration Guide

## Migrating from LiveKit Implementation

### Key Changes
1. Removed LiveKit dependencies
2. Simplified message handling
3. Added direct file support
4. Enhanced memory integration

### Step-by-Step Migration

1. Update Imports
```typescript
// Old
import { AssistantLLM } from '@livekit/agents-plugin-assistant';

// New
import { AssistantLLM } from '@remodl/assistant-llm';
```

2. Update Initialization
```typescript
// Old
const llm = new AssistantLLM({
  load_options: {
    assistant_id: 'YOUR_ASSISTANT_ID'
  }
});

// New
const assistant = new AssistantLLM(openai, {
  assistant_id: "YOUR_ASSISTANT_ID",
  model: "gpt-4o-2024-08-06"
});
```

3. Update Message Handling
```typescript
// Old
for await (const chunk of llm.process('Hello')) {
  console.log(chunk);
}

// New
const run = assistant.createRun();
run.messages.add.text('Hello');
await run.execute({ stream: true });
```

### Breaking Changes
1. Removed `process()` method
2. Changed tool configuration
3. Updated event handling
4. Modified streaming interface

### New Features
1. Hidden messages
2. File vectorization
3. Progressive memory
4. Voice capabilities 