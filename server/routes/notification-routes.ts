import { Router } from "express";
import { db } from "../db.js";
import { pushSubscriptions } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { storage } from "../storage.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Get list of notifications for the current user
router.get("/", requireAuth, async (req, res) => {
    try {
        const userId = req.session?.userId || (req.user as any)?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const notificationList = await storage.getNotifications(userId);
        const unreadCount = notificationList.filter(n => !n.read).length;

        res.json({
            unreadCount,
            notifications: notificationList
        });
    } catch (error: any) {
        console.error("Fetch notifications error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark a specific notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
    try {
        const userId = req.session?.userId || (req.user as any)?.id;
        const notificationId = req.params.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await storage.markNotificationAsRead(notificationId, userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Mark notification read error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read
router.post("/mark-all-read", requireAuth, async (req, res) => {
    try {
        const userId = req.session?.userId || (req.user as any)?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await storage.markAllNotificationsAsRead(userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Mark all notifications read error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get VAPID public key
router.get("/vapid-public-key", (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return res.status(500).json({ error: "VAPID key not configured" });
    }
    res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post("/subscribe", async (req, res) => {
    try {
        const userId = req.session?.userId || (req.user as any)?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const subscription = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: "Invalid subscription payload" });
        }

        // Check if duplicate
        const existing = await db
            .select()
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
            .limit(1);

        if (existing.length > 0) {
            // Update keys if changed, or just update userId if needed
            if (existing[0].userId !== userId) {
                await db
                    .update(pushSubscriptions)
                    .set({ userId, keys: subscription.keys })
                    .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
            }
            return res.status(200).json({ status: "updated" });
        }

        // Insert new
        await db.insert(pushSubscriptions).values({
            userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
        });

        res.status(201).json({ status: "subscribed" });
    } catch (error: any) {
        console.error("Push subscription error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
