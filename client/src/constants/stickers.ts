/**
 * Sticker emoji/key → processed image path (remove.bg output under public/sticker_processed).
 * Spring Festival uses custom images; Christmas keeps emoji for now.
 */
const P = '/sticker_processed';

export const STICKER_IMAGE_URL: Record<string, string> = {
    '🧧': `${P}/red_packet/97eebfe6cd8b42ac844ab2dab6545bf7.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    '🏮': `${P}/lantern/4ec39237cb5e43e69a3a6fc913480dd2.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    '🐴': `${P}/horse/3975126abb5b44828806a588746036f4.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    '🥟': `${P}/fu/5120453fc28143ae9f16da977593b88a.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    '🎇': `${P}/firecracker/7403d8c86c7a46af88d3a9f77a853157.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'peach': `${P}/peach/1d19e4c24909416a9f2aaa5c153c116b.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'couplets': `${P}/couplets/3660b150d86544589085d9fae8514273.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'paper_cutting': `${P}/paper_cutting/173819cedad14e09abd6cdab7cd61be6.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'clouds': `${P}/clouds/4d832f220b5f42d4b30228402f6d7aa1.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'coin': `${P}/coin/5fe9ee6b3f6049e9b452cd8e73105617.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'chinese_knotting': `${P}/chinese_knotting/b5f7564b435d411d999971541d2daac6.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'painting': `${P}/painting/1aa34e2d12204abb94c5e66cb8d3d6bc.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
    'loong': `${P}/loong/0fa8178342b54141bc0babb12628af25.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png`,
};

export function getStickerImageUrl(stickerType: string): string | null {
    return STICKER_IMAGE_URL[stickerType] ?? null;
}

export function hasStickerImage(stickerType: string): boolean {
    return stickerType in STICKER_IMAGE_URL;
}
