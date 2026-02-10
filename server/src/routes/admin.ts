import express from 'express';
import Report from '../models/Report';
import Message from '../models/Message';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

/** 审核员中间件：仅 role === 'moderator' 可访问 */
const moderatorMiddleware = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "UNAUTHORIZED" });
    User.findById(user.id)
        .select('role')
        .lean()
        .then(u => {
            if (!u || u.role !== 'moderator') {
                return res.status(403).json({ error: "FORBIDDEN", message: "需要审核员权限" });
            }
            next();
        })
        .catch(() => res.status(500).json({ error: "SERVER_ERROR" }));
};

router.use(moderatorMiddleware);

// GET /api/admin/reports — 返回所有被举报消息（含完整 content），不论 isPrivate
router.get('/reports', async (req: AuthRequest, res) => {
    try {
        const reports = await Report.find({ status: 'pending' })
            .populate('message')
            .populate('reporter', 'nickname userId')
            .sort({ createdAt: -1 })
            .lean();
        const enriched = await Promise.all(reports.map(async (r: any) => {
            const msg = r.message;
            if (!msg) return { ...r, message: null };
            const sender = await User.findById(msg.sender).select('nickname userId').lean();
            const recipient = await User.findById(msg.recipient).select('nickname userId').lean();
            return {
                _id: r._id,
                message: {
                    _id: msg._id,
                    content: msg.content,
                    stickerType: msg.stickerType,
                    isPrivate: msg.isPrivate,
                    sender,
                    recipient,
                    createdAt: msg.createdAt,
                },
                reporter: r.reporter,
                reason: r.reason,
                status: r.status,
                createdAt: r.createdAt,
            };
        }));
        res.json(enriched);
    } catch (err) {
        console.error("Admin reports error:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// PUT /api/admin/reports/:id — 审核员处理：resolve | dismiss，可选 deleteMessage
router.put('/reports/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { action, deleteMessage } = req.body || {};
        if (action !== 'resolve' && action !== 'dismiss') {
            return res.status(400).json({ error: "INVALID_INPUT", message: "action 须为 resolve 或 dismiss" });
        }
        const report = await Report.findById(id);
        if (!report) return res.status(404).json({ error: "NOT_FOUND" });
        if (report.status !== 'pending') {
            return res.status(400).json({ error: "ALREADY_PROCESSED", message: "该举报已处理" });
        }
        report.status = action;
        await report.save();
        if (!!deleteMessage) {
            await Message.findByIdAndDelete(report.message);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Admin report action error:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
