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
const HistoryScene_1 = __importDefault(require("../models/HistoryScene"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// POST /api/history/archive (Triggered manually or via cron)
router.post('/archive', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { year, season } = req.body;
        // Ideally should be Admin only. For demo, allowing auth user.
        // Find all messages for this criteria
        // In real app, we loop all users. For demo, let's just archive current user's scene.
        // Requirement: "The entire festive scene is archived" -> implies Personal History.
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const messages = yield Message_1.default.find({
            recipient: userId,
            year,
            season
        });
        if (messages.length === 0)
            return res.json({ message: "No messages to archive" });
        // Create History Snapshot
        yield HistoryScene_1.default.create({
            user: userId,
            year,
            season,
            data: { messages } // Store full objects
        });
        // Delete Original Messages (Cleanup)
        // Requirement: "Every March, all messages are cleared"
        // This deletes them from the active Message collection
        yield Message_1.default.deleteMany({
            recipient: userId,
            year,
            season
        });
        res.json({ success: true, count: messages.length });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/history/years
router.get('/years', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const history = yield HistoryScene_1.default.find({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }).select('year season');
        res.json(history);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/history/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const scene = yield HistoryScene_1.default.findOne({ _id: req.params.id, user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id });
        if (!scene)
            return res.status(404).json({ error: "Not found" });
        res.json(scene);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
