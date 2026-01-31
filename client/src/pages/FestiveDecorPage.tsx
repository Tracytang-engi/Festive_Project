import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../api/messages';
import { getSceneName } from '../constants/scenes';
import christmasBg from '../assets/christmas-bg.jpg';
import springBg from '../assets/spring-bg.jpg';
import springFireworksBg from '../assets/spring-fireworks-bg.png';
import springReunionBg from '../assets/spring-reunion-bg.png';
import springTempleFairBg from '../assets/spring-temple-fair-bg.png';
import ChineseHorseSticker from '../components/ChineseHorseSticker';
import SantaSticker from '../components/SantaSticker';
import type { Message } from '../types';

const FestiveDecorPage: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // Spring: scene-specific backgrounds (1. Setting off fireworks 2. Family Reunion Dinner 3. Temple Fair)
    const springSceneBg =
        user?.selectedScene === 'spring_fireworks' ? springFireworksBg
            : user?.selectedScene === 'spring_reunion' ? springReunionBg
                : user?.selectedScene === 'spring_temple_fair' ? springTempleFairBg
                    : springBg;
    const backgroundImage = theme === 'christmas' ? christmasBg : springSceneBg;
    const sceneTitle = getSceneName(user?.selectedScene);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await getMessages(theme);
                setMessages(data.messages);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [theme]);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                }}
            >
                {/* Scene tab: Horse for Spring, Santa for Christmas (same workflow as Christmas) */}
                {theme === 'spring' && <ChineseHorseSticker />}
                {theme === 'christmas' && <SantaSticker />}

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {sceneTitle}
                </h1>
                <p style={{ fontSize: '1.1rem', maxWidth: '600px', textAlign: 'center' }}>
                    This is your selected holiday scene. Check the stickers that others gave you below.
                </p>

                {/* Stickers from others (like Christmas mailbox flow) */}
                <div style={{
                    marginTop: '24px',
                    padding: '16px 24px',
                    background: 'rgba(0,0,0,0.35)',
                    borderRadius: '12px',
                    maxWidth: '560px',
                    minHeight: '80px',
                }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Stickers from others</h3>
                    {loading ? (
                        <p style={{ margin: 0 }}>Loading…</p>
                    ) : messages.length === 0 ? (
                        <p style={{ margin: 0 }}>No stickers yet. Share your scene with friends!</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {messages.map(msg => (
                                <div
                                    key={msg._id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.15)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <span style={{ fontSize: '28px' }}>{msg.stickerType}</span>
                                    <span style={{ fontSize: '12px', marginTop: '4px' }}>
                                        From: {typeof msg.sender === 'object' ? msg.sender?.nickname : 'Friend'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FestiveDecorPage;


