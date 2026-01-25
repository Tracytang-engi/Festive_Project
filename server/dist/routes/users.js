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
const User_1 = __importDefault(require("../models/User"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// GET /api/users/me
router.get('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user)
            return res.status(404).json({ error: "NOT_FOUND" });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// GET /api/users/search?nickname=...
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { nickname } = req.query;
        if (!nickname)
            return res.json([]);
        // Partial match, case insensitive
        const users = yield User_1.default.find({
            nickname: { $regex: nickname, $options: 'i' },
            _id: { $ne: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id } // Exclude self
        }).select('nickname region selectedScene'); // Public info only
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// PUT /api/users/scene (Select Scene)
router.put('/scene', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { sceneId, theme } = req.body;
        yield User_1.default.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, { selectedScene: sceneId, themePreference: theme });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// POST /api/users/background
router.post('/background', upload_1.upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.file)
            return res.status(400).json({ error: "NO_FILE_UPLOADED" });
        // Construct URL (assuming local storage)
        // In production, you might return a full URL or CDN path.
        // For now, we return a relative path that the client can prepend the server origin to,
        // OR a relative path that works if the client proxies to the server.
        // Let's store '/uploads/filename'
        const imageUrl = `/uploads/${req.file.filename}`;
        yield User_1.default.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, { backgroundImage: imageUrl });
        res.json({ success: true, imageUrl });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
