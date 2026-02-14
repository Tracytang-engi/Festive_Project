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
/** 引导用特殊账号 Andy：所有发给 Andy 的好友申请都直接通过，不用 Andy 同意。
 * 环境变量（在服务器 .env 里配置）：
 *   ONBOARDING_BOT_OBJECT_ID = Andy 的 MongoDB _id（最可靠，推荐必设）
 *   ONBOARDING_BOT_USER_ID  = Andy 的登录账号，默认 20070421
 *   ONBOARDING_BOT_NICKNAME = Andy 的昵称，可选，如线上是「安迪」则设 安迪 */
const DEFAULT_BOT_USER_ID = '20070421';
function getOnboardingBotUserId() {
    return (process.env.ONBOARDING_BOT_USER_ID || DEFAULT_BOT_USER_ID).trim();
}
function getOnboardingBotObjectId() {
    const id = process.env.ONBOARDING_BOT_OBJECT_ID;
    return (id && typeof id === 'string' && id.trim()) ? id.trim() : null;
}
function getOnboardingBotNickname() {
    const n = process.env.ONBOARDING_BOT_NICKNAME;
    return (n && typeof n === 'string' && n.trim()) ? n.trim().toLowerCase() : null;
}
function isOnboardingBot(targetUserId, targetUser) {
    if (!targetUser)
        return false;
    const botOid = getOnboardingBotObjectId();
    if (botOid && String(targetUserId).trim() === String(botOid).trim())
        return true;
    const uId = (targetUser.userId != null && String(targetUser.userId).trim()) || '';
    if (uId === String(getOnboardingBotUserId()).trim())
        return true;
    const nick = (targetUser.nickname && String(targetUser.nickname).trim().toLowerCase()) || '';
    if (nick === 'andy' || nick.includes('andy'))
        return true;
    const botNick = getOnboardingBotNickname();
    if (botNick && (nick === botNick || nick.includes(botNick)))
        return true;
    return false;
}
/** 获取默认好友 Andy 的 MongoDB _id（用于「所有人默认好友」） */
function getDefaultFriendAndyId() {
    return __awaiter(this, void 0, void 0, function* () {
        const botOid = getOnboardingBotObjectId();
        if (botOid) {
            const u = yield User_1.default.findById(botOid).select('_id').lean();
            return u ? String(u._id) : null;
        }
        const u = yield User_1.default.findOne({ userId: getOnboardingBotUserId() }).select('_id').lean();
        return u ? String(u._id) : null;
    });
}
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
        const targetUser = yield User_1.default.findById(targetUserId).select('userId nickname').lean();
        const isAndy = isOnboardingBot(String(targetUserId), targetUser);
        const friendRequest = yield Friend_1.default.create({
            requester: requesterId,
            recipient: targetUserId,
            status: isAndy ? 'accepted' : 'pending'
        });
        if (isAndy) {
            yield Notification_1.default.create({
                recipient: requesterId,
                type: 'CONNECTION_SUCCESS',
                relatedUser: targetUserId,
                relatedEntityId: friendRequest._id
            });
        }
        else {
            yield Notification_1.default.create({
                recipient: targetUserId,
                type: 'FRIEND_REQUEST',
                relatedUser: requesterId,
                relatedEntityId: friendRequest._id
            });
        }
        res.json({ success: true, autoAccepted: !!isAndy });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/friends/andy-id — 查询 userId=20070421 的用户的 MongoDB _id，用于在 .env 中设置 ONBOARDING_BOT_OBJECT_ID
