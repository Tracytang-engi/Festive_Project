import express from 'express';
import Message from '../models/Message';
import Report from '../models/Report';
import Friend from '../models/Friend';
import Notification from '../models/Notification';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

/** Pick a random position (percent) avoiding existing positions; fallback to simple random. */
function randomPositionOnScene(existing: Record<string, { left: number; top: number }>): { left: number; top: number } {
    const positions: { left: number; top: number }[] = [];
    for (let row = 15; row <= 85; row += 20) {
        for (let col = 15; col <= 85; col += 18) {
            positions.push({ left: col, top: row });
        }
    }
    const used = new Set<number>();
    Object.values(existing).forEach(({ left, top }) => {
        positions.forEach((p, i) => {
            if (Math.abs(p.left - left) < 15 && Math.abs(p.top - top) < 15) used.add(i);
        });
    });
    const available = positions.filter((_, i) => !used.has(i));
    if (available.length > 0) {
        const p = available[Math.floor(Math.random() * available.length)];
        return { left: p.left + (Math.random() * 8 - 4), top: p.top + (Math.random() * 8 - 4) };
    }
    return {
        left: 15 + Math.random() * 70,
        top: 15 + Math.random() * 70,
    };
}

const router = express.Router();
router.use(authMiddleware);
router.use((req, _res, next) => {
    console.warn('[MESSAGES]', req.method, req.url, req.originalUrl);
    next();
});

