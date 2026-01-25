import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    encryptedPhone: string;
    nickname?: string;
    region?: string;
    gender?: string;
    age?: number;
    selectedScene?: string;
    themePreference?: 'christmas' | 'spring';
    backgroundImage?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    encryptedPhone: { type: String, required: true, unique: true },
    nickname: { type: String },
    region: { type: String },
    gender: { type: String },
    age: { type: Number },
    selectedScene: { type: String },
    themePreference: { type: String, enum: ['christmas', 'spring'], default: 'christmas' },
    backgroundImage: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
