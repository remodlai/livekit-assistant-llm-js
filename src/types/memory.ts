// Core memory types
export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: MemoryMetadata;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  metadata?: Record<string, any>;
}

// Core Training Types
export interface TrainingStep {
  id: string;
  content: string;
  order: number;
  completed: boolean;
}

export interface TrainingBase {
  id: string;
  title: string;
  metadata?: Record<string, any>;
}

// For stored training sequences
export interface TrainingSequenceData extends TrainingBase {
  steps: TrainingStep[];
  status: 'pending' | 'in_progress' | 'completed';
}

// For training operations
export interface TrainingOperation {
  action: 'init' | 'add_step' | 'add_exception' | 'complete';
  sequence_id?: string;
  title?: string;
  description?: string;
  step_content?: string;
  step_number?: number;
  exception_content?: string;
  related_step?: number;
}

export interface TrainingValidator {
  validate(sequence: TrainingSequence): Promise<boolean>;
}

export interface TrainingStorage {
  save(sequence: TrainingSequence): Promise<void>;
  load(id: string): Promise<TrainingSequence>;
}

// Memory system
export interface MemorySystem {
  store: {
    memory(content: string, metadata: MemoryMetadata): Promise<void>;
    vector(data: any, namespace: string): Promise<void>;
    relationship(from: string, to: string, type: string): Promise<void>;
  };

  search: {
    semantic(query: string): Promise<SearchResult[]>;
    exact(query: string): Promise<SearchResult[]>;
    related(id: string, type: string): Promise<Relationship[]>;
  };

  training: {
    sequence: TrainingSequence;
    validate: TrainingValidator;
    store: TrainingStorage;
  };
}

// Memory metadata
export interface MemoryMetadata {
  type: string;
  content_type: string;
  importance?: 'high' | 'medium' | 'low';
  context?: {
    thread_id?: string;
    assistant_id?: string;
    org_id?: string;
  };
}

// Real-time operations
export interface SearchMemory {
  query: string;
  search_type: 'explicit' | 'background';
  context: {
    thread_id: string;
    check_progressive: true;  // Always true
    active_scope: string;
    scope_metadata?: {
      scope_id?: string;
    }
  }
}

export interface StoreMemory {
  content: {
    type: string;
    content: string;
    metadata: {
      thread_id: string;
      [key: string]: any;
    }
  }
} 