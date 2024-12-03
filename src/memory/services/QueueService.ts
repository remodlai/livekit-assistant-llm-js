import { PubSub } from '@google-cloud/pubsub';
import { QueueMessage, QueueConfig } from '../types/queue';
import { PineconeClient } from './PineconeClient';

export class QueueService {
  private pubsub: PubSub;
  private pinecone: PineconeClient;
  private topicName: string;

  constructor(config: { topicName: string }) {
    this.pubsub = new PubSub();
    this.pinecone = new PineconeClient();
    this.topicName = config.topicName;
  }

  async queueVectorUpsert(vectors: any[], config: QueueConfig): Promise<{
    queued: number;
    batches: number;
    messageIds: string[];
  }> {
    const batchSize = 20;
    const messageIds: string[] = [];

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      const message: QueueMessage = {
        type: 'vector',
        data: batch,
        priority: config.priority || 'low',
        timestamp: new Date().toISOString(),
        metadata: {
          org_id: config.org_id
        }
      };

      const [messageId] = await this.pubsub
        .topic(this.topicName)
        .publish(Buffer.from(JSON.stringify(message)));

      messageIds.push(messageId);
    }

    return {
      queued: vectors.length,
      batches: messageIds.length,
      messageIds
    };
  }

  async processMessage(message: any): Promise<void> {
    const data: QueueMessage = JSON.parse(message.data.toString());

    switch (data.type) {
      case 'vector':
        await this.pinecone.upsert(data.data, {
          namespace_type: data.metadata?.org_id ? 'org' : 'remodl',
          org_id: data.metadata?.org_id
        });
        break;
      // Handle other types
    }

    message.ack();
  }
} 