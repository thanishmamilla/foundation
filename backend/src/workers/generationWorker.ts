import { Worker, Job } from 'bullmq';
import { isMongoConnected } from '../db.js';
import { AssignmentModel, InMemoryAssignmentStore } from '../models/Assignment.js';
import { generateQuestionPaper } from '../services/aiService.js';
import { notifyAssignmentUpdate } from '../websocket.js';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export function initWorker(isRedisActive: boolean) {
  if (!isRedisActive) {
    console.log('ℹ️ Skipping BullMQ worker activation as Redis is inactive.');
    return null;
  }

  console.log('👷 [BullMQ] Starting background worker...');

  const worker = new Worker(
    'question-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;
      console.log(`👷 [BullMQ Worker] Processing job ${job.id} for assignment ${assignmentId}`);
      
      notifyAssignmentUpdate(assignmentId, 'generating', { progress: 10 });

      try {
        let assignment: any;
        if (isMongoConnected()) {
          assignment = await AssignmentModel.findById(assignmentId);
        } else {
          assignment = await InMemoryAssignmentStore.findById(assignmentId);
        }

        if (!assignment) {
          throw new Error(`Assignment with ID ${assignmentId} not found`);
        }

        // Set status to generating
        if (isMongoConnected()) {
          await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'generating' });
        } else {
          await InMemoryAssignmentStore.findByIdAndUpdate(assignmentId, { status: 'generating' });
        }
        
        notifyAssignmentUpdate(assignmentId, 'generating', { progress: 30 });
        await job.updateProgress(30);

        // Generate paper
        const { paper, answerKey } = await generateQuestionPaper(
          assignment.title,
          assignment.questionTypes,
          assignment.additionalInstructions
        );

        notifyAssignmentUpdate(assignmentId, 'generating', { progress: 80 });
        await job.updateProgress(80);

        // Save back
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
        await job.updateProgress(100);
        
        console.log(`👷 [BullMQ Worker] Job ${job.id} completed successfully for assignment ${assignmentId}`);
        return { success: true };

      } catch (error) {
        console.error(`👷 [BullMQ Worker] Job ${job.id} failed:`, error);
        
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
        throw error;
      }
    },
    {
      connection: new (IORedis as any)(REDIS_URL, {
        maxRetriesPerRequest: null,
      }),
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`❌ [BullMQ Worker] Job ${job?.id} failed with error:`, err);
  });

  return worker;
}
