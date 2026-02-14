import express from 'express';
import Friend from '../models/Friend';
import User from '../models/User';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);

/** 新手指引默认账户：Andy，申请即通过、且为所有人默认好友。
 * 环境变量：ONBOARDING_BOT_OBJECT_ID、ONBOARDING_BOT_USER_ID、ONBOARDING_BOT_NICKNAME 可选覆盖。 */
const DEFAULT_BOT_USER_ID = '20070421';
const DEFAULT_BOT_NICKNAME = 'Andy';
function getOnboardingBotUserId(): string {
    return (process.env.ONBOARDING_BOT_USER_ID || DEFAULT_BOT_USER_ID).trim();
}
function getOnboardingBotObjectId(): string | null {
    const id = process.env.ONBOARDING_BOT_OBJECT_ID;
    return (id && typeof id === 'string' && id.trim()) ? id.trim() : null;
}
function getOnboardingBotNickname(): string | null {
    const n = process.env.ONBOARDING_BOT_NICKNAME;
    return (n && typeof n === 'string' && n.trim()) ? n.trim().toLowerCase() : null;
}

function isOnboardingBot(targetUserId: string, targetUser: { userId?: string; nickname?: string } | null): boolean {
    if (!targetUser) return false;
    const botOid = getOnboardingBotObjectId();
    if (botOid && String(targetUserId).trim() === String(botOid).trim()) return true;
    const uId = (targetUser.userId != null && String(targetUser.userId).trim()) || '';
    if (uId === String(getOnboardingBotUserId()).trim()) return true;
    const nick = (targetUser.nickname && String(targetUser.nickname).trim()) || '';
    const nickLower = nick.toLowerCase();
    if (nickLower === '新手指引小助手' || nick.includes('新手指引')) return true;
    if (nickLower === 'andy' || nickLower.includes('andy')) return true;
    const botNick = getOnboardingBotNickname();
    if (botNick && (nickLower === botNick || nickLower.includes(botNick))) return true;
    return false;
}

/** 获取新手指引默认好友的 MongoDB _id。优先级：env _id → userId → env 昵称 → 昵称含 新手指引/andy */
async function getDefaultFriendBotId(): Promise<string | null> {
    const botOid = getOnboardingBotObjectId();
    if (botOid) {
        const u = await User.findById(botOid).select('_id').lean();
        if (u) return String(u._id);
    }
    const byUserId = await User.findOne({ userId: getOnboardingBotUserId() }).select('_id').lean();
    if (byUserId) return String(byUserId._id);
    const botNick = getOnboardingBotNickname();
    if (botNick) {
        const u = await User.findOne({ nickname: new RegExp('^' + escapeRegex(botNick) + '$', 'i') }).select('_id').lean();
        if (u) return String(u._id);
    }
    let u = await User.findOne({ userId: DEFAULT_BOT_USER_ID }).select('_id').lean();
    if (u) return String(u._id);
    u = await User.findOne({ nickname: /新手指引/ }).select('_id').lean();
    if (u) return String(u._id);
    u = await User.findOne({ nickname: /andy/i }).select('_id').lean();
    return u ? String(u._id) : null;
}
function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

        const targetUser = await User.findById(targetUserId).select('userId nickname').lean();
        const isAndy = isOnboardingBot(String(targetUserId), targetUser);

        const friendRequest = await Friend.create({
            requester: requesterId,
            recipient: targetUserId,
            status: isAndy ? 'accepted' : 'pending'
        });

        if (isAndy) {
            await Notification.create({
                recipient: requesterId,
                type: 'CONNECTION_SUCCESS',
                relatedUser: targetUserId,
                relatedEntityId: friendRequest._id
            });
        } else {
            await Notification.create({
                recipient: targetUserId,
                type: 'FRIEND_REQUEST',
                relatedUser: requesterId,
                relatedEntityId: friendRequest._id
            });
        }

        res.json({ success: true, autoAccepted: !!isAndy });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/friends/onboarding-bot-id — 查询新手指引默认账户的 _id（用于 .env 的 ONBOARDING_BOT_OBJECT_ID）
