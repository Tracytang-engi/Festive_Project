import springFuDoor from '../assets/spring_carrier_03_fu_door.png';
import bgFireplace from '../assets/bg-fireplace.jpg';
import bgSnowyVillage from '../assets/bg-snowy-village.jpg';
import bgWorkshop from '../assets/bg-workshop.jpg';

/** Public path for backgrounds in client/public/background. Resolve at call time so origin is correct. */
function publicBgPath(path: string): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/background/${path}`;
    }
    return `/background/${path}`;
}

/** Scene id → display name (Christmas and Spring). Spring names are 中英双语. */
export const SCENE_NAMES: Record<string, string> = {
    xmas_1: 'Cozy Fireplace',
    xmas_2: 'Snowy Village',
    xmas_3: 'Santa Workshop',
    spring_dinner: '年夜饭 (Eve Dinner)',
    spring_temple_fair: '庙会 (Temple Fair)',
    spring_couplets: '贴对联 (Couplets)',
    spring_firecrackers: '放鞭炮 (Firecrackers)',
};

export function getSceneName(sceneId: string | undefined): string {
    if (!sceneId) return 'Your Festive Scene';
    return SCENE_NAMES[sceneId] ?? 'Your Festive Scene';
}

/** Spring scene ids for selection page. */
export const SPRING_SCENE_IDS: readonly string[] = ['spring_dinner', 'spring_temple_fair', 'spring_couplets', 'spring_firecrackers'] as const;

/** Christmas scene ids (for grouping). */
export const CHRISTMAS_SCENE_IDS: readonly string[] = ['xmas_1', 'xmas_2', 'xmas_3'] as const;

/** Christmas scene id → background (asset import). */
const CHRISTMAS_SCENE_BG: Record<string, string> = {
    xmas_1: bgFireplace,
    xmas_2: bgSnowyVillage,
    xmas_3: bgWorkshop,
};

const DEFAULT_CHRISTMAS_SCENE = 'xmas_1';

export function getChristmasSceneBackgroundImage(sceneId: string | undefined): string {
    const key = sceneId && CHRISTMAS_SCENE_BG[sceneId] !== undefined ? sceneId : DEFAULT_CHRISTMAS_SCENE;
    return CHRISTMAS_SCENE_BG[key] ?? bgFireplace;
}

/** First-level category icon per scene (典型图标). */
export const SCENE_ICONS: Record<string, string> = {
    spring_dinner: '🥟',
    spring_temple_fair: '🏮',
    spring_couplets: '🧧',
    spring_firecrackers: '🎇',
    xmas_1: '🎄',
    xmas_2: '❄️',
    xmas_3: '🎅',
};

/** Default Spring scene when none selected. */
export const DEFAULT_SPRING_SCENE = 'spring_dinner';

/** 春节主页面（选择场景之前）使用的背景图：2026 马年 */
export const SPRING_MAIN_PAGE_BG = 'spring_main_2026.png';
export function getSpringMainPageBackgroundImage(): string {
    return publicBgPath(SPRING_MAIN_PAGE_BG);
}

/** Spring scene id → background (file path for public; Vite import for assets). */
const SPRING_SCENE_BG_KEYS: Record<string, string> = {
    spring_dinner: 'eve_dinner.png',
    spring_temple_fair: 'temple.png',
    spring_couplets: '', // uses asset import
    spring_firecrackers: 'firecracker.jpg',
};

export function getSpringSceneBackgroundImage(sceneId: string | undefined): string {
    const key = sceneId && SPRING_SCENE_BG_KEYS[sceneId] !== undefined ? sceneId : DEFAULT_SPRING_SCENE;
    const pathOrEmpty = SPRING_SCENE_BG_KEYS[key];
    if (key === 'spring_couplets' || !pathOrEmpty) return springFuDoor;
    return publicBgPath(pathOrEmpty);
}

/** Spring home page (春节首页) background — 2026 Year of the Horse. Separate from scene backgrounds. */
export function getSpringHomePageBackgroundImage(): string {
    return publicBgPath('year_of_horse_2026.png');
}
