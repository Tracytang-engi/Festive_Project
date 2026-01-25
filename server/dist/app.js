"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const friends_1 = __importDefault(require("./routes/friends"));
const messages_1 = __importDefault(require("./routes/messages"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const ads_1 = __importDefault(require("./routes/ads"));
const history_1 = __importDefault(require("./routes/history"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: '*', // Configure this strictly in production!
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-signature', 'x-timestamp']
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
// Database Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/festive-app';
mongoose_1.default.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));
// Routes Mounting
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/friends', friends_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/ads', ads_1.default);
app.use('/api/history', history_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
