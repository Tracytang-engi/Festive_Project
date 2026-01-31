/** Scene id → display name (Christmas and Spring, same workflow as Christmas). */
export const SCENE_NAMES: Record<string, string> = {
    xmas_1: 'Cozy Fireplace',
    xmas_2: 'Snowy Village',
    xmas_3: 'Santa Workshop',
    spring_fireworks: 'Setting off Fireworks',
    spring_reunion: 'Family reunion dinner',
    spring_temple_fair: 'Temple Fair',
};

export function getSceneName(sceneId: string | undefined): string {
    if (!sceneId) return 'Your Festive Scene';
    return SCENE_NAMES[sceneId] ?? 'Your Festive Scene';
}
