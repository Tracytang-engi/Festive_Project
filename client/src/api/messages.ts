import api from './client';
import type { Message } from '../types';

export const getMessages = async (season: string): Promise<{ messages: Message[], isUnlocked: boolean }> => {
    const response = await api.get(`/messages/${season}`);
    return response.data;
};

export const sendMessage = async (data: {
    recipientId: string;
    stickerType: string;
    content: string;
    season: string;
    sceneId?: string;
    isPrivate?: boolean;
}): Promise<void> => {
    await api.post('/messages', data);
};

export const deleteMessage = async (messageId: string): Promise<void> => {
    await api.delete(`/messages/${messageId}`);
};

export const reportMessage = async (messageId: string, reason?: string): Promise<void> => {
    await api.post(`/messages/${messageId}/report`, { reason });
};
