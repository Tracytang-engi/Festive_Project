import mongoose, { Schema, Document } from 'mongoose';

export interface IFriend extends Document {
    requester: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted';
    createdAt: Date;
}

const FriendSchema: Schema = new Schema({
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Ensure unique friendship pair
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export default mongoose.model<IFriend>('Friend', FriendSchema);
