"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Report_1 = __importDefault(require("../models/Report"));
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
/** 审核员中间件：仅 role === 'moderator' 可访问 */
const moderatorMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    User_1.default.findById(user.id)
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
router.get('/reports', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield Report_1.default.find({ status: 'pending' })
            .populate('message')
            .populate('reporter', 'nickname userId')
            .sort({ createdAt: -1 })
            .lean();
        const enriched = yield Promise.all(reports.map((r) => __awaiter(void 0, void 0, void 0, function* () {
            const msg = r.message;
            if (!msg)
                return Object.assign(Object.assign({}, r), { message: null });
            const sender = yield User_1.default.findById(msg.sender).select('nickname userId').lean();
            const recipient = yield User_1.default.findById(msg.recipient).select('nickname userId').lean();
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
        })));
        res.json(enriched);
    }
    catch (err) {
        console.error("Admin reports error:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// PUT /api/admin/reports/:id — 审核员处理：resolve | dismiss，可选 deleteMessage
router.put('/reports/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { action, deleteMessage } = req.body || {};
        if (action !== 'resolve' && action !== 'dismiss') {
            return res.status(400).json({ error: "INVALID_INPUT", message: "action 须为 resolve 或 dismiss" });
        }
        const report = yield Report_1.default.findById(id);
        if (!report)
            return res.status(404).json({ error: "NOT_FOUND" });
        if (report.status !== 'pending') {
            return res.status(400).json({ error: "ALREADY_PROCESSED", message: "该举报已处理" });
        }
        report.status = action;
        yield report.save();
        if (!!deleteMessage) {
            yield Message_1.default.findByIdAndDelete(report.message);
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error("Admin report action error:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