// GET /api/messages/detail/:id — single message detail for sender/recipient
router.get('/detail/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const msg = await Message.findById(id).populate('sender', 'nickname avatar');
        if (!msg) return res.status(404).json({ error: "NOT_FOUND" });

        const senderId = typeof msg.sender === 'object' && msg.sender !== null && '_id' in msg.sender
            ? (msg.sender as { _id: { toString(): string } })._id.toString()
            : (msg.sender as { toString(): string }).toString();
        const isSender = senderId === userId;
        const isRecipient = msg.recipient.toString() === userId;
        if (!isSender && !isRecipient) {
            return res.status(403).json({ error: "FORBIDDEN", message: "仅发送方或接收方可查看该消息 Only sender or recipient can view this message." });
        }

        // Time lock logic — mirror season inbox route
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const chinaTime = new Date(utc + (3600000 * 8)); // UTC+8
        const month = chinaTime.getMonth();
        const date = chinaTime.getDate();
        const currentYear = chinaTime.getFullYear();

        let isUnlocked = false;
        if (msg.season === 'christmas') {
            if (month === 11 && date >= 25) isUnlocked = true;
        } else if (msg.season === 'spring') {
            if (currentYear === 2025 && month === 0 && date >= 29) isUnlocked = true;
            else if (currentYear === 2026 && month === 1 && date >= 17) isUnlocked = true;
            else if (currentYear === 2027 && month === 1 && date >= 6) isUnlocked = true;
            else if (currentYear === 2024 && month === 1 && date >= 10) isUnlocked = true;
        }
        if (req.query.unlock === 'true') isUnlocked = true;

        // Special viewer override: 测试账号或审核员可提前预览
        if (!isUnlocked && userId) {
            const viewer = await User.findById(userId).select('userId role').lean();
            if (viewer && (viewer.userId === '111111' || viewer.userId === '20070421' || viewer.role === 'moderator')) {
                isUnlocked = true;
            }
        }

        const result = isUnlocked ? msg : {
            ...msg.toObject(),
            content: "LOCKED UNTIL FESTIVAL",
            stickerType: msg.stickerType
        };

        res.json({ message: result, isUnlocked });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

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

        if (!isFriend) return res.status(403).json({ error: "NOT_FRIENDS", message: "仅好友可发送祝福 Only friends can send messages." });

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

        // Place sticker randomly on recipient's scene (spring only)，原子写入避免与拖拽位置并发覆盖
        if (season === 'spring' && sceneId && typeof sceneId === 'string') {
            const recipient = await User.findById(recipientId).select('sceneLayout').lean();
            const springLayout = recipient?.sceneLayout?.spring && typeof recipient.sceneLayout.spring === 'object'
                ? { ...recipient.sceneLayout.spring } : {};
            const pos = randomPositionOnScene(springLayout);
            await User.findByIdAndUpdate(recipientId, {
                $set: { [`sceneLayout.spring.${message._id.toString()}`]: pos },
            });
        }

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

// PUT /api/messages/:id/position — 过年之前：发送方与接收方均可移动；过年之后：仅接收方（房主）可移动
router.put('/:id/position', async (req: AuthRequest, res) => {
    try {
        const { id: messageId } = req.params;
        const { left, top } = req.body;
        const userId = req.user?.id;
        if (typeof left !== 'number' || typeof top !== 'number') {
            return res.status(400).json({ error: "INVALID_INPUT", message: "left 和 top 须为数字 left and top (numbers) required." });
        }
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "NOT_FOUND" });
        const isSender = message.sender.toString() === userId;
        const isRecipient = message.recipient.toString() === userId;
        if (!isSender && !isRecipient) {
            return res.status(403).json({ error: "FORBIDDEN", message: "仅发送方或房主可移动该贴纸 Only the sender or the page owner can move this sticker." });
        }
        // 过年之后（节日当天 00:00 北京时间起）仅接收方可移动
        const now = new Date();
        const chinaTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000 * 8));
        const y = chinaTime.getFullYear(), m = chinaTime.getMonth(), d = chinaTime.getDate();
        const isAfterFestival = (y === 2025 && m === 0 && d >= 29) || (y === 2026 && m === 1 && d >= 17) || (y === 2027 && m === 1 && d >= 6) || (y === 2024 && m === 1 && d >= 10);
        if (isAfterFestival && isSender) {
            return res.status(403).json({ error: "FORBIDDEN", message: "过年之后仅房主可移动贴纸 After the festival only the page owner can move stickers." });
        }
        const recipientId = message.recipient.toString();
        // 只更新该贴纸位置，避免多人/多标签同时拖不同贴纸时互相覆盖（原子更新）
        await User.findByIdAndUpdate(recipientId, {
            $set: { [`sceneLayout.spring.${messageId}`]: { left, top } },
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/messages/sent/:season — messages sent by current user (no year filter)
router.get('/sent/:season', async (req: AuthRequest, res) => {
    try {
        const { season } = req.params;
        const userId = req.user?.id;
        if (season !== 'christmas' && season !== 'spring') {
            return res.status(400).json({ error: "INVALID_SEASON" });
        }
        const messages = await Message.find({
            sender: userId,
            season
        }).sort({ createdAt: -1 }).populate('recipient', 'nickname avatar');
        res.json({ messages });
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

        // Special viewer override: 测试账号或审核员可提前预览
        if (!isUnlocked && userId) {
            const viewer = await User.findById(userId).select('userId role').lean();
            if (viewer && (viewer.userId === '111111' || viewer.userId === '20070421' || viewer.role === 'moderator')) {
                isUnlocked = true;
            }
        }

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
            return res.status(403).json({ error: "FORBIDDEN", message: "仅发送方或接收方可举报 Only sender or recipient can report." });
        }
        const existing = await Report.findOne({ message: id, reporter: userId, status: 'pending' });
        if (existing) return res.status(400).json({ error: "ALREADY_REPORTED", message: "已举报过该消息 You have already reported this message." });
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

// DELETE /api/messages/:id — 仅收件人可删除自己收到的贴纸，并清理其 sceneLayout 中该贴纸位置
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ error: "NOT_FOUND" });
        if (msg.recipient.toString() !== userId) {
            return res.status(403).json({ error: "FORBIDDEN", message: "只能删除自己收到的贴纸 Only the recipient can delete this sticker." });
        }
        const recipientId = msg.recipient.toString();
        await Message.findByIdAndDelete(id);
        await User.findByIdAndUpdate(recipientId, { $unset: { [`sceneLayout.spring.${id}`]: 1 } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
