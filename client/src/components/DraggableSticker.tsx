import React, { useState, useCallback } from 'react';
import StickerIcon from './StickerIcon';
import type { Message } from '../types';

interface DraggableStickerProps {
    message: Message;
    initialLeft: number;
    initialTop: number;
    onShowDetail: () => void;
    onPositionChange?: (left: number, top: number) => void;
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({
    message,
    initialLeft,
    initialTop,
    onShowDetail,
    onPositionChange,
}) => {
    const [pos, setPos] = useState({ left: initialLeft, top: initialTop });
    const [dragging, setDragging] = useState(false);
    const dragRef = React.useRef({ moved: false });
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const positionRef = React.useRef({ left: initialLeft, top: initialTop });

    React.useEffect(() => {
        const next = { left: initialLeft, top: initialTop };
        positionRef.current = next;
        setPos(next);
    }, [initialLeft, initialTop]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setDragging(true);
        dragRef.current = { moved: false };
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;
        dragRef.current.moved = true;
        const container = wrapperRef.current?.parentElement;
        const rect = container?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
            const left = Math.min(95, Math.max(5, ((e.clientX - rect.left) / rect.width) * 100));
            const top = Math.min(95, Math.max(5, ((e.clientY - rect.top) / rect.height) * 100));
            positionRef.current = { left, top };
            setPos({ left, top });
        }
    }, [dragging]);

    const handleMouseUp = useCallback(() => {
        const wasClick = !dragRef.current.moved;
        setDragging(false);
        if (wasClick) {
            onShowDetail();
        } else if (onPositionChange) {
            onPositionChange(positionRef.current.left, positionRef.current.top);
        }
    }, [onShowDetail, onPositionChange]);

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
            ref={wrapperRef}
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
            <StickerIcon stickerType={message.stickerType} size={144} />
        </div>
    );
};

export default DraggableSticker;
