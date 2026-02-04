import express from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';
import { hashPassword, comparePassword } from '../utils/security';

const router = express.Router();

router.use(authMiddleware);

// GET /api/users/me
router.get('/me', async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ error: "NOT_FOUND" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/users/search?nickname=...
// nickname 为空或 "*" 时返回所有用户（排除自己），方便浏览添加好友
router.get('/search', async (req: AuthRequest, res) => {
    try {
        const { nickname } = req.query;
        const filter: any = { _id: { $ne: req.user?.id } }; // Exclude self

        if (nickname && String(nickname).trim() && String(nickname) !== '*') {
            // Partial match, case insensitive
            filter.nickname = { $regex: String(nickname).trim(), $options: 'i' };
        }
        // else: empty or "*" = browse all users

        const users = await User.find(filter)
            .select('nickname userId region selectedScene')
            .limit(100);

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// PUT /api/users/scene (Select Scene)
router.put('/scene', async (req: AuthRequest, res) => {
    try {
        const { sceneId, theme } = req.body;
        await User.findByIdAndUpdate(req.user?.id, { selectedScene: sceneId, themePreference: theme });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// PUT /api/users/scene-layout — 保存当前主题下贴纸布置（百分比位置）
router.put('/scene-layout', async (req: AuthRequest, res) => {
    try {
        const { season, positions } = req.body;
        if (!season || (season !== 'christmas' && season !== 'spring')) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "season 须为 christmas 或 spring" });
        }
        const userId = req.user?.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "NOT_FOUND" });
        const layout = (user.sceneLayout && typeof user.sceneLayout === 'object') ? { ...user.sceneLayout } : {};
        layout[season] = positions && typeof positions === 'object' ? positions : {};
        await User.findByIdAndUpdate(userId, { sceneLayout: layout });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// PUT /api/users/profile/nickname - 改名字，每人限 3 次
const NICKNAME_CHANGE_LIMIT = 3;
router.put('/profile/nickname', async (req: AuthRequest, res) => {
    try {
        const { nickname } = req.body;
        if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "名称不能为空" });
        }
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ error: "NOT_FOUND" });
        const count = (user.nicknameChangeCount ?? 0);
        if (count >= NICKNAME_CHANGE_LIMIT) {
            return res.status(400).json({ error: "LIMIT_REACHED", message: "改名字次数已用完（每人限 3 次）" });
        }
        const trimmed = String(nickname).trim();
        if (trimmed === user.nickname) {
            return res.status(400).json({ error: "SAME_NICKNAME", message: "新名称与当前相同" });
        }
        const existing = await User.findOne({ nickname: trimmed, _id: { $ne: user._id } });
        if (existing) {
            return res.status(400).json({ error: "NICKNAME_TAKEN", message: "该名称已被使用" });
        }
        user.nickname = trimmed;
        user.nicknameChangeCount = count + 1;
        await user.save();
        res.json({ success: true, nickname: user.nickname, nicknameChangeCount: user.nicknameChangeCount });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// PUT /api/users/profile/password - 更改密码，每人限 1 次
const PASSWORD_CHANGE_LIMIT = 1;
router.put('/profile/password', async (req: AuthRequest, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "请填写当前密码和新密码" });
        }
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ error: "NOT_FOUND" });
        const count = (user.passwordChangeCount ?? 0);
        if (count >= PASSWORD_CHANGE_LIMIT) {
            return res.status(400).json({ error: "LIMIT_REACHED", message: "更改密码次数已用完（每人限 1 次）" });
        }
        const valid = await comparePassword(String(currentPassword), user.passwordHash);
        if (!valid) {
            return res.status(400).json({ error: "WRONG_PASSWORD", message: "当前密码错误" });
        }
        const trimmed = String(newPassword).trim();
        if (trimmed.length !== 6) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "新密码须为 6 位" });
        }
        user.passwordHash = await hashPassword(trimmed);
        user.passwordChangeCount = (user.passwordChangeCount ?? 0) + 1;
        await user.save();
        res.json({ success: true, passwordChangeCount: user.passwordChangeCount });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// POST /api/users/background — 为指定场景上传自定义背景（sceneId 用 query 或 form 均可，避免 multipart 下 body 未解析）
router.post('/background', (req: AuthRequest, res, next) => {
    upload.single('image')(req, res, (err: any) => {
        if (err) {
            const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : (err.message || 'Upload failed');
            return res.status(400).json({ error: "UPLOAD_ERROR", message: msg });
        }
        next();
    });
}, async (req: AuthRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "NO_FILE_UPLOADED", message: "请选择图片并上传（字段名须为 image）" });
        }
        // sceneId: 优先 query（multipart 时更可靠），其次 form body
        const sceneId = (req.query?.sceneId as string)?.trim()
            || (req.body?.sceneId && String(req.body.sceneId).trim())
            || null;
        if (!sceneId) return res.status(400).json({ error: "SCENE_ID_REQUIRED", message: "请指定场景 sceneId（可用 query 或表单）" });

        const imageUrl = `/uploads/${req.file.filename}`;
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ error: "NOT_FOUND" });

        const customBackgrounds = { ...(user.customBackgrounds || {}) };
        customBackgrounds[sceneId] = imageUrl;
        await User.findByIdAndUpdate(req.user?.id, { customBackgrounds });

        res.json({ success: true, imageUrl, sceneId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// DELETE /api/users/background/:sceneId — 恢复该场景的默认背景
router.delete('/background/:sceneId', async (req: AuthRequest, res) => {
    try {
        const sceneId = String(req.params.sceneId || '').trim();
        if (!sceneId) return res.status(400).json({ error: "SCENE_ID_REQUIRED" });

        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ error: "NOT_FOUND" });

        const customBackgrounds = { ...(user.customBackgrounds || {}) };
        delete customBackgrounds[sceneId];
        await User.findByIdAndUpdate(req.user?.id, { customBackgrounds });

        res.json({ success: true, sceneId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
