import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import friendRoutes from './routes/friends';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import adRoutes from './routes/ads';
import historyRoutes from './routes/history';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Configure this strictly in production!
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-signature', 'x-timestamp']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/festive-app';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/history', historyRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
