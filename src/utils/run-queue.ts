export class RunQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  async add(task: () => Promise<void>): Promise<void> {
    if (this.isProcessing) {
      return new Promise<void>((resolve) => {
        this.queue.push(async () => {
          await task();
          resolve();
        });
      });
    }

    this.isProcessing = true;
    try {
      await task();
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  private async processNext() {
    if (this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (nextTask) {
        this.isProcessing = true;
        try {
          await nextTask();
        } finally {
          this.isProcessing = false;
          this.processNext();
        }
      }
    }
  }
} 