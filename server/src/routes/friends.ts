import express from 'express';
import Friend from '../models/Friend';
import User from '../models/User';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

// POST /api/friends/request
router.post('/request', async (req: AuthRequest, res) => {
    try {
        const { targetUserId } = req.body;
        const requesterId = req.user?.id;

        if (targetUserId === requesterId) return res.status(400).json({ error: "Cannot add self" });

        // Check existing
        const existing = await Friend.findOne({
            $or: [
                { requester: requesterId, recipient: targetUserId },
                { requester: targetUserId, recipient: requesterId }
            ]
        });

        if (existing) {
            return res.status(400).json({ error: "Request already exists or connected" });
        }

        const friendRequest = await Friend.create({
            requester: requesterId,
            recipient: targetUserId,
            status: 'pending'
        });

        // Create Notification
        await Notification.create({
            recipient: targetUserId,
            type: 'FRIEND_REQUEST',
            relatedUser: requesterId,
            relatedEntityId: friendRequest._id
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// POST /api/friends/respond
router.post('/respond', async (req: AuthRequest, res) => {
    try {
        const { requestId, action } = req.body; // action: 'accept' | 'reject'
        const userId = req.user?.id;

        const request = await Friend.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        // Verify recipient is current user
        if (request.recipient.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        if (action === 'accept') {
            request.status = 'accepted';
            await request.save();

            // Notify requester
            await Notification.create({
                recipient: request.requester,
                type: 'CONNECTION_SUCCESS',
                relatedUser: userId,
                relatedEntityId: request._id
            });
        } else {
            // Reject - just delete
            await Friend.findByIdAndDelete(requestId);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/friends/check/:targetId
router.get('/check/:targetId', async (req: AuthRequest, res) => {
    try {
        const { targetId } = req.params;
        const userId = req.user?.id;

        const request = await Friend.findOne({
            $or: [
                { requester: userId, recipient: targetId, status: 'accepted' },
                { requester: targetId, recipient: userId, status: 'accepted' }
            ]
        });

        res.json({ isFriend: !!request });
    } catch (err) {
        res.json({ isFriend: false });
    }
});

// GET /api/friends/requests
router.get('/requests', async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const requests = await Friend.find({
            recipient: userId,
            status: 'pending'
        }).populate('requester', 'nickname region avatar');

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/friends/:friendId/decor — 查看好友的主题装饰（仅好友可看）
router.get('/:friendId/decor', async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const { friendId } = req.params;
        if (!friendId) return res.status(400).json({ error: "FRIEND_ID_REQUIRED" });

        const link = await Friend.findOne({
            $or: [
                { requester: userId, recipient: friendId, status: 'accepted' },
                { requester: friendId, recipient: userId, status: 'accepted' }
            ]
        });
        if (!link) return res.status(403).json({ error: "NOT_FRIENDS", message: "仅可查看好友的装饰" });

        const friend = await User.findById(friendId)
            .select('nickname avatar selectedScene themePreference customBackgrounds sceneLayout')
            .lean();
        if (!friend) return res.status(404).json({ error: "USER_NOT_FOUND" });

        const messages = await Message.find({ recipient: friendId, season: 'spring' })
            .select('_id stickerType sceneId')
            .lean();
        const messagesForClient = messages.map((m: any) => ({
            _id: m._id.toString(),
            stickerType: m.stickerType,
            sceneId: m.sceneId,
        }));

        res.json({ ...friend, messages: messagesForClient });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/friends
router.get('/', async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const friends = await Friend.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).populate('requester', 'nickname region avatar')
            .populate('recipient', 'nickname region avatar');

        // Transform to return the *other* user
        const result = friends.map(f => {
            const isRequester = f.requester._id.toString() === userId;
            return {
                _id: f._id, // Connection ID
                friend: isRequester ? f.recipient : f.requester
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
