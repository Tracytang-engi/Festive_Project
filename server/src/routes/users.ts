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

// POST /api/users/background
router.post('/background', upload.single('image'), async (req: AuthRequest, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "NO_FILE_UPLOADED" });

        // Construct URL (assuming local storage)
        // In production, you might return a full URL or CDN path.
        // For now, we return a relative path that the client can prepend the server origin to,
        // OR a relative path that works if the client proxies to the server.
        // Let's store '/uploads/filename'
        const imageUrl = `/uploads/${req.file.filename}`;

        await User.findByIdAndUpdate(req.user?.id, { backgroundImage: imageUrl });

        res.json({ success: true, imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
