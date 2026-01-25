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
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// GET /api/notifications
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const notes = yield Notification_1.default.find({ recipient: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id })
            .sort({ createdAt: -1 })
            .populate('relatedUser', 'nickname');
        res.json(notes);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield Notification_1.default.updateMany({ recipient: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, isRead: false }, { isRead: true });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
