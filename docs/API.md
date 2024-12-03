# API Documentation

## AssistantLLM
The main class for interacting with OpenAI's Assistant API.

### Constructor
```typescript
new AssistantLLM(openai: OpenAI, options: RunOptions)
```

#### Options
```typescript
interface RunOptions {
  assistant_id: string;      // OpenAI Assistant ID
  thread_id?: string;        // Optional existing thread
  model: string;            // Always "gpt-4o-2024-08-06"
  tools?: AssistantTool[];  // Optional tools
}
```

### Methods

#### createRun()
Creates a new message run for building and executing messages.
```typescript
const run = assistant.createRun();
```

## AssistantRun
Handles message composition and execution.

### Message Methods

#### add
Add content to the message:

```typescript
// Text
run.messages.add.text("Hello", {
  hidden?: boolean;
  hiddenInstructions?: string;
});

// Images
run.messages.add.image.file("file_123");
run.messages.add.image.url("https://...");

// Files
run.messages.add.file.attachment(file, {
  vectorize?: boolean;
  namespace?: string;
});
```

#### remove
Remove content from the message:

```typescript
// Remove specific content
run.messages.remove.text("Hello");
run.messages.remove.image.file("file_123");
run.messages.remove.image.url("https://...");
```

#### clear
Clear message content:

```typescript
run.messages.clear.all();     // Clear everything
run.messages.clear.images();  // Clear only images
run.messages.clear.text();    // Clear only text
```

### Execution
```typescript
// Execute with options
await run.execute({
  stream?: boolean;    // Enable streaming
  tts?: boolean;       // Enable text-to-speech
});
``` 