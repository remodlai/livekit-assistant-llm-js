export class AssistantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssistantError';
  }
}

export class RunError extends AssistantError {
  constructor(message: string, public runId: string) {
    super(`Run ${runId} failed: ${message}`);
    this.name = 'RunError';
  }
}

export class InterruptionError extends AssistantError {
  constructor() {
    super('Operation interrupted');
    this.name = 'InterruptionError';
  }
} 