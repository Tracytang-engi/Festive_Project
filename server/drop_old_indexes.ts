import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function dropOldIndexes() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/festive-app';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('Database not connected');

        const users = db.collection('users');
        const indexes = await users.indexes();

        for (const idx of indexes) {
            const name = idx.name;
            if (name && (name === 'encryptedPhone_1' || (idx.key as any)?.encryptedPhone)) {
                await users.dropIndex(name);
                console.log(`Dropped old index: ${name}`);
            }
        }

        console.log('SUCCESS: Old indexes removed.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

dropOldIndexes();
