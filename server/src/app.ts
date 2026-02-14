import path from 'path';
import crypto from 'crypto';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import User from './models/User';
import { hashPassword } from './utils/security';

// 从 server 根目录加载 .env（兼容 PM2 不同 cwd）
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/** 确保新手指引默认账户存在（userId=onboarding_guide，昵称=新手指引小助手），申请即通过且为默认好友 */
async function ensureOnboardingBotUser(): Promise<void> {
    try {
        const userId = (process.env.ONBOARDING_BOT_USER_ID || 'onboarding_guide').trim();
        const nickname = (process.env.ONBOARDING_BOT_NICKNAME || '新手指引小助手').trim();
        const existing = await User.findOne({ userId });
        if (existing) return;
        const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
        await User.create({ userId, nickname, passwordHash });
        console.log('[Onboarding] 新手指引默认账户已创建:', nickname);
    } catch (e) {
        console.warn('[Onboarding] 创建默认账户失败（可忽略）:', (e as Error).message);
    }
}

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import friendRoutes from './routes/friends';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import historyRoutes from './routes/history';
import adminRoutes from './routes/admin';

const app = express();

// Security Middleware (allow frontend to load /uploads images cross-origin)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd
    ? (process.env.FRONTEND_ORIGIN
        ? [process.env.FRONTEND_ORIGIN, 'https://festickers.com', 'https://www.festickers.com']
        : ['https://festickers.com', 'https://www.festickers.com'])
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) cb(null, true);
        else if (allowedOrigins.includes(origin)) cb(null, true);
        else if (!isProd) cb(null, true);
        else cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-signature', 'x-timestamp']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// OPTIONS 预检必须在鉴权之前处理；app.options('*') 只匹配路径 '*'，故用中间件拦截所有 OPTIONS
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature, x-timestamp');
        return res.status(204).end();
    }
    next();
});

// Database Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/festive-app';
mongoose.connect(MONGO_URI)
    .then(() => { console.log('MongoDB Connected'); return ensureOnboardingBotUser(); })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// 404 时打印请求路径，便于排查浏览器 404
app.use((req, res) => {
    console.warn('[404]', req.method, req.originalUrl || req.path);
    res.status(404).json({ error: 'NOT_FOUND' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
