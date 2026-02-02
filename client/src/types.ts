export interface User {
    _id: string;
    userId?: string;
    nickname: string;
    region?: string;
    gender?: string;
    age?: number;
    selectedScene?: string;
    themePreference?: 'christmas' | 'spring';
    backgroundImage?: string;
}

export interface Message {
    _id: string;
    sender: User | string; // Populated or ID
    recipient: User | string;
    stickerType: string;
    content: string;
    season: 'christmas' | 'spring';
    year: number;
    createdAt?: string;
}

export interface Friend {
    _id: string;
    requester: User | string;
    recipient: User | string;
    status: 'pending' | 'accepted' | 'rejected';
}
