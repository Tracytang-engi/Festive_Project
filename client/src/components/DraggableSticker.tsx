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

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
        dragRef.current = { moved: false };
    }, []);

    const updatePos = useCallback((clientX: number, clientY: number) => {
        const container = wrapperRef.current?.parentElement;
        const rect = container?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
            const left = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
            const top = Math.min(95, Math.max(5, ((clientY - rect.top) / rect.height) * 100));
            positionRef.current = { left, top };
            setPos({ left, top });
        }
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;
        dragRef.current.moved = true;
        updatePos(e.clientX, e.clientY);
    }, [dragging, updatePos]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!dragging || !e.touches.length) return;
        e.preventDefault();
        dragRef.current.moved = true;
        updatePos(e.touches[0].clientX, e.touches[0].clientY);
    }, [dragging, updatePos]);

    const handleMouseUp = useCallback(() => {
        const wasClick = !dragRef.current.moved;
        setDragging(false);
        if (wasClick) {
            onShowDetail();
        } else if (onPositionChange) {
            onPositionChange(positionRef.current.left, positionRef.current.top);
        }
    }, [onShowDetail, onPositionChange]);

    const handleTouchEnd = useCallback((e?: TouchEvent) => {
        if (e) e.preventDefault();
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
        const touchOpts: AddEventListenerOptions = { passive: false };
        const onTouchMove = (e: Event) => handleTouchMove(e as TouchEvent);
        const onTouchEnd = (e: Event) => handleTouchEnd(e as TouchEvent);
        const onTouchCancel = (e: Event) => handleTouchEnd(e as TouchEvent);
        window.addEventListener('touchmove', onTouchMove, touchOpts);
        window.addEventListener('touchend', onTouchEnd, touchOpts);
        window.addEventListener('touchcancel', onTouchCancel, touchOpts);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', onTouchMove, touchOpts);
            window.removeEventListener('touchend', onTouchEnd, touchOpts);
            window.removeEventListener('touchcancel', onTouchCancel, touchOpts);
        };
    }, [dragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    return (
        <div
            ref={wrapperRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
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
