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
const Message_1 = __importDefault(require("../models/Message"));
const Report_1 = __importDefault(require("../models/Report"));
const Friend_1 = __importDefault(require("../models/Friend"));
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// POST /api/messages
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { recipientId, stickerType, content, season, year, sceneId, isPrivate } = req.body;
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Verify Friendship
        const isFriend = yield Friend_1.default.findOne({
            $or: [
                { requester: senderId, recipient: recipientId, status: 'accepted' },
                { requester: recipientId, recipient: senderId, status: 'accepted' }
            ]
        });
        if (!isFriend)
            return res.status(403).json({ error: "Not friends" });
        const message = yield Message_1.default.create(Object.assign(Object.assign({ sender: senderId, recipient: recipientId, stickerType,
            content,
            season, year: year || new Date().getFullYear() }, (sceneId && typeof sceneId === 'string' && { sceneId: sceneId.trim() })), { isPrivate: !!isPrivate }));
        // Notify (include season so frontend can open correct mailbox)
        yield Notification_1.default.create({
            recipient: recipientId,
            type: 'NEW_MESSAGE',
            relatedUser: senderId,
            relatedEntityId: message._id,
            season: season
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/messages/:season
router.get('/:season', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { season } = req.params; // 'christmas' or 'spring'
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const currentYear = new Date().getFullYear();
        // 1. Fetch messages
        const messages = yield Message_1.default.find({
            recipient: userId,
            season,
            year: currentYear
        }).populate('sender', 'nickname avatar');
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
        }
        else if (season === 'spring') {
            // TODO: 正式上线时改回时间判断。暂时视为春节已到，可查看贴纸内容。
            isUnlocked = true;
            // if (chinaTime.getMonth() === 0 && chinaTime.getDate() >= 29) isUnlocked = true;
        }
        // DEBUG: Allow unlock via query param for testing ?unlock=true
        if (req.query.unlock === 'true')
            isUnlocked = true;
        // 3. Mask content if locked
        const results = messages.map(msg => {
            if (isUnlocked)
                return msg;
            return Object.assign(Object.assign({}, msg.toObject()), { content: "LOCKED UNTIL FESTIVAL", stickerType: msg.stickerType // Sticker visible, content hidden? Or sticker hidden? Reqt: "Stickers remain locked... open to read". Usually sticker icon visible, text hidden.
             });
        });
        res.json({ messages: results, isUnlocked });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// POST /api/messages/:id/report — 举报消息（仅发送方或接收方可举报）
router.post('/:id/report', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { reason } = req.body || {};
        const msg = yield Message_1.default.findById(id);
        if (!msg)
            return res.status(404).json({ error: "NOT_FOUND" });
        const isSender = msg.sender.toString() === userId;
        const isRecipient = msg.recipient.toString() === userId;
        if (!isSender && !isRecipient) {
            return res.status(403).json({ error: "FORBIDDEN", message: "仅发送方或接收方可举报" });
        }
        const existing = yield Report_1.default.findOne({ message: id, reporter: userId, status: 'pending' });
        if (existing)
            return res.status(400).json({ error: "ALREADY_REPORTED", message: "已举报过该消息" });
        yield Report_1.default.create({
            message: id,
            reporter: userId,
            reason: typeof reason === 'string' ? reason.trim().slice(0, 500) : undefined,
            status: 'pending'
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// DELETE /api/messages/:id — 仅收件人可删除自己收到的贴纸
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const msg = yield Message_1.default.findById(id);
        if (!msg)
            return res.status(404).json({ error: "NOT_FOUND" });
        if (msg.recipient.toString() !== userId) {
            return res.status(403).json({ error: "FORBIDDEN", message: "只能删除自己收到的贴纸" });
        }
        yield Message_1.default.findByIdAndDelete(id);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
