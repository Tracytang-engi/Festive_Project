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
const Friend_1 = __importDefault(require("../models/Friend"));
const User_1 = __importDefault(require("../models/User"));
const Message_1 = __importDefault(require("../models/Message"));
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// POST /api/friends/request
router.post('/request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { targetUserId } = req.body;
        const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (targetUserId === requesterId)
            return res.status(400).json({ error: "Cannot add self" });
        // Check existing
        const existing = yield Friend_1.default.findOne({
            $or: [
                { requester: requesterId, recipient: targetUserId },
                { requester: targetUserId, recipient: requesterId }
            ]
        });
        if (existing) {
            return res.status(400).json({ error: "Request already exists or connected" });
        }
        const friendRequest = yield Friend_1.default.create({
            requester: requesterId,
            recipient: targetUserId,
            status: 'pending'
        });
        // Create Notification
        yield Notification_1.default.create({
            recipient: targetUserId,
            type: 'FRIEND_REQUEST',
            relatedUser: requesterId,
            relatedEntityId: friendRequest._id
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// POST /api/friends/respond
router.post('/respond', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { requestId, action } = req.body; // action: 'accept' | 'reject'
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const request = yield Friend_1.default.findById(requestId);
        if (!request)
            return res.status(404).json({ error: "Request not found" });
        // Verify recipient is current user
        if (request.recipient.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        if (action === 'accept') {
            request.status = 'accepted';
            yield request.save();
            // Notify requester
            yield Notification_1.default.create({
                recipient: request.requester,
                type: 'CONNECTION_SUCCESS',
                relatedUser: userId,
                relatedEntityId: request._id
            });
        }
        else {
            // Reject - just delete
            yield Friend_1.default.findByIdAndDelete(requestId);
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/friends/check/:targetId
router.get('/check/:targetId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { targetId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const request = yield Friend_1.default.findOne({
            $or: [
                { requester: userId, recipient: targetId, status: 'accepted' },
                { requester: targetId, recipient: userId, status: 'accepted' }
            ]
        });
        res.json({ isFriend: !!request });
    }
    catch (err) {
        res.json({ isFriend: false });
    }
}));
// GET /api/friends/requests
router.get('/requests', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const requests = yield Friend_1.default.find({
            recipient: userId,
            status: 'pending'
        }).populate('requester', 'nickname region avatar');
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/friends/:friendId/decor — 查看好友的主题装饰（仅好友可看）
router.get('/:friendId/decor', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { friendId } = req.params;
        if (!friendId)
            return res.status(400).json({ error: "FRIEND_ID_REQUIRED" });
        const link = yield Friend_1.default.findOne({
            $or: [
                { requester: userId, recipient: friendId, status: 'accepted' },
                { requester: friendId, recipient: userId, status: 'accepted' }
            ]
        });
        if (!link)
            return res.status(403).json({ error: "NOT_FRIENDS", message: "仅可查看好友的装饰" });
        const friend = yield User_1.default.findById(friendId)
            .select('nickname avatar selectedScene themePreference customBackgrounds sceneLayout')
            .lean();
        if (!friend)
            return res.status(404).json({ error: "USER_NOT_FOUND" });
        const messages = yield Message_1.default.find({ recipient: friendId, season: 'spring' })
            .select('_id stickerType sceneId isPrivate content sender createdAt')
            .populate('sender', 'nickname avatar')
            .lean();
        // 贴纸内容锁定：节日当天 00:00（北京时间）后解锁，与 messages 接口一致
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const chinaTime = new Date(utc + (3600000 * 8));
        const currentYear = chinaTime.getFullYear();
        const month = chinaTime.getMonth();
        const date = chinaTime.getDate();
        let isUnlocked = false;
        if (currentYear === 2025 && month === 0 && date >= 29)
            isUnlocked = true;
        else if (currentYear === 2026 && month === 1 && date >= 17)
            isUnlocked = true;
        else if (currentYear === 2027 && month === 1 && date >= 6)
            isUnlocked = true;
        else if (currentYear === 2024 && month === 1 && date >= 10)
            isUnlocked = true;
        const messagesForClient = messages.map((m) => {
            const base = {
                _id: m._id.toString(),
                stickerType: m.stickerType,
                sceneId: m.sceneId,
                isPrivate: !!m.isPrivate,
            };
            if (m.isPrivate) {
                return base;
            }
            if (!isUnlocked) {
                return Object.assign(Object.assign({}, base), { content: 'LOCKED UNTIL FESTIVAL', sender: m.sender, createdAt: m.createdAt });
            }
            return Object.assign(Object.assign({}, base), { content: m.content, sender: m.sender, createdAt: m.createdAt });
        });
        res.json(Object.assign(Object.assign({}, friend), { messages: messagesForClient, isUnlocked }));
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/friends
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const friends = yield Friend_1.default.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).populate('requester', 'nickname region avatar')
            .populate('recipient', 'nickname region avatar');
        // Transform to return the *other* user
        const result = friends.map(f => {
            const isRequester = f.requester._id.toString() === userId;
            return {
                _id: f._id, // Connection ID
                friend: isRequester ? f.recipient : f.requester
            };
        });
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
