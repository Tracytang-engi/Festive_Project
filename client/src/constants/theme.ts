/**
 * iOS 风格主题配置 - Christmas & Spring Festival
 */
export const themeConfig = {
    christmas: {
        mainBg: 'linear-gradient(180deg, #0f3460 0%, #1a5276 25%, #c41e3a 55%, #e8b923 100%)',
        primary: '#2f5a28',
        primaryAlt: '#c41e3a',
        accent: '#e8b923',
    },
    spring: {
        mainBg: 'linear-gradient(180deg, #6a1b9a 0%, #8e24aa 30%, #c2185b 65%, #ff6f00 100%)',
        primary: '#f1c40f',
        primaryAlt: '#c2185b',
        accent: '#ff6f00',
    },
} as const;

export type ThemeKey = keyof typeof themeConfig;
