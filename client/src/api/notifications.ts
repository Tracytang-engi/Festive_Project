import api from './client';
import type { User } from '../types';

export interface NotificationItem {
    _id: string;
    recipient: string;
    type: 'FRIEND_REQUEST' | 'NEW_MESSAGE' | 'CONNECTION_SUCCESS';
    relatedUser: User;
    relatedEntityId: string;
    isRead: boolean;
    createdAt: string;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
    const response = await api.get('/notifications');
    return response.data;
};

export const markAllAsRead = async (): Promise<void> => {
    await api.put('/notifications/read-all');
};
