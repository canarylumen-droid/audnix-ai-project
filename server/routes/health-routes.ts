import { Router } from 'express';
import { workerHealthMonitor } from '../lib/monitoring/worker-health.js';
import { quotaService } from '../lib/monitoring/quota-service.js';

const router = Router();

/**
 * Health check route for background workers and system status
 */
router.get('/status', (req, res) => {
  const workers = workerHealthMonitor.getHealthStatus();
  const allHealthy = workers.every((w: any) => w.status === 'healthy');

  res.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    workers
  });
});

export default router;
