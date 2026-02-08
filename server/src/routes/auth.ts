import express, { Request, Response } from 'express';
import { hashPassword, comparePassword, generateJWT } from '../utils/security';
import User from '../models/User';
import { ipLimiterMiddleware } from '../middleware/rateLimiter';

const router = express.Router();
// 注：auth 路由不使用 signature 验证，避免 JSON 序列化顺序导致签名不匹配

// POST /api/auth/check-id - 检查 ID 是否存在（登录第一步）
router.post('/check-id', ipLimiterMiddleware, async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: "INVALID_INPUT", message: "ID 不能为空" });
        }
        const trimmed = userId.trim();
        if (!trimmed) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "ID 不能为空" });
        }
        if (trimmed.length < 1 || trimmed.length > 10) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "ID 为 1～10 位" });
        }
        const user = await User.findOne({ userId: trimmed });
        res.json({ exists: !!user });
    } catch (err) {
        console.error("Check ID Error:", err);
        res.status(500).json({ error: "SERVER_ERROR", message: "服务器繁忙，请稍后重试" });
    }
});

// POST /api/auth/register - 注册
router.post('/register', ipLimiterMiddleware, async (req: Request, res: Response) => {
    try {
        const { nickname, userId, password, region } = req.body;
        if (!nickname || !userId || !password) {
            return res.status(400).json({
                error: "INVALID_INPUT",
                message: "名称、ID 和密码均为必填"
            });
        }
        if (!region || typeof region !== 'string' || !region.trim()) {
            return res.status(400).json({
                error: "INVALID_INPUT",
                message: "请选择地区"
            });
        }
        const trimmedNickname = String(nickname).trim();
        const trimmedUserId = String(userId).trim();
        const trimmedPassword = String(password).trim();

        // [DEBUG] 排查传参与重复检查
        console.log('[REGISTER] 收到参数:', {
            nickname: JSON.stringify(trimmedNickname),
            nicknameLen: trimmedNickname.length,
            userId: JSON.stringify(trimmedUserId),
            userIdLen: trimmedUserId.length,
            region: JSON.stringify(String(region).trim())
        });

        if (!trimmedNickname || !trimmedUserId || !trimmedPassword) {
            return res.status(400).json({
                error: "INVALID_INPUT",
                message: "名称、ID 和密码不能为空"
            });
        }

        if (trimmedUserId.length < 1 || trimmedUserId.length > 10) {
            return res.status(400).json({
                error: "INVALID_ID",
                message: "ID 为 1～10 位"
            });
        }
        if (trimmedPassword.length !== 6) {
            return res.status(400).json({
                error: "WEAK_PASSWORD",
                message: "密码必须为 6 位"
            });
        }

        // 检查 ID 或名称是否已存在（精确匹配，避免 Mongoose regex 误匹配）
        const existingById = await User.findOne({ userId: trimmedUserId });
        const existingByNickname = await User.findOne({ nickname: trimmedNickname });

        if (existingById) {
            console.log('[REGISTER] 触发原因: userId 已存在, 匹配到用户:', existingById._id);
            return res.status(400).json({
                error: "DUPLICATE",
                message: "该名称/ID 已经被使用，请重新输入"
            });
        }
        if (existingByNickname) {
            console.log('[REGISTER] 触发原因: nickname 已存在, 匹配到用户:', existingByNickname._id);
            return res.status(400).json({
                error: "DUPLICATE",
                message: "该名称/ID 已经被使用，请重新输入"
            });
        }

        const passwordHash = await hashPassword(trimmedPassword);
        const user = await User.create({
            userId: trimmedUserId,
            nickname: trimmedNickname,
            passwordHash,
            region: String(region).trim()
        });

        const token = generateJWT((user._id as any).toString());
        res.status(200).json({ success: true, token });
    } catch (err: any) {
        console.error("Register Error:", err);
        const isDup = err?.code === 11000; // MongoDB duplicate key（如并发或索引与查询不一致）
        console.log('[REGISTER] catch 分支: err.code=', err?.code, ', isDup=', isDup);
        res.status(isDup ? 400 : 500).json({
            error: isDup ? "DUPLICATE" : "SERVER_ERROR",
            message: isDup ? "该名称/ID 已经被使用，请重新输入" : "服务器繁忙，请稍后重试"
        });
    }
});

// POST /api/auth/login - 登录
router.post('/login', ipLimiterMiddleware, async (req: Request, res: Response) => {
    try {
        const { userId, password } = req.body;
        if (!userId || !password) {
            return res.status(400).json({
                error: "INVALID_INPUT",
                message: "ID 和密码不能为空"
            });
        }
        const trimmedUserId = String(userId).trim();
        const trimmedPassword = String(password).trim();

        if (trimmedUserId.length < 1 || trimmedUserId.length > 10) {
            return res.status(400).json({
                error: "INVALID_INPUT",
                message: "ID 为 1～10 位"
            });
        }
        if (trimmedPassword.length !== 6) {
            return res.status(400).json({
                error: "INVALID_INPUT",
                message: "密码必须为 6 位"
            });
        }

        const user = await User.findOne({ userId: trimmedUserId });
        if (!user) {
            return res.status(400).json({
                error: "NOT_FOUND",
                message: "请先注册账号"
            });
        }

        // 检查是否被冻结
        if (user.lockedUntil && new Date() < user.lockedUntil) {
            const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
            return res.status(403).json({
                error: "ACCOUNT_LOCKED",
                message: `账户已冻结，请 ${Math.ceil(remaining / 60)} 分钟后再试`
            });
        }

        const isValid = await comparePassword(trimmedPassword, user.passwordHash);
        if (!isValid) {
            const attempts = (user.loginAttempts || 0) + 1;
            user.loginAttempts = attempts;

            if (attempts >= 10) {
                user.lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 小时
                user.loginAttempts = 0;
                await user.save();
                return res.status(403).json({
                    error: "ACCOUNT_LOCKED",
                    message: "密码错误次数过多，账户已冻结 1 小时"
                });
            }
            if (attempts >= 5) {
                user.lockedUntil = new Date(Date.now() + 60 * 1000); // 1 分钟
                user.loginAttempts = 0;
                await user.save();
                return res.status(403).json({
                    error: "ACCOUNT_LOCKED",
                    message: "密码错误次数过多，账户已冻结 1 分钟"
                });
            }

            await user.save();
            const remaining = 5 - attempts;
            return res.status(400).json({
                error: "INVALID_PASSWORD",
                message: remaining > 0 ? `密码错误，还可尝试 ${remaining} 次` : "密码错误"
            });
        }

        // 登录成功，重置失败次数
        user.loginAttempts = 0;
        user.lockedUntil = undefined;
        await user.save();

        const token = generateJWT((user._id as any).toString());
        res.status(200).json({ success: true, token });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "SERVER_ERROR", message: "服务器繁忙，请稍后重试" });
    }
});

export default router;
