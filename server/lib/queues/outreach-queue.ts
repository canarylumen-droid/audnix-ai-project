import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from './redis-config.js';
import { outreachEngine } from '../workers/outreach-engine.js';

// 1. Define Queues
export const outreachQueue = new Queue('outreach-tasks', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
} as any);

export const followUpQueue = new Queue('follow-up-tasks', {
    connection: redisConnection as any,
} as any);

// 2. Define Workers
export const outreachWorker = new Worker(
    'outreach-tasks',
    async (job: Job) => {
        const { userId, type } = job.data;
        console.log(`[QueueWorker] Processing outreach job for user ${userId} (${type})`);

        // We call the engine's internal processor directly
        // This allows the task to be decoupled from the interval tick
        if (type === 'campaign') {
            await (outreachEngine as any).tickCampaigns(userId);
        } else if (type === 'autonomous') {
            await (outreachEngine as any).tickAutonomousOutreach(userId);
        }
    },
    {
        connection: redisConnection as any,
        concurrency: 10,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 }
    } as any
);

outreachWorker.on('completed', (job) => {
    console.log(`[QueueWorker] Job ${job.id} completed`);
});

outreachWorker.on('failed', (job, err) => {
    console.error(`[QueueWorker] Job ${job?.id} failed:`, err);
});

console.log('✅ BullMQ Outreach Worker initialized');
