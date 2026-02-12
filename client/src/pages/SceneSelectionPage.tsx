import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useChristmasMessage } from '../context/ChristmasMessageContext';
import Sidebar from '../components/Layout/Sidebar';
import TipModal from '../components/TipModal';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import { SCENE_NAMES, SPRING_SCENE_IDS } from '../constants/scenes';

const SceneSelector: React.FC = () => {
    const { updateUserScene } = useAuth();
    const { theme: currentTheme } = useTheme();
    const navigate = useNavigate();
    const { showChristmasUnavailable } = useChristmasMessage();
    const [tip, setTip] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    useEffect(() => {
        if (currentTheme === 'christmas') {
            showChristmasUnavailable();
            navigate('/', { replace: true });
        }
    }, [currentTheme, showChristmasUnavailable, navigate]);

    const christmasScenes = [
        { id: 'xmas_1', name: SCENE_NAMES['xmas_1'], theme: 'christmas' as const },
        { id: 'xmas_2', name: SCENE_NAMES['xmas_2'], theme: 'christmas' as const },
        { id: 'xmas_3', name: SCENE_NAMES['xmas_3'], theme: 'christmas' as const },
    ];
    const springScenes = SPRING_SCENE_IDS.map(id => ({ id, name: SCENE_NAMES[id], theme: 'spring' as const }));
    const scenes = currentTheme === 'christmas' ? christmasScenes : springScenes;

    const handleSelect = async (sceneId: string, theme: string) => {
        try {
            await updateUserScene(sceneId, theme);
            navigate('/festive-decor');
        } catch (err) {
            console.error("Failed to update scene", err);
            setTip({ show: true, message: '保存失败，请重试 Failed to save selection. Please try again.' });
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            {currentTheme === 'christmas' ? (
                <Snowfall intensity="light" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="light" />
            )}
            <div style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
                <h1>Choose Your Festive Scene</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '40px' }}>
                {scenes.map(scene => (
                    <div
                        key={scene.id}
                        onClick={() => handleSelect(scene.id, scene.theme)}
                        style={{
                            border: '2px solid #ddd',
                            padding: '40px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            background: scene.theme === 'christmas' ? '#ffebe6' : '#fff3cd'
                        }}
                    >
                        <h3>{scene.name}</h3>
                        <p>{scene.theme.toUpperCase()}</p>
                    </div>
                ))}
            </div>
            </div>
            <TipModal show={tip.show} message={tip.message} onClose={() => setTip(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

export default SceneSelector;
