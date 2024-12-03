# AssistantLLM

A powerful wrapper for OpenAI's Assistant API with support for:
- Progressive memory
- File handling and vectorization
- Hidden message patterns
- Voice capabilities

## Installation

```bash
npm install @remodl/assistant-llm
```

## Basic Usage

```typescript
import { AssistantLLM } from '@remodl/assistant-llm';

const assistant = new AssistantLLM(openai, {
  assistant_id: "asst_123",
  model: "gpt-4o-2024-08-06"  // Fixed version
});

// Basic message
const run = assistant.createRun();
run.messages
  .add.text("Here's the project site")
  .add.image.file("file_123");

// Hidden message
run.messages.add.text("User prefers formal tone", { 
  hidden: true 
});

await run.execute();
```

## Features

### File Handling

```typescript
// Upload and vectorize
await run.messages.add.file.attachment(pdfFile, {
  vectorize: true,
  namespace: 'project_docs'
});
```

### Hidden Messages

```typescript
// Custom hidden instruction
run.messages.add.text("Important context", {
  hidden: true,
  hiddenInstructions: "PROCESS AS BACKGROUND: "
});
```

### Message Management

```typescript
// Remove specific content
run.messages.remove.image.file("file_123");

// Clear categories
run.messages.clear.images();
run.messages.clear.text();
run.messages.clear.all();
```

## Documentation

[Full API Documentation](./docs/API.md)
[Architecture Overview](./docs/ARCHITECTURE.md)
[Migration Guide](./docs/MIGRATION.md) 