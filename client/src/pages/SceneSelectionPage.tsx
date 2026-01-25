import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const SceneSelector: React.FC = () => {
    const { updateUserScene } = useAuth();
    const { theme: currentTheme } = useTheme();
    const navigate = useNavigate();

    const scenes = [
        { id: 'xmas_1', name: 'Cozy Fireplace', theme: 'christmas' },
        { id: 'xmas_2', name: 'Snowy Village', theme: 'christmas' },
        { id: 'xmas_3', name: 'Santa Workshop', theme: 'christmas' },
        { id: 'spring_1', name: 'Lantern Street', theme: 'spring' },
        { id: 'spring_2', name: 'Fireworks Harbor', theme: 'spring' },
        { id: 'spring_3', name: 'Dragon Dance', theme: 'spring' },
    ];

    const filteredScenes = scenes.filter(scene => scene.theme === currentTheme);

    const handleSelect = async (sceneId: string, theme: string) => {
        try {
            await updateUserScene(sceneId, theme);
            navigate('/festive-decor');
        } catch (err) {
            console.error("Failed to update scene", err);
            alert("Failed to save selection. Please try again.");
        }
    };

    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Choose Your Festive Scene</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '40px' }}>
                {filteredScenes.map(scene => (
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
    );
};

export default SceneSelector;
