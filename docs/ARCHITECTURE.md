# Architecture Overview

## Core Components

### Message Handling
Messages use a fluent API that builds an OpenAI-compatible content array:

```typescript
// Internal structure
interface MessageContent {
  type: 'text' | 'image_file' | 'image_url' | 'file_attachment';
  text?: string;
  file_id?: string;
  url?: string;
  metadata?: {
    hidden?: boolean;
    uiHidden?: boolean;
    timestamp?: number;
    file?: FileMetadata;
  };
}
```

### File Management
Files follow a strict pipeline:

1. Upload to OpenAI
```typescript
const fileResponse = await openai.files.create({
  file,
  purpose: 'assistants'
});
```

2. Optional Vectorization
```typescript
if (options.vectorize) {
  const vector = await generateVector(file);
  await upsertToPinecone({
    id: fileResponse.id,
    vector,
    metadata: { /* ... */ }
  });
}
```

3. Message Attachment
```typescript
this.content.push({
  type: 'file_attachment',
  file_id: fileResponse.id,
  metadata: { /* ... */ }
});
```

### Hidden Messages
Hidden messages use a prefix system:
```typescript
const DEFAULT_PREFIX = "THIS IS A HIDDEN SECRET MESSAGE FOR YOU: ";

// Custom prefixes for different purposes
const prefixes = {
  MEMORY: "MEMORY CONTEXT - USE THIS TO UPDATE YOUR UNDERSTANDING: ",
  SYSTEM: "SYSTEM UPDATE - PROCESS THIS AS CONFIGURATION: ",
  // ...
};
```

## Type System

### Base Types
Core types that avoid circular dependencies:
```typescript
// In types/base.ts
export interface MessageContent { /* ... */ }
export interface MessageOptions { /* ... */ }
export type RunReturn = any;  // Placeholder
```

### Implementation Types
Types that depend on implementation:
```typescript
// In types.ts
export interface MessageMethods { /* ... */ }
export interface RunOptions { /* ... */ }
```

## Integration Points

### OpenAI Assistant API
Direct integration with:
- Thread management
- Message handling
- File uploads
- Tool execution

### Pinecone Vector DB
Used for:
- File vectorization
- Semantic search
- Progressive memory

### Voice Processing
Supports:
- Speech-to-text
- Text-to-speech
- Voice activity detection

### Progressive Memory
Integrates with:
- Vector storage
- Context management
- Learning systems 