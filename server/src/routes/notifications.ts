import express from 'express';
import Notification from '../models/Notification';
import Message from '../models/Message';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res) => {
    try {
        const notes = await Notification.find({ recipient: req.user?.id })
            .sort({ createdAt: -1 })
            .populate('relatedUser', 'nickname')
            .lean();
        // 为旧通知补充 season：NEW_MESSAGE 且无 season 时，从消息中获取
        const enriched = await Promise.all(notes.map(async (n: any) => {
            if (n.type === 'NEW_MESSAGE' && !n.season && n.relatedEntityId) {
                const msg = await Message.findById(n.relatedEntityId).select('season').lean();
                if (msg?.season) n.season = msg.season;
            }
            return n;
        }));
        res.json(enriched);
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
