import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    sender: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    stickerType: string;
    content: string;
    season: 'christmas' | 'spring';
    year: number;
    /** 抵达场景：spring_dinner | spring_temple_fair | spring_couplets | spring_firecrackers | xmas_1 | xmas_2 | xmas_3 */
    sceneId?: string;
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
    sceneId: { type: String },
    isOpened: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