router.get('/onboarding-bot-id', async (_req: AuthRequest, res) => {
    try {
        const botUserId = getOnboardingBotUserId();
        const user = await User.findOne({ userId: botUserId }).select('_id nickname userId').lean();
        if (!user) {
            return res.json({ ok: false, message: '未找到 userId=' + botUserId + ' 的新手指引账户，请重启后端以自动创建' });
        }
        res.json({
            ok: true,
            onboardingBotObjectId: String(user._id),
            nickname: user.nickname,
            userId: user.userId,
            hint: '可选填入 .env: ONBOARDING_BOT_OBJECT_ID=' + String(user._id),
        });
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
            return res.status(403).json({ error: "UNAUTHORIZED", message: "无权操作此请求 Unauthorized to respond to this request." });
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

// GET /api/friends/requests/sent — 我发出的、待对方处理的好友请求（用于发现页灰显「已发送」）
router.get('/requests/sent', async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const list = await Friend.find({ requester: userId, status: 'pending' })
            .select('recipient')
            .lean();
        const sentToIds = list.map((r: any) => r.recipient.toString());
        res.json(sentToIds);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
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
        if (!link) return res.status(403).json({ error: "NOT_FRIENDS", message: "仅可查看好友的装饰 Only friends can view this decor." });

        const friend = await User.findById(friendId)
            .select('nickname avatar selectedScene themePreference customBackgrounds sceneLayout')
            .lean();
        if (!friend) return res.status(404).json({ error: "USER_NOT_FOUND" });

        const messages = await Message.find({ recipient: friendId, season: 'spring' })
            .select('_id stickerType sceneId isPrivate content sender createdAt')
            .populate('sender', '_id nickname avatar')
            .lean();

        // 贴纸内容锁定：节日当天 00:00（北京时间）后解锁，与 messages 接口一致
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const chinaTime = new Date(utc + (3600000 * 8));
        const currentYear = chinaTime.getFullYear();
        const month = chinaTime.getMonth();
        const date = chinaTime.getDate();
        let isUnlocked = false;
        if (currentYear === 2025 && month === 0 && date >= 29) isUnlocked = true;
        else if (currentYear === 2026 && month === 1 && date >= 17) isUnlocked = true;
        else if (currentYear === 2027 && month === 1 && date >= 6) isUnlocked = true;
        else if (currentYear === 2024 && month === 1 && date >= 10) isUnlocked = true;
        // 测试账号可提前预览好友页贴纸
        if (!isUnlocked && userId) {
            const viewer = await User.findById(userId).select('userId role').lean();
            if (viewer && (viewer.userId === '111111' || viewer.userId === '20070421' || viewer.role === 'moderator')) {
                isUnlocked = true;
            }
        }

        const messagesForClient = messages.map((m: any) => {
            const base = {
                _id: m._id.toString(),
                stickerType: m.stickerType,
                sceneId: m.sceneId,
                isPrivate: !!m.isPrivate,
            };
            if (m.isPrivate) {
                const senderId = m.sender && (m.sender._id || m.sender).toString();
                const requesterIsSenderOrRecipient = userId === senderId || userId === friendId;
                if (requesterIsSenderOrRecipient) {
                    return { ...base, content: m.content, sender: m.sender, createdAt: m.createdAt };
                }
                return { ...base, sender: m.sender };
            }
            if (!isUnlocked) {
                return { ...base, content: 'LOCKED UNTIL FESTIVAL', sender: m.sender, createdAt: m.createdAt };
            }
            return {
                ...base,
                content: m.content,
                sender: m.sender,
                createdAt: m.createdAt,
            };
        });

        res.set('Cache-Control', 'no-store');
        res.json({ ...friend, messages: messagesForClient, isUnlocked });
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// GET /api/friends — 好友列表；Andy 作为默认好友，若尚未存在则自动建立关系并加入列表
router.get('/', async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        let friends = await Friend.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).populate('requester', 'nickname region avatar')
            .populate('recipient', 'nickname region avatar');

        // 新手指引账户为默认好友：若当前用户还没有该账户，则自动创建 accepted 关系并加入列表（失败也不影响返回已有列表）
        try {
            const andyId = await getDefaultFriendBotId();
            if (andyId && userId !== andyId) {
                const hasAndy = friends.some(
                    (f: any) => f.requester._id.toString() === andyId || f.recipient._id.toString() === andyId
                );
                if (!hasAndy) {
                    const newConn = await Friend.create({
                        requester: userId,
                        recipient: andyId,
                        status: 'accepted'
                    });
                    const andyUser = await User.findById(andyId).select('_id nickname region avatar').lean();
                    if (andyUser) {
                        friends = [...friends, {
                            _id: newConn._id,
                            requester: { _id: userId },
                            recipient: { _id: andyUser._id, nickname: andyUser.nickname, region: andyUser.region, avatar: andyUser.avatar }
                        } as any];
                    }
                }
            }
        } catch (_) {
            // 默认好友逻辑失败时仍返回已有列表，不抛 500
        }

        // Transform to return the *other* user
        const result = friends.map((f: any) => {
            const isRequester = f.requester._id.toString() === userId;
            return {
                _id: f._id,
                friend: isRequester ? f.recipient : f.requester
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
