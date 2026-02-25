import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { prospects } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { AudnixIngestor } from '../lib/scraping/audnix-ingestor.js';

import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Start Neural Scan (NO MOCK DATA)
 */
router.post('/scan', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Start async scan (real scraping, no mock)
        const ingestor = new AudnixIngestor(userId.toString());

        // Run in background, respond immediately
        ingestor.startNeuralScan(query).catch(error => {
            console.error('Neural scan error:', error);
        });

        res.json({
            success: true,
            message: 'Neural scan initiated. Watch real-time progress in the modal.'
        });

    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: 'Failed to start scan' });
    }
});

/**
 * Get Leads (REAL DATA ONLY)
 */
router.get('/leads', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Fetch REAL leads from database
        const leads = await db.select()
            .from(prospects)
            .where(eq(prospects.userId, userId))
            .orderBy(prospects.createdAt)
            .limit(2000);

        res.json(leads);

    } catch (error) {
        console.error('Fetch leads error:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

/**
 * Verify Lead (REAL SMTP)
 */
router.post('/verify/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const { id } = req.params;

        // Verify ownership
        const [prospect] = await db.select()
            .from(prospects)
            .where(eq(prospects.id, id as string))
            .limit(1);

        if (!prospect || prospect.userId !== userId) {
            return res.status(404).json({ error: 'Prospect not found' });
        }

        // Run real SMTP verification
        const ingestor = new AudnixIngestor(userId.toString());
        ingestor.verifyLead(id as string).catch(error => {
            console.error('Verification error:', error);
        });

        res.json({ success: true, message: 'Verification started' });

    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Failed to verify lead' });
    }
});

export default router;
