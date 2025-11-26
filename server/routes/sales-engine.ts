import { Router, Request, Response } from 'express';
import ObjectionHandler from '../lib/sales-engine/objection-handler';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/sales-engine/analyze-objection
 * Analyze prospect objection and return response strategy
 */
router.post('/analyze-objection', requireAuth, async (req: Request, res: Response) => {
  try {
    const { objection, industry = 'all' } = req.body;

    if (!objection || typeof objection !== 'string') {
      return res.status(400).json({ error: 'Objection text required' });
    }

    const analysis = ObjectionHandler.analyzeObjection(
      objection,
      industry,
      'your brand'
    );

    return res.json({
      objection,
      category: analysis.matchedObjection?.category || 'general',
      reframes: analysis.reframes,
      questions: analysis.questions,
      closingTactics: analysis.closingTactics,
      nextStep: analysis.nextStep,
      confidence: analysis.confidence,
    });
  } catch (error: any) {
    console.error('Error analyzing objection:', error);
    return res.status(500).json({ error: 'Failed to analyze objection' });
  }
});

export default router;
