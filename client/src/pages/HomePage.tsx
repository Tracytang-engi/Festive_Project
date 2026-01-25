import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Layout/Sidebar';
import api from '../api/client';
import type { Message } from '../types';
import christmasBg from '../assets/christmas-bg.jpg';
import springBg from '../assets/spring-bg.jpg';

import SantaSticker from '../components/SantaSticker';

// Simple Sticker Component
// Sticker component moved to FestiveDecorPage

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
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />

            <div style={{
                flex: 1,
                position: 'relative',
                backgroundImage: `url(${theme === 'christmas' ? christmasBg : springBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <button
                    onClick={() => navigate('/settings')}
                    style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', zIndex: 100 }}
                    title="Settings"
                >
                    ⚙️
                </button>
                {/* Scene Content */}
                <h1 style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>
                    {theme === 'christmas' ? 'Christmas Wonderland' : 'Spring Festival Celebration'}
                </h1>

                {theme === 'christmas' && <SantaSticker />}

                {/* Messages Scattering moved to FestiveDecorPage */}

                {/* Ad Popup */}
                {showAd && ad && (
                    <div style={{
                        position: 'absolute', bottom: '20px', right: '20px',
                        width: '300px', padding: '10px', background: 'white',
                        borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                    }}>
                        <button onClick={() => setShowAd(false)} style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                        <img src={ad.imageUrl} alt="Ad" style={{ width: '100%', borderRadius: '4px' }} />
                        <p style={{ textAlign: 'center', margin: '5px 0' }}>{ad.linkUrl ? <a href={ad.linkUrl}>Learn More</a> : "Sponsored"}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
