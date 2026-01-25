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
const Friend_1 = __importDefault(require("../models/Friend"));
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// POST /api/messages
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { recipientId, stickerType, content, season, year } = req.body;
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
        const message = yield Message_1.default.create({
            sender: senderId,
            recipient: recipientId,
            stickerType,
            content,
            season,
            year: year || new Date().getFullYear()
        });
        // Notify
        yield Notification_1.default.create({
            recipient: recipientId,
            type: 'NEW_MESSAGE',
            relatedUser: senderId,
            relatedEntityId: message._id
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
        }
        else if (season === 'spring') {
            // Mock date: Jan 29 (Month 0)
            if (chinaTime.getMonth() === 0 && chinaTime.getDate() >= 29) {
                isUnlocked = true;
            }
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
exports.default = router;
