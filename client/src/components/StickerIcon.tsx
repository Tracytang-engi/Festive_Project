import React from 'react';
import { getStickerImageUrl } from '../constants/stickers';

interface StickerIconProps {
    stickerType: string;
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}

/** Renders sticker as image if we have one, otherwise as emoji. */
const StickerIcon: React.FC<StickerIconProps> = ({ stickerType, size = 64, style, className }) => {
    const url = getStickerImageUrl(stickerType);
    if (url) {
        return (
            <img
                src={url}
                alt=""
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
    return (
        <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
            {stickerType}
        </span>
    );
};

export default StickerIcon;