router.get('/andy-id', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const botUserId = getOnboardingBotUserId();
        const user = yield User_1.default.findOne({ userId: botUserId }).select('_id nickname userId').lean();
        if (!user) {
            return res.json({ ok: false, message: '未找到 userId=' + botUserId + ' 的用户，请确认数据库中有 Andy 账号' });
        }
        res.json({
            ok: true,
            andyObjectId: String(user._id),
            nickname: user.nickname,
            userId: user.userId,
            hint: '将 andyObjectId 填入 .env: ONBOARDING_BOT_OBJECT_ID=' + String(user._id) + ' 然后 pm2 restart festive-api',
        });
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
            return res.status(403).json({ error: "UNAUTHORIZED", message: "无权操作此请求 Unauthorized to respond to this request." });
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
// GET /api/friends/requests/sent — 我发出的、待对方处理的好友请求（用于发现页灰显「已发送」）
router.get('/requests/sent', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const list = yield Friend_1.default.find({ requester: userId, status: 'pending' })
            .select('recipient')
            .lean();
        const sentToIds = list.map((r) => r.recipient.toString());
        res.json(sentToIds);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
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
            return res.status(403).json({ error: "NOT_FRIENDS", message: "仅可查看好友的装饰 Only friends can view this decor." });
        const friend = yield User_1.default.findById(friendId)
            .select('nickname avatar selectedScene themePreference customBackgrounds sceneLayout')
            .lean();
        if (!friend)
            return res.status(404).json({ error: "USER_NOT_FOUND" });
        const messages = yield Message_1.default.find({ recipient: friendId, season: 'spring' })
            .select('_id stickerType sceneId isPrivate content sender createdAt')
            .populate('sender', '_id nickname avatar')
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
        // 测试账号可提前预览好友页贴纸
        if (!isUnlocked && userId) {
            const viewer = yield User_1.default.findById(userId).select('userId role').lean();
            if (viewer && (viewer.userId === '111111' || viewer.userId === '20070421' || viewer.role === 'moderator')) {
                isUnlocked = true;
            }
        }
        const messagesForClient = messages.map((m) => {
            const base = {
                _id: m._id.toString(),
                stickerType: m.stickerType,
                sceneId: m.sceneId,
                isPrivate: !!m.isPrivate,
            };
            if (m.isPrivate) {
                const senderId = m.sender && (m.sender._id || m.sender).toString();
                const requesterIsSenderOrRecipient = userId === senderId || userId === friendId;
                if (requesterIsSenderOrRecipient) {
                    return Object.assign(Object.assign({}, base), { content: m.content, sender: m.sender, createdAt: m.createdAt });
                }
                return Object.assign(Object.assign({}, base), { sender: m.sender });
            }
            if (!isUnlocked) {
                return Object.assign(Object.assign({}, base), { content: 'LOCKED UNTIL FESTIVAL', sender: m.sender, createdAt: m.createdAt });
            }
            return Object.assign(Object.assign({}, base), { content: m.content, sender: m.sender, createdAt: m.createdAt });
        });
        res.set('Cache-Control', 'no-store');
        res.json(Object.assign(Object.assign({}, friend), { messages: messagesForClient, isUnlocked }));
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/friends — 好友列表；Andy 作为默认好友，若尚未存在则自动建立关系并加入列表
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        let friends = yield Friend_1.default.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).populate('requester', 'nickname region avatar')
            .populate('recipient', 'nickname region avatar');
        // Andy 为默认好友：若当前用户还没有 Andy，则自动创建 accepted 关系并加入列表
        const andyId = yield getDefaultFriendAndyId();
        if (andyId && userId !== andyId) {
            const hasAndy = friends.some((f) => f.requester._id.toString() === andyId || f.recipient._id.toString() === andyId);
            if (!hasAndy) {
                const newConn = yield Friend_1.default.create({
                    requester: userId,
                    recipient: andyId,
                    status: 'accepted'
                });
                const andyUser = yield User_1.default.findById(andyId).select('nickname region avatar').lean();
                if (andyUser) {
                    friends = [...friends, {
                            _id: newConn._id,
                            requester: { _id: userId },
                            recipient: { _id: andyUser._id, nickname: andyUser.nickname, region: andyUser.region, avatar: andyUser.avatar }
                        }];
                }
            }
        }
        // Transform to return the *other* user
        const result = friends.map((f) => {
            const isRequester = f.requester._id.toString() === userId;
            return {
                _id: f._id,
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
