import api from './client';

export const saveSceneLayout = async (
    season: 'christmas' | 'spring',
    positions: Record<string, { left: number; top: number }>
): Promise<void> => {
    await api.put('/users/scene-layout', { season, positions });
};
