/**
 * 春节贴纸：一级菜单为五分类（年夜饭/贴对联/逛庙会/放烟花/马年），
 * 对应文件夹 eve_dinner / couplets / temple_fair / fireworks / horse，
 * 每类下为多张图片，stickerType 格式为 category_N（如 couplets_1、horse_3）。
 * 圣诞保持原有 emoji 贴纸逻辑。
 */
const P = '/sticker_processed';

/** 春节贴纸五分类：id 对应 public/sticker_processed 下文件夹名 */
export const SPRING_STICKER_CATEGORIES: { id: string; name: string }[] = [
    { id: 'eve_dinner', name: '年夜饭' },
    { id: 'couplets', name: '贴对联' },
    { id: 'temple_fair', name: '逛庙会' },
    { id: 'fireworks', name: '放烟花' },
    { id: 'horse', name: '马年' },
];

/** 春节分类在列表中的图标（一级菜单/侧栏用） */
export const SPRING_CATEGORY_ICONS: Record<string, string> = {
    eve_dinner: '🥟',
    couplets: '🧧',
    temple_fair: '🏮',
    fireworks: '🎇',
    horse: '🐴',
};

/** 每个分类下的贴纸数量（与 sticker_processed 下各文件夹内文件数一致） */
const SPRING_CATEGORY_COUNTS: Record<string, number> = {
    eve_dinner: 8,
    couplets: 9,
    temple_fair: 7,
    fireworks: 4,
    horse: 5,
};

/** 生成 STICKER_IMAGE_URL：所有春节贴纸 type → 图片路径 */
function buildSpringStickerImageUrls(): Record<string, string> {
    const urls: Record<string, string> = {};
    for (const { id } of SPRING_STICKER_CATEGORIES) {
        const n = SPRING_CATEGORY_COUNTS[id] ?? 0;
        for (let i = 1; i <= n; i++) {
            urls[`${id}_${i}`] = `${P}/${id}/${id}_${i}.png`;
        }
    }
    return urls;
}

export const STICKER_IMAGE_URL: Record<string, string> = buildSpringStickerImageUrls();

export function getStickerImageUrl(stickerType: string): string | null {
    return STICKER_IMAGE_URL[stickerType] ?? null;
}

export function hasStickerImage(stickerType: string): boolean {
    return stickerType in STICKER_IMAGE_URL;
}

/** 根据 stickerType 得到所属分类 id（如 eve_dinner_3 → eve_dinner） */
export function getStickerCategory(stickerType: string): string | null {
    for (const { id } of SPRING_STICKER_CATEGORIES) {
        if (stickerType === id || stickerType.startsWith(id + '_')) return id;
    }
    return null;
}

/** 获取某分类下的所有贴纸 type */
export function getStickersByCategory(categoryId: string): string[] {
    const n = SPRING_CATEGORY_COUNTS[categoryId] ?? 0;
    const list: string[] = [];
    for (let i = 1; i <= n; i++) list.push(`${categoryId}_${i}`);
    return list;
}

// ——— 圣诞贴纸（按场景，兼容旧逻辑） ———
const CHRISTMAS_STICKERS = ['🎄', '🎅', '❄️', '🎁', '⛄'];
export const STICKERS_BY_CHRISTMAS_SCENE: Record<string, string[]> = {
    xmas_1: CHRISTMAS_STICKERS,
    xmas_2: CHRISTMAS_STICKERS,
    xmas_3: CHRISTMAS_STICKERS,
};

/** 圣诞：按 sceneId 取贴纸；春节：不按场景，仅用 getStickersByCategory 按分类取，此处返回空避免误用 */
export function getStickersForScene(season: 'christmas' | 'spring', sceneId?: string): string[] {
    if (season === 'christmas') {
        if (sceneId && STICKERS_BY_CHRISTMAS_SCENE[sceneId]) return STICKERS_BY_CHRISTMAS_SCENE[sceneId];
        return CHRISTMAS_STICKERS;
    }
    return [];
}
