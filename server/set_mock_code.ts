
import mongoose from 'mongoose';
import VerificationCode from './src/models/VerificationCode';
import { encryptPhone, hashCode } from './src/utils/security';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function setMockCode() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/festive-app');
        console.log('Connected to DB');

        const phoneNumber = '12345678';
        const mockCode = '123456';

        const encryptedPhone = encryptPhone(phoneNumber);
        const codeHash = await hashCode(mockCode);

        // Remove existing codes for this phone
        await VerificationCode.deleteMany({ encryptedPhone });

        // Create new valid code
        await VerificationCode.create({
            encryptedPhone,
            codeHash,
            ipAddress: '127.0.0.1',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins for manual testing
        });

        console.log(`SUCCESS: Set code '${mockCode}' for phone '${phoneNumber}'`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

setMockCode();
