/**
 * Task Queue System with BullMQ and Redis
 * Gerencia filas de trabalho com prioridade, retry e dead letter queue
 * 
 * NOTA: Redis é OPCIONAL. Se não estiver disponível, as operações retornam mocks.
 */

import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';

// Lazy-load Redis connection - só conecta quando usado
let connection: Redis | null = null;
let connectionAttempted = false;

function getConnection(): Redis | null {
  // Durante build time ou SSG, não tenta conectar
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    return null;
  }
  
  if (connection) return connection;
  if (connectionAttempted) return null;
  
  connectionAttempted = true;
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl && process.env.NODE_ENV === 'production') {
    console.log('[TaskQueue] REDIS_URL not configured, queue features disabled');
    return null;
  }
  
  try {
    connection = new Redis(redisUrl || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });
    
    connection.on('error', (err) => {
      console.error('[TaskQueue] Redis error:', err.message);
    });
    
    return connection;
  } catch (error) {
    console.error('[TaskQueue] Failed to initialize Redis:', error);
    return null;
  }
}

export enum JobPriority {
  URGENT = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

export interface CrewJobData {
  crewType: string;
  clientId: string;
  params: any;
  userId?: string;
  requestedAt: string;
}

export interface JobProgressData {
  percent: number;
  step: string;
  message?: string;
}

// ============================================================================
// CREW QUEUE (Lazy initialization)
// ============================================================================

let _crewQueue: Queue<CrewJobData> | null = null;
let _deadLetterQueue: Queue<any> | null = null;
let _crewWorker: Worker<CrewJobData> | null = null;

function getCrewQueue(): Queue<CrewJobData> | null {
  const conn = getConnection();
  if (!conn) return null;
  
  if (!_crewQueue) {
    _crewQueue = new Queue<CrewJobData>('crew-jobs', {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600,
          count: 100,
        },
        removeOnFail: {
          age: 86400,
          count: 500,
        },
      },
    });
  }
  return _crewQueue;
}

// For backwards compatibility - wrapper with fallbacks
export const crewQueue = {
  add: async (name: string, data: CrewJobData, opts?: any) => {
    const queue = getCrewQueue();
    if (!queue) {
      console.warn('[TaskQueue] Redis not available, job not queued');
      return { id: `mock-${Date.now()}`, data };
    }
    return queue.add(name, data, opts);
  },
  getJob: async (id: string) => {
    const queue = getCrewQueue();
    return queue?.getJob(id) || null;
  },
  getJobs: async (states: any[]) => {
    const queue = getCrewQueue();
    return queue?.getJobs(states) || [];
  },
  getWaiting: async (start?: number, end?: number) => {
    const queue = getCrewQueue();
    return queue?.getWaiting(start, end) || [];
  },
  getActive: async (start?: number, end?: number) => {
    const queue = getCrewQueue();
    return queue?.getActive(start, end) || [];
  },
  getCompleted: async (start?: number, end?: number) => {
    const queue = getCrewQueue();
    return queue?.getCompleted(start, end) || [];
  },
  getFailed: async (start?: number, end?: number) => {
    const queue = getCrewQueue();
    return queue?.getFailed(start, end) || [];
  },
  getDelayed: async (start?: number, end?: number) => {
    const queue = getCrewQueue();
    return queue?.getDelayed(start, end) || [];
  },
  getWaitingCount: async () => {
    const queue = getCrewQueue();
    return queue?.getWaitingCount() || 0;
  },
  getActiveCount: async () => {
    const queue = getCrewQueue();
    return queue?.getActiveCount() || 0;
  },
  getCompletedCount: async () => {
    const queue = getCrewQueue();
    return queue?.getCompletedCount() || 0;
  },
  getFailedCount: async () => {
    const queue = getCrewQueue();
    return queue?.getFailedCount() || 0;
  },
  getDelayedCount: async () => {
    const queue = getCrewQueue();
    return queue?.getDelayedCount() || 0;
  },
  pause: async () => {
    const queue = getCrewQueue();
    return queue?.pause();
  },
  resume: async () => {
    const queue = getCrewQueue();
    return queue?.resume();
  },
  clean: async (grace: number, limit: number, type: string) => {
    const queue = getCrewQueue();
    return queue?.clean(grace, limit, type as any) || [];
  },
  close: async () => {
    const queue = getCrewQueue();
    return queue?.close();
  },
};

