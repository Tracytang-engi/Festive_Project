import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
    imageUrl: string;
    linkUrl: string;
    active: boolean;
    createdAt: Date;
}

const AdSchema: Schema = new Schema({
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAd>('Ad', AdSchema);
