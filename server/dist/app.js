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
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const User_1 = __importDefault(require("./models/User"));
const security_1 = require("./utils/security");
// 从 server 根目录加载 .env（兼容 PM2 不同 cwd）
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
/** 确保新手指引默认账户存在（userId=onboarding_guide，昵称=新手指引小助手），申请即通过且为默认好友 */
function ensureOnboardingBotUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = (process.env.ONBOARDING_BOT_USER_ID || 'onboarding_guide').trim();
            const nickname = (process.env.ONBOARDING_BOT_NICKNAME || '新手指引小助手').trim();
            let u = yield User_1.default.findOne({ userId });
            if (u) {
                console.log('[Onboarding] 新手指引默认账户已存在:', u.nickname);
                return;
            }
            u = yield User_1.default.findOne({ nickname });
            if (u) {
                console.log('[Onboarding] 新手指引账户已存在（昵称）:', nickname);
                return;
            }
            const passwordHash = yield (0, security_1.hashPassword)(crypto_1.default.randomBytes(32).toString('hex'));
            yield User_1.default.create({ userId, nickname, passwordHash });
            console.log('[Onboarding] 新手指引默认账户已创建:', nickname);
        }
        catch (e) {
            console.warn('[Onboarding] 创建默认账户失败:', e.message);
        }
    });
}
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const friends_1 = __importDefault(require("./routes/friends"));
const messages_1 = __importDefault(require("./routes/messages"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const history_1 = __importDefault(require("./routes/history"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
// Security Middleware (allow frontend to load /uploads images cross-origin)
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd
    ? (process.env.FRONTEND_ORIGIN
        ? [process.env.FRONTEND_ORIGIN, 'https://festickers.com', 'https://www.festickers.com']
        : ['https://festickers.com', 'https://www.festickers.com'])
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin)
            cb(null, true);
        else if (allowedOrigins.includes(origin))
            cb(null, true);
        else if (!isProd)
            cb(null, true);
        else
            cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-signature', 'x-timestamp']
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
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
// Routes Mounting
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/friends', friends_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/history', history_1.default);
app.use('/api/admin', admin_1.default);
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
mongoose_1.default.connect(MONGO_URI)
    .then(() => { console.log('MongoDB Connected'); return ensureOnboardingBotUser(); })
    .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
    .catch(err => console.error('MongoDB Connection Error:', err));
exports.default = app;
