/** Scene id → display name (Christmas and Spring, same workflow as Christmas). */
export const SCENE_NAMES: Record<string, string> = {
    xmas_1: 'Cozy Fireplace',
    xmas_2: 'Snowy Village',
    xmas_3: 'Santa Workshop',
    spring_fireworks: 'Wishing Tree',
    spring_reunion: 'Plum Branch',
    spring_temple_fair: 'Fu Character Door',
};

export function getSceneName(sceneId: string | undefined): string {
    if (!sceneId) return 'Your Festive Scene';
    return SCENE_NAMES[sceneId] ?? 'Your Festive Scene';
}
