import api from './client';
import type { User } from '../types';

// Get list of friends (the server returns { _id, friend: User }[])
export const getFriends = async (): Promise<User[]> => {
    const response = await api.get('/friends');
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: { friend?: User }) => item.friend).filter((u): u is User => u != null);
};

// Start a friend request
export const addFriend = async (targetUserId: string): Promise<void> => {
    await api.post('/friends/request', { targetUserId });
};

// Accept/Reject friend request
export const respondToFriendRequest = async (requestId: string, action: 'accept' | 'reject'): Promise<void> => {
    await api.post('/friends/respond', { requestId, action });
};

// Search users
export const searchUsers = async (nickname: string): Promise<User[]> => {
    const response = await api.get(`/users/search?nickname=${encodeURIComponent(nickname)}`);
    return response.data;
};

// Get pending friend requests (received by me)
export const getFriendRequests = async (): Promise<any[]> => {
    const response = await api.get('/friends/requests');
    return response.data;
};

/** 我发出的、待对方处理的好友请求对应的用户 ID 列表（发现页灰显「已发送」用） */
export const getSentFriendRequestIds = async (): Promise<string[]> => {
    const response = await api.get<string[]>('/friends/requests/sent');
    return Array.isArray(response.data) ? response.data : [];
};

/** 好友的贴纸消息（仅用于展示布置） */
export interface FriendDecorMessage {
    _id: string;
    stickerType: string;
    sceneId?: string;
    isPrivate?: boolean;
    /** 公开消息才有，用于 StickerDetailModal */
    content?: string;
    sender?: { _id?: string; nickname: string; avatar?: string };
    createdAt?: string;
}

/** 好友主题装饰（查看用，含场景、背景与布置） */
export interface FriendDecor {
    nickname: string;
    avatar?: string;
    selectedScene?: string;
    themePreference?: 'christmas' | 'spring';
    customBackgrounds?: Record<string, string>;
    /** 场景贴纸布置：{ spring: { [messageId]: { left, top } } }，百分比 */
    sceneLayout?: Record<string, Record<string, { left: number; top: number }>>;
    /** 对方收到的春节贴纸列表，用于展示具体贴纸 */
    messages?: FriendDecorMessage[];
    /** 贴纸内容是否已解锁（节日当天 00:00 后为 true） */
    isUnlocked?: boolean;
}

// 查看好友的主题装饰页数据（仅好友可调）
// bustCache: 发送贴纸后 refetch 时传 true，避免浏览器/CDN 返回旧缓存导致发送者看不到新贴纸
export const getFriendDecor = async (friendId: string, options?: { bustCache?: boolean }): Promise<FriendDecor> => {
    const params = options?.bustCache ? { _t: Date.now() } : undefined;
    const response = await api.get(`/friends/${friendId}/decor`, { params });
    return response.data;
};
