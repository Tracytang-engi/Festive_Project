import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useChristmasMessage } from '../context/ChristmasMessageContext';
import Sidebar from '../components/Layout/Sidebar';
import TipModal from '../components/TipModal';
import { SCENE_NAMES, SPRING_SCENE_IDS, SCENE_ICONS } from '../constants/scenes';
import { themeConfig } from '../constants/theme';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../components/Effects/PageTransition';

const THEME_LABEL: Record<string, string> = {
    christmas: '圣诞 (Christmas)',
    spring: '春节 (Spring)',
};

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
    const mainBg = themeConfig[currentTheme].mainBg;

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
        <div className="layout-with-sidebar" style={{ position: 'relative', display: 'flex', minHeight: '100vh', width: '100%', minWidth: 0, overflowY: 'auto' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                padding: 'var(--page-padding-y, 40px) var(--page-padding-x, 40px)',
                background: mainBg,
                color: 'white',
                overflowY: 'auto',
                overflowX: 'hidden',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                position: 'relative',
                minHeight: 0,
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{
                        margin: '0 0 8px',
                        fontSize: '28px',
                        fontWeight: 700,
                        letterSpacing: '-0.4px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                        选择节日场景 <span className="bilingual-en">(Choose Your Festive Scene)</span>
                    </h1>
                    <p style={{ margin: '0 0 40px', fontSize: '15px', opacity: 0.9 }}>
                        选择一个场景开始装扮 <span className="bilingual-en">(Pick a scene to start decorating)</span>
                    </p>
                    <motion.div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '24px',
                            justifyContent: 'center',
                        }}
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {scenes.map(scene => (
                            <motion.div
                                key={scene.id}
                                variants={staggerItem}
                                className="tap-scale"
                                onClick={() => handleSelect(scene.id, scene.theme)}
                                style={{
                                    padding: '32px 24px',
                                    cursor: 'pointer',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.95)',
                                    color: '#1d1d1f',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                                }}
                                whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span style={{ fontSize: '48px', lineHeight: 1 }}>{SCENE_ICONS[scene.id] ?? '📁'}</span>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1d1d1f', lineHeight: 1.3 }}>
                                    {scene.name}
                                </h3>
                                <span style={{ fontSize: '13px', color: '#8e8e93', fontWeight: 500 }}>
                                    {THEME_LABEL[scene.theme] ?? scene.theme}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
            <TipModal show={tip.show} message={tip.message} onClose={() => setTip(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

export default SceneSelector;
