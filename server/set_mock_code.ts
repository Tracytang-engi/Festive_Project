import mongoose from 'mongoose';
import User from './src/models/User';
import { hashPassword } from './src/utils/security';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function setMockUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/festive-app');
        console.log('Connected to DB');

        const userId = 'test12';
        const nickname = '测试用户';
        const password = '123456';

        const existing = await User.findOne({ userId });
        if (existing) {
            console.log(`User '${userId}' already exists. Skipping.`);
        } else {
            const passwordHash = await hashPassword(password);
            await User.create({
                userId,
                nickname,
                passwordHash
            });
            console.log(`SUCCESS: Created test user - ID: ${userId}, Password: ${password}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

setMockUser();
