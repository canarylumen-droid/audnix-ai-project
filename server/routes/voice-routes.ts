import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { voiceAI } from '../lib/ai/voice-ai-service';
import { uploadVoice } from '../lib/file-upload';
import multer from 'multer';

const router = Router();

/**
 * Upload voice samples and clone user's voice
 * POST /api/voice/clone
 */
router.post('/clone', requireAuth, uploadVoice.array('voice_samples', 3), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No voice samples uploaded. Please upload 1-3 audio files.' });
    }

    // Convert files to buffers
    const audioBuffers = files.map(file => file.buffer);

    // Clone voice with ElevenLabs
    const result = await voiceAI.cloneUserVoice(userId, audioBuffers);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to clone voice' });
    }

    res.json({
      message: 'Voice cloned successfully! Your AI will now use your voice for voice notes.',
      voiceId: result.voiceId
    });
  } catch (error: any) {
    console.error('Voice clone upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload and clone voice' });
  }
});

/**
 * Generate and send voice note to a specific lead
 * POST /api/voice/send/:leadId
 */
router.post('/send/:leadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { leadId } = req.params;

    const result = await voiceAI.generateAndSendVoiceNote(userId, leadId);

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to send voice note' });
    }

    res.json({
      message: 'Voice note sent successfully!',
      audioUrl: result.audioUrl,
      secondsUsed: result.secondsUsed
    });
  } catch (error: any) {
    console.error('Voice send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send voice note' });
  }
});

/**
 * Batch send voice notes to all warm leads
 * POST /api/voice/send-to-warm-leads
 */
router.post('/send-to-warm-leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const results = await voiceAI.sendVoiceNotesToWarmLeads(userId);

    res.json({
      message: `Processed ${results.processed} leads, sent ${results.sent} voice notes`,
      results
    });
  } catch (error: any) {
    console.error('Batch voice send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send voice notes' });
  }
});

/**
 * Check voice usage and limits (in minutes)
 * GET /api/voice/usage
 */
router.get('/usage', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const planLimits = {
      trial: 0,
      starter: 300,
      pro: 800,
      enterprise: 1000
    };

    const planMinutes = planLimits[user.plan as keyof typeof planLimits] || 0;
    const topupMinutes = user.voiceMinutesTopup || 0;
    const usedMinutes = user.voiceMinutesUsed || 0;
    const totalBalance = planMinutes + topupMinutes - usedMinutes;
    const remaining = Math.max(0, totalBalance);
    const totalLimit = planMinutes + topupMinutes;
    const percentage = totalLimit > 0 ? Math.round((usedMinutes / totalLimit) * 100) : 0;

    res.json({
      plan: user.plan,
      planMinutes,
      topupMinutes,
      totalLimit,
      used: usedMinutes,
      remaining,
      percentage,
      locked: remaining <= 0,
      message: remaining === 0 ? 'All voice minutes used. Top up to continue sending voice notes.' : undefined
    });
  } catch (error: any) {
    console.error('Voice usage check error:', error);
    res.status(500).json({ error: 'Failed to check voice usage' });
  }
});

export default router;
