import api from './client';
import type { Message } from '../types';

export const getMessages = async (season: string): Promise<{ messages: Message[], isUnlocked: boolean }> => {
    const response = await api.get(`/messages/${season}`);
    return response.data;
};

export const getMessageDetail = async (messageId: string): Promise<{ message: Message; isUnlocked: boolean }> => {
    const response = await api.get(`/messages/detail/${messageId}`);
    return response.data;
};

export const getSentMessages = async (season: string): Promise<{ messages: Message[] }> => {
    const response = await api.get(`/messages/sent/${season}`);
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

/** Sender updates where their sticker is placed on the recipient's scene (percent 0–100). */
export const updateMessagePosition = async (messageId: string, left: number, top: number): Promise<void> => {
    await api.put(`/messages/${messageId}/position`, { left, top });
};
