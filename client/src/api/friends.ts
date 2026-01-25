import api from './client';
import type { User } from '../types';

// Get list of friends (the server returns { _id, friend: User }[])
export const getFriends = async (): Promise<User[]> => {
    const response = await api.get('/friends');
    // Map to just the User object
    return response.data.map((item: { friend: User }) => item.friend);
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

// Get pending friend requests
export const getFriendRequests = async (): Promise<any[]> => {
    const response = await api.get('/friends/requests');
    return response.data;
};
