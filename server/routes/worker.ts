import { Request, Response, Router } from 'express';
import { followUpWorker } from '../lib/ai/follow-up-worker';
import { supabaseAdmin } from '../lib/supabase-admin';

const router = Router();

/**
 * Start the follow-up worker
 */
router.post('/worker/start', async (req: Request, res: Response) => {
  try {
    // Check if user is admin (implement your auth logic)
    const userId = (req as any).session?.userId || req.body.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Start the worker
    followUpWorker.start();
    
    res.json({ 
      success: true, 
      message: 'Follow-up worker started successfully' 
    });
  } catch (error) {
    console.error('Error starting worker:', error);
    res.status(500).json({ error: 'Failed to start worker' });
  }
});

/**
 * Stop the follow-up worker
 */
router.post('/worker/stop', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const userId = (req as any).session?.userId || req.body.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Stop the worker
    followUpWorker.stop();
    
    res.json({ 
      success: true, 
      message: 'Follow-up worker stopped successfully' 
    });
  } catch (error) {
    console.error('Error stopping worker:', error);
    res.status(500).json({ error: 'Failed to stop worker' });
  }
});

/**
 * Get worker status
 */
router.get('/worker/status', async (req: Request, res: Response) => {
  try {
    const isRunning = (followUpWorker as any).isRunning || false;
    
    // Get queue statistics if Supabase is configured
    let queueStats = null;
    if (supabaseAdmin) {
      const { data: pending } = await supabaseAdmin
        .from('follow_up_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const { data: processing } = await supabaseAdmin
        .from('follow_up_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing');
      
      const { data: completed } = await supabaseAdmin
        .from('follow_up_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('processed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      queueStats = {
        pending: pending?.length || 0,
        processing: processing?.length || 0,
        completedLast24h: completed?.length || 0,
      };
    }
    
    res.json({
      isRunning,
      queueStats,
      message: isRunning ? 'Worker is running' : 'Worker is stopped'
    });
  } catch (error) {
    console.error('Error getting worker status:', error);
    res.status(500).json({ error: 'Failed to get worker status' });
  }
});

/**
 * Manually trigger follow-up for a specific lead
 */
router.post('/worker/trigger/:leadId', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const userId = (req as any).session?.userId || req.body.user_id;
    
    if (!userId || !leadId || !supabaseAdmin) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Get lead details
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', userId)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Create follow-up job
    const { error: queueError } = await supabaseAdmin
      .from('follow_up_queue')
      .insert({
        user_id: userId,
        lead_id: leadId,
        channel: lead.channel,
        scheduled_at: new Date().toISOString(),
        context: {
          manual_trigger: true,
          triggered_by: userId,
        }
      });

    if (queueError) {
      throw queueError;
    }

    res.json({
      success: true,
      message: 'Follow-up scheduled successfully'
    });
  } catch (error) {
    console.error('Error triggering follow-up:', error);
    res.status(500).json({ error: 'Failed to trigger follow-up' });
  }
});

export default router;