// Dead Letter Queue (lazy)
function getDeadLetterQueue(): Queue<any> | null {
  const conn = getConnection();
  if (!conn) return null;
  
  if (!_deadLetterQueue) {
    _deadLetterQueue = new Queue('crew-jobs-failed', {
      connection: conn,
    });
  }
  return _deadLetterQueue;
}

export const deadLetterQueue = {
  add: async (name: string, data: any, opts?: any) => {
    const queue = getDeadLetterQueue();
    if (!queue) {
      console.warn('[TaskQueue] Redis not available for dead letter queue');
      return { id: `mock-dlq-${Date.now()}`, data };
    }
    return queue.add(name, data, opts);
  },
};

// ============================================================================
// CREW WORKER (Lazy initialization - only created if Redis is available)
// ============================================================================

function initializeWorker(): Worker<CrewJobData> | null {
  const conn = getConnection();
  if (!conn) {
    console.log('[TaskQueue] Redis not available, worker not started');
    return null;
  }
  
  if (_crewWorker) return _crewWorker;
  
  _crewWorker = new Worker<CrewJobData>(
    'crew-jobs',
    async (job: Job<CrewJobData>) => {
      const { crewType, clientId, params } = job.data;
      
      console.log(`[CrewWorker] Processing job ${job.id} - ${crewType} for client ${clientId}`);
      
      try {
        const { executeCrew } = await import('../orchestrator/masterOrchestrator');
        
        await job.updateProgress({ percent: 10, step: 'initializing', message: 'Crew iniciando...' } as JobProgressData);
        
        const result = await executeCrew(crewType, clientId, params, {
          onProgress: async (percent: number, step: string, message?: string) => {
            await job.updateProgress({ percent, step, message } as JobProgressData);
          },
        });
        
        await job.updateProgress({ percent: 100, step: 'completed', message: 'Concluído!' } as JobProgressData);
        
        return result;
      } catch (error: any) {
        console.error(`[CrewWorker] Job ${job.id} failed:`, error);
        
        if (job.attemptsMade >= (job.opts.attempts || 3)) {
          await deadLetterQueue.add(
            `failed-${job.id}`,
            {
              ...job.data,
              error: error.message,
              failedAt: new Date().toISOString(),
              attempts: job.attemptsMade,
            },
            { priority: JobPriority.LOW }
          );
        }
        
        throw error;
      }
    },
    {
      connection: conn,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 60000,
      },
    }
  );
  
  return _crewWorker;
}

// Export a getter for the worker
export const crewWorker = {
  get instance() { return initializeWorker(); },
  isRunning: () => _crewWorker !== null,
};

// ============================================================================
// QUEUE EVENTS (Lazy)
// ============================================================================

let _queueEvents: QueueEvents | null = null;

function getQueueEvents(): QueueEvents | null {
  const conn = getConnection();
  if (!conn) return null;
  
  if (!_queueEvents) {
    _queueEvents = new QueueEvents('crew-jobs', { connection: conn });
  }
  return _queueEvents;
}

export const queueEvents = {
  get instance() { return getQueueEvents(); },
  on: (event: string, callback: (...args: any[]) => void) => {
    const events = getQueueEvents();
    if (events) {
      // Use type assertion for dynamic event binding
      (events as any).on(event, callback);
    }
  },
};

queueEvents.on('completed', async ({ jobId, returnvalue }) => {
  console.log(`[Queue] Job ${jobId} completed successfully`);
  
  // Notificar usuário via WebSocket ou outra forma
  // await notifyUser(jobId, 'completed', returnvalue);
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  console.error(`[Queue] Job ${jobId} failed: ${failedReason}`);
  
  // Notificar usuário
  // await notifyUser(jobId, 'failed', { error: failedReason });
});

queueEvents.on('progress', async ({ jobId, data }) => {
  const progressData = data as JobProgressData;
  console.log(`[Queue] Job ${jobId} progress: ${progressData.percent}% - ${progressData.step}`);
  
  // Atualizar UI em tempo real
  // await notifyUserProgress(jobId, progressData);
});

queueEvents.on('waiting', async ({ jobId }) => {
  console.log(`[Queue] Job ${jobId} is waiting in queue`);
});

