export interface QueueMessage {
  type: 'vector' | 'memory' | 'training';
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  metadata?: {
    org_id?: string;
    thread_id?: string;
    assistant_id?: string;
  };
}

export interface QueueConfig {
  namespace_type: 'org' | 'remodl';
  org_id?: string;
  content_type?: string;
  priority?: 'high' | 'medium' | 'low';
} 