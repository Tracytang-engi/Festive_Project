import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function clearDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/festive-app';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('Database not connected');

        // 删除 festive-app 数据库中的所有集合（或仅 users）
        const dbName = db.databaseName;
        const collections = await db.listCollections().toArray();

        for (const col of collections) {
            await db.collection(col.name).deleteMany({});
            console.log(`Cleared collection: ${col.name}`);
        }

        console.log(`SUCCESS: All data in "${dbName}" has been cleared.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

clearDatabase();
