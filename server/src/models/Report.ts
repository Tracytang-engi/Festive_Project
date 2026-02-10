import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    message: mongoose.Types.ObjectId;
    reporter: mongoose.Types.ObjectId;
    reason?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: Date;
}

const ReportSchema: Schema = new Schema({
    message: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IReport>('Report', ReportSchema);
