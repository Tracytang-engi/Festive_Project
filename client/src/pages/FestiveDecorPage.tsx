import React from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import christmasBg from '../assets/christmas-bg.jpg';
import springBg from '../assets/spring-bg.jpg';

const FestiveDecorPage: React.FC = () => {
    const { theme } = useTheme();

    const backgroundImage = theme === 'christmas' ? christmasBg : springBg;

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
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Your Festive Scene
                </h1>
                <p style={{ fontSize: '1.1rem', maxWidth: '600px', textAlign: 'center' }}>
                    This is a preview area for your selected holiday scene and interactive decorations.
                    Future updates can add animated messages, stickers, and more holiday magic here.
                </p>
            </div>
        </div>
    );
};

export default FestiveDecorPage;


