import React, { useState, useCallback } from 'react';
import StickerIcon from './StickerIcon';
import type { Message } from '../types';

interface DraggableStickerProps {
    message: Message;
    initialLeft: number;
    initialTop: number;
    onShowDetail: () => void;
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({
    message,
    initialLeft,
    initialTop,
    onShowDetail,
}) => {
    const [pos, setPos] = useState({ left: initialLeft, top: initialTop });
    const [dragging, setDragging] = useState(false);
    const dragRef = React.useRef({ x: 0, y: 0, left: 0, top: 0, moved: false });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setDragging(true);
        dragRef.current = { x: e.clientX, y: e.clientY, left: pos.left, top: pos.top, moved: false };
    }, [pos]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;
        dragRef.current.moved = true;
        const dx = (e.clientX - dragRef.current.x) / window.innerWidth * 100;
        const dy = (e.clientY - dragRef.current.y) / window.innerHeight * 100;
        setPos({
            left: Math.max(0, Math.min(90, dragRef.current.left + dx)),
            top: Math.max(0, Math.min(85, dragRef.current.top + dy)),
        });
    }, [dragging]);

    const handleMouseUp = useCallback(() => {
        const wasClick = !dragRef.current.moved;
        setDragging(false);
        if (wasClick) onShowDetail();
    }, [onShowDetail]);

    React.useEffect(() => {
        if (!dragging) return;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                cursor: dragging ? 'grabbing' : 'grab',
                zIndex: 100,
                userSelect: 'none',
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                transition: dragging ? 'none' : 'transform 0.2s ease',
            }}
            className="sticker-hover"
            title="Drag to move, click to view"
        >
            <StickerIcon stickerType={message.stickerType} size={96} />
        </div>
    );
};

export default DraggableSticker;
