import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
    encryptedPhone: string;
    codeHash: string;
    expiresAt: Date;
    ipAddress: string;
    createdAt: Date;
}

const VerificationCodeSchema: Schema = new Schema({
    encryptedPhone: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 }, // TTL index auto-deletes
    ipAddress: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
