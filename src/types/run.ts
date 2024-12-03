import { AssistantRun } from '../assistant';

export interface MessageMethods {
  add: {
    text: (text: string, options?: MessageOptions) => AssistantRun;
    image: {
      file: (fileId: string, options?: MessageOptions) => AssistantRun;
      url: (url: string, options?: MessageOptions) => AssistantRun;
    };
  };
  // ... rest of methods
} 