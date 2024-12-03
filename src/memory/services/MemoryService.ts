import { PineconeClient } from './PineconeClient';
import { FirestoreClient } from './FirestoreClient';
import { MemoryContent, SearchConfig, TrainingConfig } from '../types';
import { QueueService } from './QueueService';

export class MemoryService {
  constructor(
    private pinecone: PineconeClient,
    private firestore: FirestoreClient,
    private queue: QueueService
  ) {}

  async storeMemory(params: StoreMemory) {
    // Queue for async processing
    await this.queue.add({
      type: 'memory',
      data: params
    });
  }

  async searchMemory(params: SearchMemory) {
    // Direct search - no queue
    return await this.pinecone.search(params);
  }

  async manageTraining(params: TrainingSequence) {
    // Direct training - no queue
    return await this.firestore.training(params);
  }
} 