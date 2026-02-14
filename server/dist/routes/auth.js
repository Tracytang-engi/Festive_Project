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
const security_1 = require("../utils/security");
const User_1 = __importDefault(require("../models/User"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
// 注：auth 路由不使用 signature 验证，避免 JSON 序列化顺序导致签名不匹配
// POST /api/auth/check-id - 检查 ID 是否存在（登录第一步）
router.post('/check-id', rateLimiter_1.ipLimiterMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const user = yield User_1.default.findOne({ userId: trimmed });
        res.json({ exists: !!user });
    }
    catch (err) {
        console.error("Check ID Error:", (_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : err);
        res.status(500).json({ error: "SERVER_ERROR", message: "服务器繁忙，请稍后重试" });
    }
}));
// POST /api/auth/register - 注册
router.post('/register', rateLimiter_1.ipLimiterMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nickname, userId, password, region, avatar } = req.body;
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
        const existingById = yield User_1.default.findOne({ userId: trimmedUserId });
        const existingByNickname = yield User_1.default.findOne({ nickname: trimmedNickname });
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
        const passwordHash = yield (0, security_1.hashPassword)(trimmedPassword);
        const avatarStr = (avatar != null && String(avatar).trim()) ? String(avatar).trim().slice(0, 8) : '👤';
        const user = yield User_1.default.create({
            userId: trimmedUserId,
            nickname: trimmedNickname,
            avatar: avatarStr,
            passwordHash,
            region: String(region).trim()
        });
        const token = (0, security_1.generateJWT)(user._id.toString());
        res.status(200).json({ success: true, token });
    }
    catch (err) {
        console.error("Register Error:", err);
        const isDup = (err === null || err === void 0 ? void 0 : err.code) === 11000; // MongoDB duplicate key（如并发或索引与查询不一致）
        console.log('[REGISTER] catch 分支: err.code=', err === null || err === void 0 ? void 0 : err.code, ', isDup=', isDup);
        res.status(isDup ? 400 : 500).json({
            error: isDup ? "DUPLICATE" : "SERVER_ERROR",
            message: isDup ? "该名称/ID 已经被使用，请重新输入" : "服务器繁忙，请稍后重试"
        });
    }
}));
// POST /api/auth/login - 登录
router.post('/login', rateLimiter_1.ipLimiterMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const user = yield User_1.default.findOne({ userId: trimmedUserId });
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
        const isValid = yield (0, security_1.comparePassword)(trimmedPassword, user.passwordHash);
        if (!isValid) {
            const attempts = (user.loginAttempts || 0) + 1;
            user.loginAttempts = attempts;
            if (attempts >= 10) {
                user.lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 小时
                user.loginAttempts = 0;
                yield user.save();
                return res.status(403).json({
                    error: "ACCOUNT_LOCKED",
                    message: "密码错误次数过多，账户已冻结 1 小时"
                });
            }
            if (attempts >= 5) {
                user.lockedUntil = new Date(Date.now() + 60 * 1000); // 1 分钟
                user.loginAttempts = 0;
                yield user.save();
                return res.status(403).json({
                    error: "ACCOUNT_LOCKED",
                    message: "密码错误次数过多，账户已冻结 1 分钟"
                });
            }
            yield user.save();
            const remaining = 5 - attempts;
            return res.status(400).json({
                error: "INVALID_PASSWORD",
                message: remaining > 0 ? `密码错误，还可尝试 ${remaining} 次` : "密码错误"
            });
        }
        // 登录成功，重置失败次数
        user.loginAttempts = 0;
        user.lockedUntil = undefined;
        yield user.save();
        const token = (0, security_1.generateJWT)(user._id.toString());
        res.status(200).json({ success: true, token });
    }
    catch (err) {
        console.error("Login Error:", (_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : err);
        res.status(500).json({ error: "SERVER_ERROR", message: "服务器繁忙，请稍后重试" });
    }
}));
exports.default = router;
