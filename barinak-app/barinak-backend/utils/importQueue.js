const Queue = require('bull');

// Enhanced queue configuration with retry and persistence
const importJobQueue = new Queue('import-job', {
  redis: { 
    host: '127.0.0.1', 
    port: 6379,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100
  },
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 20,     // Keep last 20 failed jobs for debugging
    attempts: 3,          // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,        // Start with 2s delay, then 4s, 8s
    },
    delay: 0
  }
});

// Image optimization queue
const imageOptimizeQueue = new Queue('image-optimize', {
  redis: { 
    host: '127.0.0.1', 
    port: 6379,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    }
  }
});

// Error handling and logging
importJobQueue.on('failed', (job, err) => {
  console.error(`Import job ${job.id} failed:`, err.message);
  console.log(`Job will be retried. Attempt ${job.attemptsMade}/${job.opts.attempts}`);
});

imageOptimizeQueue.on('failed', (job, err) => {
  console.error(`Image optimize job ${job.id} failed:`, err.message);
  console.log(`Job will be retried. Attempt ${job.attemptsMade}/${job.opts.attempts}`);
});

importJobQueue.on('completed', (job) => {
  console.log(`Import job ${job.id} completed successfully`);
});

imageOptimizeQueue.on('completed', (job) => {
  console.log(`Image optimize job ${job.id} completed successfully`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down queues gracefully...');
  await importJobQueue.close();
  await imageOptimizeQueue.close();
  process.exit(0);
});

module.exports = { importJobQueue, imageOptimizeQueue };
