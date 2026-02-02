import express from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';

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
            .select('nickname region selectedScene')
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
