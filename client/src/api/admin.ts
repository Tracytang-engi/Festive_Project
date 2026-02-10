import api from './client';

export interface ReportItem {
    _id: string;
    message: {
        _id: string;
        content: string;
        stickerType: string;
        isPrivate: boolean;
        sender?: { nickname: string; userId: string };
        recipient?: { nickname: string; userId: string };
        createdAt: string;
    };
    reporter?: { nickname: string; userId: string };
    reason?: string;
    status: string;
    createdAt: string;
}

export const getReports = async (): Promise<ReportItem[]> => {
    const response = await api.get('/admin/reports');
    return response.data;
};

export const resolveReport = async (reportId: string, deleteMessage?: boolean): Promise<void> => {
    await api.put(`/admin/reports/${reportId}`, { action: 'resolve', deleteMessage: !!deleteMessage });
};

export const dismissReport = async (reportId: string): Promise<void> => {
    await api.put(`/admin/reports/${reportId}`, { action: 'dismiss' });
};