queueEvents.on('active', async ({ jobId }) => {
  console.log(`[Queue] Job ${jobId} is now active`);
});

// ============================================================================
// QUEUE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Add a crew job to the queue
 * Returns Job if Redis is available, or a mock object with id/data if not
 */
export async function addCrewJob(
  crewType: string,
  clientId: string,
  params: any,
  priority: JobPriority = JobPriority.NORMAL,
  userId?: string
): Promise<Job<CrewJobData> | { id: string; data: CrewJobData }> {
  return await crewQueue.add(
    `crew-${crewType}-${Date.now()}`,
    {
      crewType,
      clientId,
      params,
      userId,
      requestedAt: new Date().toISOString(),
    },
    {
      priority,
      jobId: `${crewType}_${clientId}_${Date.now()}`,
    }
  );
}

/**
 * Add a scheduled crew job (cron)
 */
export async function addScheduledCrewJob(
  crewType: string,
  clientId: string,
  params: any,
  cronExpression: string, // e.g., '0 9 * * 1' (every Monday at 9am)
  priority: JobPriority = JobPriority.NORMAL
): Promise<Job<CrewJobData> | { id: string; data: CrewJobData }> {
  return await crewQueue.add(
    `scheduled-${crewType}`,
    {
      crewType,
      clientId,
      params,
      requestedAt: new Date().toISOString(),
    },
    {
      priority,
      repeat: {
        pattern: cronExpression,
      },
    }
  );
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const job = await crewQueue.getJob(jobId);
  if (!job) return null;
  
  const state = await job.getState();
  const progress = job.progress; // progress é uma propriedade, não uma função
  
  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    attemptsMade: job.attemptsMade,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    returnvalue: job.returnvalue,
  };
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await crewQueue.getJob(jobId);
  if (!job) return false;
  
  await job.remove();
  return true;
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<Job<CrewJobData> | null> {
  const job = await crewQueue.getJob(jobId);
  if (!job) return null;
  
  await job.retry();
  return job;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    crewQueue.getWaitingCount(),
    crewQueue.getActiveCount(),
    crewQueue.getCompletedCount(),
    crewQueue.getFailedCount(),
    crewQueue.getDelayedCount(),
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Get jobs by status
 */
export async function getJobsByStatus(
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
  start: number = 0,
  end: number = 10
) {
  let jobs: Job[] = [];
  
  switch (status) {
    case 'waiting':
      jobs = await crewQueue.getWaiting(start, end);
      break;
    case 'active':
      jobs = await crewQueue.getActive(start, end);
      break;
    case 'completed':
      jobs = await crewQueue.getCompleted(start, end);
      break;
    case 'failed':
      jobs = await crewQueue.getFailed(start, end);
      break;
    case 'delayed':
      jobs = await crewQueue.getDelayed(start, end);
      break;
  }
  
  return jobs.map(job => ({
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress, // progress é uma propriedade, não uma função
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  }));
}

/**
 * Pause the queue
 */
export async function pauseQueue(): Promise<void> {
  await crewQueue.pause();
  console.log('[Queue] Queue paused');
}

/**
 * Resume the queue
 */
export async function resumeQueue(): Promise<void> {
  await crewQueue.resume();
  console.log('[Queue] Queue resumed');
}

/**
 * Clean old jobs
 */
export async function cleanQueue(grace: number = 3600000) {
  // Clean completed jobs older than grace period (default 1 hour)
  await crewQueue.clean(grace, 100, 'completed');
  
  // Clean failed jobs older than 24 hours
  await crewQueue.clean(86400000, 100, 'failed');
  
  console.log('[Queue] Queue cleaned');
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown() {
  console.log('[Queue] Shutting down gracefully...');
  
  if (_crewWorker) {
    await _crewWorker.close();
  }
  
  if (_crewQueue) {
    await _crewQueue.close();
  }
  
  if (_deadLetterQueue) {
    await _deadLetterQueue.close();
  }
  
  if (_queueEvents) {
    await _queueEvents.close();
  }
  
  if (connection) {
    await connection.quit();
  }
}

// Only register shutdown handler in Node.js environment (not during build)
if (typeof process !== 'undefined' && process.on && process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', async () => {
    await gracefulShutdown();
    process.exit(0);
  });
}
