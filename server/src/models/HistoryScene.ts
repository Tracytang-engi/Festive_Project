import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoryScene extends Document {
    user: mongoose.Types.ObjectId;
    year: number;
    season: 'christmas' | 'spring';
    data: any; // Snapshot of messages/layout
    createdAt: Date;
}

const HistorySceneSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    season: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IHistoryScene>('HistoryScene', HistorySceneSchema);
