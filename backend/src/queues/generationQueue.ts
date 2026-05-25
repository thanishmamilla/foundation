import { Queue } from 'bullmq';
import { isMongoConnected, connectDB } from '../db.js';
import { notifyAssignmentUpdate } from '../websocket.js';
import { generateQuestionPaper } from '../services/aiService.js';
import { AssignmentModel, InMemoryAssignmentStore } from '../models/Assignment.js';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let isRedisConnected = false;
let generationQueue: Queue | null = null;

// Test Redis connection
const testRedisConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const client = new (IORedis as any)(REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });

      client.on('connect', () => {
        isRedisConnected = true;
        client.disconnect();
        resolve(true);
      });

      client.on('error', (err: any) => {
        isRedisConnected = false;
        client.disconnect();
        resolve(false);
      });
    } catch (e) {
      resolve(false);
    }
  });
};

export async function initQueue() {
  const redisOk = await testRedisConnection();
  if (redisOk) {
    console.log('✅ Redis is active. Initializing BullMQ.');
    generationQueue = new Queue('question-generation', {
      connection: new (IORedis as any)(REDIS_URL, {
        maxRetriesPerRequest: null,
      }),
    });
  } else {
    console.warn('⚠️ Redis is unavailable. Falling back to In-Memory background job worker.');
  }
}

// In-memory queue handler to simulate BullMQ asynchronously
async function processInMemoryJob(assignmentId: string) {
  console.log(`⏳ [In-Memory Queue] Processing job for assignment: ${assignmentId}...`);
  notifyAssignmentUpdate(assignmentId, 'generating', { progress: 10 });

  try {
    let assignment: any;
    
    // Retrieve assignment
    if (isMongoConnected()) {
      assignment = await AssignmentModel.findById(assignmentId);
    } else {
      assignment = await InMemoryAssignmentStore.findById(assignmentId);
    }

    if (!assignment) {
      console.error(`❌ [In-Memory Queue] Assignment ${assignmentId} not found.`);
      return;
    }

    // Update state to generating
    if (isMongoConnected()) {
      await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'generating' });
    } else {
      await InMemoryAssignmentStore.findByIdAndUpdate(assignmentId, { status: 'generating' });
    }
    
    notifyAssignmentUpdate(assignmentId, 'generating', { progress: 30 });

    // Simulate work/delay of AI generation
    await new Promise((r) => setTimeout(r, 2000));
    notifyAssignmentUpdate(assignmentId, 'generating', { progress: 50 });

    // Call AI Generation (or mock fallback inside aiService)
    const { paper, answerKey } = await generateQuestionPaper(
      assignment.title,
      assignment.questionTypes,
      assignment.additionalInstructions
    );

    notifyAssignmentUpdate(assignmentId, 'generating', { progress: 80 });
    await new Promise((r) => setTimeout(r, 1000));

    // Update assignment in database
    if (isMongoConnected()) {
      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        paper,
        answerKey,
      });
    } else {
      await InMemoryAssignmentStore.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        paper,
        answerKey,
      });
    }

    notifyAssignmentUpdate(assignmentId, 'completed', { paper, answerKey });
    console.log(`✅ [In-Memory Queue] Successfully completed generation for ${assignmentId}`);

  } catch (error) {
    console.error(`❌ [In-Memory Queue] Failed to process job for ${assignmentId}:`, error);
    
    if (isMongoConnected()) {
      await AssignmentModel.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        error: (error as Error).message,
      });
    } else {
      await InMemoryAssignmentStore.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        error: (error as Error).message,
      });
    }

    notifyAssignmentUpdate(assignmentId, 'failed', { error: (error as Error).message });
  }
}

export async function addGenerationJob(assignmentId: string): Promise<void> {
  if (generationQueue) {
    console.log(`📦 [BullMQ] Adding generation job to Redis queue for assignment: ${assignmentId}`);
    await generationQueue.add('generate-paper', { assignmentId });
  } else {
    console.log(`📦 [In-Memory Queue] Queueing async simulation for assignment: ${assignmentId}`);
    // Run asynchronously to avoid blocking API response
    setTimeout(() => {
      processInMemoryJob(assignmentId).catch(console.error);
    }, 100);
  }
}

export function isRedisAvailable(): boolean {
  return isRedisConnected;
}
