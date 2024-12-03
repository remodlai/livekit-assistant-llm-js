export interface MemoryContent {
  type: string;
  content: string;
  content_type: string;
  importance: 'high' | 'medium' | 'low';
  context?: {
    thread_id?: string;
    assistant_id?: string;
    org_id?: string;
    project_id?: string;
    property_id?: string;
  };
}

export interface SearchConfig {
  search_type: 'explicit' | 'background';
  content_types: string[];
  max_depth: number;
  min_score: number;
  search_scope: 'org' | 'global' | 'both';
  check_progressive: boolean;
  active_scope: 'general' | 'property' | 'project' | 'task' | 'training';
  scope_metadata?: {
    scope_id?: string;
    scope_name?: string;
    scope_start: string;
    previous_scope?: string;
  };
}

export interface TrainingConfig {
  title: string;
  description: string;
  training_level: 'core' | 'org_core' | 'contextual';
  sequence_id?: string;
  step_content?: string;
  step_number?: number;
  exception_content?: string;
  related_step?: number;
} 