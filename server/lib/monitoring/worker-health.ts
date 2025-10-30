
import { supabaseAdmin } from '../supabase-admin';

interface WorkerHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastRun: Date | null;
  lastError: string | null;
  runCount: number;
  errorCount: number;
}

class WorkerHealthMonitor {
  private workers: Map<string, WorkerHealth> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Register a worker for health monitoring
   */
  registerWorker(name: string): void {
    this.workers.set(name, {
      name,
      status: 'healthy',
      lastRun: null,
      lastError: null,
      runCount: 0,
      errorCount: 0
    });
  }

  /**
   * Record successful worker run
   */
  recordSuccess(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.lastRun = new Date();
      worker.runCount++;
      worker.status = 'healthy';
      worker.lastError = null;
    }
  }

  /**
   * Record worker error
   */
  recordError(name: string, error: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.errorCount++;
      worker.lastError = error;
      worker.status = worker.errorCount > 3 ? 'failed' : 'degraded';
      
      // Alert admin if worker fails
      if (worker.status === 'failed') {
        this.alertAdmin(name, error);
      }
    }
  }

  /**
   * Get health status of all workers
   */
  getHealthStatus(): WorkerHealth[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get health status of specific worker
   */
  getWorkerHealth(name: string): WorkerHealth | null {
    return this.workers.get(name) || null;
  }

  /**
   * Start health check monitoring
   */
  start(): void {
    if (this.checkInterval) return;

    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    console.log('✅ Worker health monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Perform health check on all workers
   */
  private performHealthCheck(): void {
    const now = new Date();
    
    for (const worker of this.workers.values()) {
      // If worker hasn't run in 30 minutes, mark as degraded
      if (worker.lastRun) {
        const timeSinceLastRun = now.getTime() - worker.lastRun.getTime();
        const minutesSinceLastRun = timeSinceLastRun / (1000 * 60);
        
        if (minutesSinceLastRun > 30 && worker.status === 'healthy') {
          worker.status = 'degraded';
          console.warn(`⚠️ Worker ${worker.name} hasn't run in ${minutesSinceLastRun.toFixed(0)} minutes`);
        }
      }
    }
  }

  /**
   * Alert admin about worker failure
   */
  private async alertAdmin(workerName: string, error: string): Promise<void> {
    console.error(`🚨 WORKER FAILURE: ${workerName} - ${error}`);
    
    // Create admin notification in database
    if (supabaseAdmin) {
      try {
        // Get admin users
        const { data: admins } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('role', 'admin');
        
        if (admins) {
          for (const admin of admins) {
            await supabaseAdmin.from('notifications').insert({
              user_id: admin.id,
              type: 'worker_failure',
              title: `Worker Failure: ${workerName}`,
              message: `The ${workerName} worker has failed. Error: ${error}`,
              read: false
            });
          }
        }
      } catch (err) {
        console.error('Error creating admin alert:', err);
      }
    }
  }
}

export const workerHealthMonitor = new WorkerHealthMonitor();
