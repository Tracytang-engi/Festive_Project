import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Layout/Sidebar';
import api from '../api/client';
import type { Message } from '../types';
import christmasBg from '../assets/christmas-bg.jpg';
import springBg from '../assets/spring-bg.jpg';

import SantaSticker from '../components/SantaSticker';
import ChineseHorseSticker from '../components/ChineseHorseSticker';

const HomePage: React.FC = () => {
    const { theme } = useTheme(); // Global theme switcher
    const navigate = useNavigate();
    const [ad, setAd] = useState<any>(null);
    const [showAd, setShowAd] = useState(true);

    useEffect(() => {
        fetchAd();
    }, [theme]);

    // Message fetching removed from Home Page

    const fetchAd = async () => {
        try {
            const res = await api.get('/ads');
            setAd(res.data);
        } catch (err) { }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Sidebar />

            <div className="page-bg-area" style={{
                flex: 1,
                minHeight: '100vh',
                position: 'relative',
                backgroundImage: `url(${theme === 'christmas' ? christmasBg : springBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                overflow: 'hidden'
            }}>
                {/* Scene Content */}
                <h1 style={{ color: 'white', textAlign: 'center', marginTop: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 600 }}>
                    {theme === 'christmas' ? 'Christmas Wonderland' : 'Spring Festival Celebration'}
                </h1>

                {theme === 'christmas' && <SantaSticker />}
                {theme === 'spring' && <ChineseHorseSticker />}

                {/* Ad Popup - 随页面成比例缩放 */}
                {showAd && ad && (
                    <div
                        className="ad-responsive tap-scale"
                        style={{
                            position: 'absolute',
                            bottom: 'var(--ad-gap)',
                            right: 'var(--ad-gap)',
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                            backdropFilter: 'blur(10px)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}
                    >
                        <button className="tap-scale" onClick={() => setShowAd(false)} style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer', fontSize: 'clamp(14px, 1.5vw, 18px)', opacity: 0.6 }}>✕</button>
                        <img src={ad.imageUrl} alt="Ad" />
                        <p style={{ textAlign: 'center' }}>{ad.linkUrl ? <a href={ad.linkUrl}>Learn More</a> : "Sponsored"}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
