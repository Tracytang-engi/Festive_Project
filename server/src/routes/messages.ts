import express from 'express';
import Message from '../models/Message';
import Report from '../models/Report';
import Friend from '../models/Friend';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

// POST /api/messages
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { recipientId, stickerType, content, season, year, sceneId, isPrivate } = req.body;
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
            ...(sceneId && typeof sceneId === 'string' && { sceneId: sceneId.trim() }),
            isPrivate: !!isPrivate
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
        }).populate('sender', 'nickname avatar');

        // 2. Check Time Lock (China Time UTC+8)：所有贴纸内容默认锁定，节日当天 00:00 后自动解锁
        // Christmas: 12 月 25 日 00:00 起解锁
        // Spring Festival: 春节当天 00:00 起解锁（示例：2025=1/29, 2026=2/17）

        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const chinaTime = new Date(utc + (3600000 * 8)); // UTC+8
        const month = chinaTime.getMonth();
        const date = chinaTime.getDate();

        let isUnlocked = false;
        if (season === 'christmas') {
            if (month === 11 && date >= 25) isUnlocked = true; // 12 月 25 日 00:00 起
        } else if (season === 'spring') {
            // 春节初一（按公历近似：2025=1/29, 2026=2/17）
            if (currentYear === 2025 && month === 0 && date >= 29) isUnlocked = true;
            else if (currentYear === 2026 && month === 1 && date >= 17) isUnlocked = true;
            else if (currentYear === 2027 && month === 1 && date >= 6) isUnlocked = true;
            else if (currentYear === 2024 && month === 1 && date >= 10) isUnlocked = true;
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

// POST /api/messages/:id/report — 举报消息（仅发送方或接收方可举报）
router.post('/:id/report', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { reason } = req.body || {};
        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ error: "NOT_FOUND" });
        const isSender = msg.sender.toString() === userId;
        const isRecipient = msg.recipient.toString() === userId;
        if (!isSender && !isRecipient) {
            return res.status(403).json({ error: "FORBIDDEN", message: "仅发送方或接收方可举报" });
        }
        const existing = await Report.findOne({ message: id, reporter: userId, status: 'pending' });
        if (existing) return res.status(400).json({ error: "ALREADY_REPORTED", message: "已举报过该消息" });
        await Report.create({
            message: id,
            reporter: userId,
            reason: typeof reason === 'string' ? reason.trim().slice(0, 500) : undefined,
            status: 'pending'
        });
        res.json({ success: true });
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
