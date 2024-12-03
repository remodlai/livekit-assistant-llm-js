// Core training types
export interface TrainingStep {
  id: string;
  content: string;
  order: number;
  completed: boolean;
}

// Base training data
export interface TrainingBase {
  id: string;
  title: string;
  description: string;
  training_level: 'core' | 'org_core' | 'contextual';
  metadata?: {
    thread_id: string;
    assistant_id: string;
    org_id?: string;
  };
}

// Stored training sequence
export interface TrainingSequence extends TrainingBase {
  steps: TrainingStep[];
  exceptions: Array<{
    content: string;
    related_step: number;
  }>;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// Training operations
export interface TrainingOperation {
  action: 'init' | 'add_step' | 'add_exception' | 'complete';
  sequence_id?: string;
  title?: string;
  description?: string;
  training_level?: 'core' | 'org_core' | 'contextual';
  step_content?: string;
  step_number?: number;
  exception_content?: string;
  related_step?: number;
  context: {
    thread_id: string;
    assistant_id: string;
    org_id?: string;
  };
} 