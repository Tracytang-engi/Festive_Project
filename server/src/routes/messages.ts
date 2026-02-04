import express from 'express';
import Message from '../models/Message';
import Friend from '../models/Friend';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

// POST /api/messages
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { recipientId, stickerType, content, season, year, sceneId } = req.body;
        const senderId = req.user?.id;

        // Verify Friendship
        const isFriend = await Friend.findOne({
            $or: [
                { requester: senderId, recipient: recipientId, status: 'accepted' },
                { requester: recipientId, recipient: senderId, status: 'accepted' }
            ]
        });

        if (!isFriend) return res.status(403).json({ error: "Not friends" });

        const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            stickerType,
            content,
            season,
            year: year || new Date().getFullYear(),
            ...(sceneId && typeof sceneId === 'string' && { sceneId: sceneId.trim() })
        });

        // Notify (include season so frontend can open correct mailbox)
        await Notification.create({
            recipient: recipientId,
            type: 'NEW_MESSAGE',
            relatedUser: senderId,
            relatedEntityId: message._id,
            season: season
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/messages/:season
router.get('/:season', async (req: AuthRequest, res) => {
    try {
        const { season } = req.params; // 'christmas' or 'spring'
        const userId = req.user?.id;
        const currentYear = new Date().getFullYear();

        // 1. Fetch messages
        const messages = await Message.find({
            recipient: userId,
            season,
            year: currentYear
        }).populate('sender', 'nickname');

        // 2. Check Time Lock (China Time UTC+8)
        // Christmas: Dec 25 00:00
        // Spring Festival: (Hardcoded for 2024/2025 demo: Feb 10 2024, Jan 29 2025)
        // Let's assume 2025 Spring Festival is Jan 29.

        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const chinaTime = new Date(utc + (3600000 * 8)); // UTC+8

        let isUnlocked = false;

        if (season === 'christmas') {
            // Unlocks Dec 25
            if (chinaTime.getMonth() === 11 && chinaTime.getDate() >= 25) { // Month is 0-indexed
                isUnlocked = true;
            }
        } else if (season === 'spring') {
            // TODO: 正式上线时改回时间判断。暂时视为春节已到，可查看贴纸内容。
            isUnlocked = true;
            // if (chinaTime.getMonth() === 0 && chinaTime.getDate() >= 29) isUnlocked = true;
        }

        // DEBUG: Allow unlock via query param for testing ?unlock=true
        if (req.query.unlock === 'true') isUnlocked = true;

        // 3. Mask content if locked
        const results = messages.map(msg => {
            if (isUnlocked) return msg;
            return {
                ...msg.toObject(),
                content: "LOCKED UNTIL FESTIVAL",
                stickerType: msg.stickerType // Sticker visible, content hidden? Or sticker hidden? Reqt: "Stickers remain locked... open to read". Usually sticker icon visible, text hidden.
            };
        });

        res.json({ messages: results, isUnlocked });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// DELETE /api/messages/:id — 仅收件人可删除自己收到的贴纸
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ error: "NOT_FOUND" });
        if (msg.recipient.toString() !== userId) {
            return res.status(403).json({ error: "FORBIDDEN", message: "只能删除自己收到的贴纸" });
        }
        await Message.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
