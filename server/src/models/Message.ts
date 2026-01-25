import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    sender: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    stickerType: string;
    content: string; // The text message
    season: 'christmas' | 'spring';
    year: number;
    isOpened: boolean;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stickerType: { type: String, required: true },
    content: { type: String, required: true },
    season: { type: String, enum: ['christmas', 'spring'], required: true },
    year: { type: Number, required: true },
    isOpened: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
