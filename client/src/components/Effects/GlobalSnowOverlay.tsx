import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import Snowfall from './Snowfall';
import SpringFestivalEffects from './SpringFestivalEffects';

/**
 * Global snow overlay: fixed over the viewport, on top of all page content (z-index 9998).
 * Renders on every page when theme is spring or christmas. Pointer-events: none so clicks pass through.
 */
const GlobalSnowOverlay: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9998,
        overflow: 'visible',
      }}
    >
      {theme === 'christmas' ? (
        <Snowfall intensity="moderate" />
      ) : (
        <SpringFestivalEffects showSnow intensity="moderate" />
      )}
    </div>
  );
};

export default GlobalSnowOverlay;
