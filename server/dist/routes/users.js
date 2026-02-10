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
const security_1 = require("../utils/security");
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
// 转义正则特殊字符，防止用户输入导致 ReDoS 或逻辑错误
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// GET /api/users/search?nickname=...
// nickname 为空或 "*" 时返回所有用户（排除自己），方便浏览添加好友
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { nickname } = req.query;
        const filter = { _id: { $ne: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id } }; // Exclude self
        if (nickname && String(nickname).trim() && String(nickname) !== '*') {
            const safe = escapeRegex(String(nickname).trim());
            filter.nickname = { $regex: safe, $options: 'i' };
        }
        // else: empty or "*" = browse all users
        const users = yield User_1.default.find(filter)
            .select('nickname userId region selectedScene avatar')
            .limit(100);
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
// PUT /api/users/scene-layout — 保存当前主题下贴纸布置（百分比位置）
router.put('/scene-layout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { season, positions } = req.body;
        if (!season || (season !== 'christmas' && season !== 'spring')) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "season 须为 christmas 或 spring" });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield User_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ error: "NOT_FOUND" });
        const layout = (user.sceneLayout && typeof user.sceneLayout === 'object') ? Object.assign({}, user.sceneLayout) : {};
        layout[season] = positions && typeof positions === 'object' ? positions : {};
        yield User_1.default.findByIdAndUpdate(userId, { sceneLayout: layout });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// PUT /api/users/profile/avatar - 设置头像（emoji）
router.put('/profile/avatar', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { avatar } = req.body;
        const avatarStr = (avatar != null && String(avatar).trim()) ? String(avatar).trim().slice(0, 8) : '👤';
        yield User_1.default.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, { avatar: avatarStr });
        res.json({ success: true, avatar: avatarStr });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// PUT /api/users/profile/nickname - 改名字，每人限 3 次
const NICKNAME_CHANGE_LIMIT = 3;
router.put('/profile/nickname', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { nickname } = req.body;
        if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "名称不能为空" });
        }
        const user = yield User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user)
            return res.status(404).json({ error: "NOT_FOUND" });
        const count = ((_b = user.nicknameChangeCount) !== null && _b !== void 0 ? _b : 0);
        if (count >= NICKNAME_CHANGE_LIMIT) {
            return res.status(400).json({ error: "LIMIT_REACHED", message: "改名字次数已用完（每人限 3 次）" });
        }
        const trimmed = String(nickname).trim();
        if (trimmed === user.nickname) {
            return res.status(400).json({ error: "SAME_NICKNAME", message: "新名称与当前相同" });
        }
        const existing = yield User_1.default.findOne({ nickname: trimmed, _id: { $ne: user._id } });
        if (existing) {
            return res.status(400).json({ error: "NICKNAME_TAKEN", message: "该名称已被使用" });
        }
        user.nickname = trimmed;
        user.nicknameChangeCount = count + 1;
        yield user.save();
        res.json({ success: true, nickname: user.nickname, nicknameChangeCount: user.nicknameChangeCount });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// PUT /api/users/profile/password - 更改密码，每人限 1 次
const PASSWORD_CHANGE_LIMIT = 1;
router.put('/profile/password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "请填写当前密码和新密码" });
        }
        const user = yield User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user)
            return res.status(404).json({ error: "NOT_FOUND" });
        const count = ((_b = user.passwordChangeCount) !== null && _b !== void 0 ? _b : 0);
        if (count >= PASSWORD_CHANGE_LIMIT) {
            return res.status(400).json({ error: "LIMIT_REACHED", message: "更改密码次数已用完（每人限 1 次）" });
        }
        const valid = yield (0, security_1.comparePassword)(String(currentPassword), user.passwordHash);
        if (!valid) {
            return res.status(400).json({ error: "WRONG_PASSWORD", message: "当前密码错误" });
        }
        const trimmed = String(newPassword).trim();
        if (trimmed.length !== 6) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "新密码须为 6 位" });
        }
        user.passwordHash = yield (0, security_1.hashPassword)(trimmed);
        user.passwordChangeCount = ((_c = user.passwordChangeCount) !== null && _c !== void 0 ? _c : 0) + 1;
        yield user.save();
        res.json({ success: true, passwordChangeCount: user.passwordChangeCount });
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// POST /api/users/background — 为指定场景上传自定义背景（sceneId 用 query 或 form 均可，避免 multipart 下 body 未解析）
router.post('/background', (req, res, next) => {
    upload_1.upload.single('image')(req, res, (err) => {
        if (err) {
            const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : (err.message || 'Upload failed');
            return res.status(400).json({ error: "UPLOAD_ERROR", message: msg });
        }
        next();
    });
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        if (!req.file) {
            return res.status(400).json({ error: "NO_FILE_UPLOADED", message: "请选择图片并上传（字段名须为 image）" });
        }
        // sceneId: 优先 query（multipart 时更可靠），其次 form body
        const sceneId = ((_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.sceneId) === null || _b === void 0 ? void 0 : _b.trim())
            || (((_c = req.body) === null || _c === void 0 ? void 0 : _c.sceneId) && String(req.body.sceneId).trim())
            || null;
        if (!sceneId)
            return res.status(400).json({ error: "SCENE_ID_REQUIRED", message: "请指定场景 sceneId（可用 query 或表单）" });
        const imageUrl = `/uploads/${req.file.filename}`;
        const user = yield User_1.default.findById((_d = req.user) === null || _d === void 0 ? void 0 : _d.id);
        if (!user)
            return res.status(404).json({ error: "NOT_FOUND" });
        const customBackgrounds = Object.assign({}, (user.customBackgrounds || {}));
        customBackgrounds[sceneId] = imageUrl;
        yield User_1.default.findByIdAndUpdate((_e = req.user) === null || _e === void 0 ? void 0 : _e.id, { customBackgrounds });
        res.json({ success: true, imageUrl, sceneId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// DELETE /api/users/background/:sceneId — 恢复该场景的默认背景
router.delete('/background/:sceneId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const sceneId = String(req.params.sceneId || '').trim();
        if (!sceneId)
            return res.status(400).json({ error: "SCENE_ID_REQUIRED" });
        const user = yield User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user)
            return res.status(404).json({ error: "NOT_FOUND" });
        const customBackgrounds = Object.assign({}, (user.customBackgrounds || {}));
        delete customBackgrounds[sceneId];
        yield User_1.default.findByIdAndUpdate((_b = req.user) === null || _b === void 0 ? void 0 : _b.id, { customBackgrounds });
        res.json({ success: true, sceneId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
