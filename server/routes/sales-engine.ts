import { Router, Request, Response } from 'express';
import ObjectionHandler from '../lib/sales-engine/objection-handler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/sales-engine/analyze-objection
 * Analyze prospect objection and return response strategy
 */
router.post('/analyze-objection', requireAuth, async (req: Request, res: Response) => {
  try {
    const { objection, prospectMessage, industry = 'all' } = req.body;
    const objectionText = objection || prospectMessage;

    if (!objectionText || typeof objectionText !== 'string') {
      return res.status(400).json({ error: 'Objection text required' });
    }

    const analysis = ObjectionHandler.analyzeObjection(
      objectionText,
      industry,
      'your brand'
    );

    return res.json({
      objection: objectionText,
      category: analysis.matchedObjection?.category || 'general',
      reframes: analysis.reframes,
      powerQuestion: analysis.questions[0] || 'What would make this a yes for you?',
      closingTactic: analysis.closingTactics[0] || 'Would you like to move forward today?',
      story: analysis.stories?.[0] || '',
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
