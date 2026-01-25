import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    type: 'FRIEND_REQUEST' | 'CONNECTION_SUCCESS' | 'NEW_MESSAGE';
    relatedUser?: mongoose.Types.ObjectId; // Who triggered it
    relatedEntityId?: mongoose.Types.ObjectId; // ID of message or friend request
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['FRIEND_REQUEST', 'CONNECTION_SUCCESS', 'NEW_MESSAGE'], required: true },
    relatedUser: { type: Schema.Types.ObjectId, ref: 'User' },
    relatedEntityId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
