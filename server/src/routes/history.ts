import express from 'express';
import Message from '../models/Message';
import HistoryScene from '../models/HistoryScene';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

// POST /api/history/archive (Triggered manually or via cron)
router.post('/archive', async (req: AuthRequest, res) => {
    try {
        const { year, season } = req.body;
        // Ideally should be Admin only. For demo, allowing auth user.

        // Find all messages for this criteria
        // In real app, we loop all users. For demo, let's just archive current user's scene.
        // Requirement: "The entire festive scene is archived" -> implies Personal History.

        const userId = req.user?.id;

        const messages = await Message.find({
            recipient: userId,
            year,
            season
        });

        if (messages.length === 0) return res.json({ message: "No messages to archive" });

        // Create History Snapshot
        await HistoryScene.create({
            user: userId,
            year,
            season,
            data: { messages } // Store full objects
        });

        // Delete Original Messages (Cleanup)
        // Requirement: "Every March, all messages are cleared"
        // This deletes them from the active Message collection
        await Message.deleteMany({
            recipient: userId,
            year,
            season
        });

        res.json({ success: true, count: messages.length });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/history/years
router.get('/years', async (req: AuthRequest, res) => {
    try {
        const history = await HistoryScene.find({ user: req.user?.id }).select('year season');
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/history/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const scene = await HistoryScene.findOne({ _id: req.params.id, user: req.user?.id });
        if (!scene) return res.status(404).json({ error: "Not found" });
        res.json(scene);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
