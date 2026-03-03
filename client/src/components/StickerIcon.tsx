import React from 'react';
import { getStickerImageUrl, isChristmasSticker } from '../constants/stickers';

interface StickerIconProps {
    stickerType: string;
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}

/** 有图则渲染图片；圣诞 emoji 渲染文字；无图的旧春节贴纸（如 loong）不渲染任何内容. */
const StickerIcon: React.FC<StickerIconProps> = ({ stickerType, size = 64, style, className }) => {
    const url = getStickerImageUrl(stickerType);
    if (url) {
        return (
            <img
                src={url}
                alt=""
                draggable={false}
                className={className}
                style={{
                    width: size,
                    height: size,
                    objectFit: 'contain',
                    display: 'block',
                    ...style,
                }}
            />
        );
    }
    if (isChristmasSticker(stickerType)) {
        return (
            <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
                {stickerType}
            </span>
        );
    }
    return null;
};

export default StickerIcon;
