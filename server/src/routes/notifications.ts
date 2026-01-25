import express from 'express';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res) => {
    try {
        const notes = await Notification.find({ recipient: req.user?.id })
            .sort({ createdAt: -1 })
            .populate('relatedUser', 'nickname');
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req: AuthRequest, res) => {
    try {
        await Notification.updateMany({ recipient: req.user?.id, isRead: false }, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
