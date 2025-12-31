import { Router, Request, Response } from 'express';
import ObjectionHandler from '../lib/sales-engine/objection-handler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const HIDDEN_OBJECTION_MAP: Record<string, string> = {
  timing: "Fear of commitment or current priorities taking precedence",
  price: "Uncertainty about value or ROI justification to stakeholders",
  competitor: "Already invested elsewhere or comparing options",
  trust: "Need more proof or social validation before deciding",
  authority: "Lack of autonomy or fear of internal pushback",
  fit: "Concern about implementation complexity or change management",
  social: "Worried about perception from peers or customers",
  decision: "Final resistance before commitment - actually close to yes",
  general: "Underlying concern not yet surfaced",
};

const IDENTITY_UPGRADE_MAP: Record<string, string> = {
  timing: "Picture yourself 90 days from now with a fully automated follow-up system - your competitors are still manually chasing leads while you're closing deals on autopilot.",
  price: "The question isn't whether you can afford this - it's whether you can afford to keep losing leads. One recovered deal pays for a full year.",
  competitor: "You've tried other tools. Now imagine being the business owner who finally found the one that actually works - while others keep jumping from solution to solution.",
  trust: "Think about the version of you who takes calculated risks on proven systems. That's the business owner who scales while others stay stuck.",
  authority: "Leaders who bring winning solutions to their team are the ones who get promoted. This is your opportunity to be that person.",
  fit: "You're not the type to let a small learning curve stop you from massive results. The best in your industry figured it out - so will you.",
  social: "Your customers will see you as innovative, not pushy. The businesses they admire most are the ones that follow up professionally.",
  decision: "You're at the finish line. The only thing between you and results is one decision. Future you is waiting on the other side.",
  general: "Imagine looking back in 6 months knowing you made the decision that transformed your business. That moment is now.",
};

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

    const category = analysis.matchedObjection?.category || 'general';
    const confidencePercent = Math.round(analysis.confidence * 100);

    return res.json({
      objection: objectionText,
      category,
      hiddenObjection: HIDDEN_OBJECTION_MAP[category] || HIDDEN_OBJECTION_MAP.general,
      reframes: analysis.reframes,
      powerQuestion: analysis.questions[0] || 'What would make this a yes for you?',
      closingTactic: analysis.closingTactics[0] || 'Would you like to move forward today?',
      story: analysis.stories?.[0] || "I had a client who felt the same way. They took the leap, and within 30 days recovered 3 deals they thought were lost forever. Now they can't imagine running their business without it.",
      identityUpgrade: IDENTITY_UPGRADE_MAP[category] || IDENTITY_UPGRADE_MAP.general,
      competitorAngle: analysis.competitorInsight || "Most tools require you to write every message manually. We do the thinking for you - just paste the objection and get expert-level responses instantly.",
      nextMove: analysis.nextStep,
      questions: analysis.questions,
      closingTactics: analysis.closingTactics,
      confidence: confidencePercent,
    });
  } catch (error: any) {
    console.error('Error analyzing objection:', error);
    return res.status(500).json({ error: 'Failed to analyze objection' });
  }
});

export default router;
