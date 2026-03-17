import { Queue, Worker, Job } from 'bullmq';
import { redisConnection, hasRedis } from './redis-config.js';
import { outreachEngine } from '../workers/outreach-engine.js';

// 1. Define Queues
export const outreachQueue = hasRedis ? new Queue('outreach-tasks', {
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
} as any) : null;

export const followUpQueue = hasRedis ? new Queue('follow-up-tasks', {
    connection: redisConnection as any,
} as any) : null;

// 2. Define Workers
export const outreachWorker = hasRedis ? new Worker(
    'outreach-tasks',
    async (job: Job) => {
        const { userId, type } = job.data;
        console.log(`[QueueWorker] Processing outreach job for user ${userId} (${type})`);

        if (type === 'autonomous') {
            await (outreachEngine as any).tickAutonomousOutreach(userId);
        }
    },
    {
        connection: redisConnection as any,
        concurrency: 10,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 }
    } as any
) : null;

if (outreachWorker) {
    outreachWorker.on('completed', (job) => {
        console.log(`[QueueWorker] Job ${job.id} completed`);
    });

    outreachWorker.on('failed', (job, err) => {
        console.error(`[QueueWorker] Job ${job?.id} failed:`, err);
    });

    console.log('✅ BullMQ Outreach Worker initialized');
} else {
    console.warn('⚠️ BullMQ Outreach Worker disabled (No Redis)');
}
