export interface User {
    _id: string;
    userId?: string;
    nickname: string;
    /** 头像 emoji */
    avatar?: string;
    region?: string;
    gender?: string;
    age?: number;
    selectedScene?: string;
    themePreference?: 'christmas' | 'spring';
    backgroundImage?: string;
    /** 按场景的自定义背景：{ [sceneId]: '/uploads/xxx.jpg' } */
    customBackgrounds?: Record<string, string>;
    nicknameChangeCount?: number;
    passwordChangeCount?: number;
    /** 场景贴纸布置：{ christmas: { [messageId]: { left, top } }, spring: { ... } } */
    sceneLayout?: Record<string, Record<string, { left: number; top: number }>>;
    role?: 'user' | 'moderator';
}

export interface Message {
    _id: string;
    sender: User | string;
    recipient: User | string;
    stickerType: string;
    content: string;
    season: 'christmas' | 'spring';
    year: number;
    /** 抵达场景，用于一级分类 */
    sceneId?: string;
    /** 私密消息：贴纸所有人可见，内容仅发送方和接收方可见 */
    isPrivate?: boolean;
    createdAt?: string;
}

export interface Friend {
    _id: string;
    requester: User | string;
    recipient: User | string;
    status: 'pending' | 'accepted' | 'rejected';
}
