import api from './client';

export interface HistoryItem {
    _id: string;
    year: number;
    season: 'christmas' | 'spring';
}

export interface HistorySceneData {
    _id: string;
    year: number;
    season: 'christmas' | 'spring';
    data: {
        messages: any[]; // Using any primarily, but structure matches Message
    };
    createdAt: string;
}

export const getHistoryList = async (): Promise<HistoryItem[]> => {
    const response = await api.get('/history/years');
    return response.data;
};

export const getHistoryDetail = async (id: string): Promise<HistorySceneData> => {
    const response = await api.get(`/history/${id}`);
    return response.data;
};

// Demo Helper: Trigger archive manually
export const archiveSeason = async (year: number, season: string): Promise<void> => {
    await api.post('/history/archive', { year, season });
};
