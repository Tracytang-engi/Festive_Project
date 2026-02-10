import React, { useState, useCallback } from 'react';

/** 官方欢迎贴纸：与普通贴纸一致——可拖动、可删除、点开显示简介与功能，不可举报 */
const WELCOME_IMAGE = '/welcome_sticker.png';

const INTRO = '节日祝福装饰墙 (Festive Greeting Wall) — 与亲友互换祝福贴纸，装扮你的节日场景。';
const FEATURES = [
    '发送祝福 (Send stickers) · 选择分类与贴纸，写给好友',
    '布置场景 (Decorate) · 拖拽贴纸位置，保存你的布置',
    '查看好友 (Friends) · 浏览好友的装饰与祝福',
];

export const WELCOME_STICKER_ID = '__welcome__';

interface WelcomeStickerProps {
    initialLeft: number;
    initialTop: number;
    onPositionChange: (left: number, top: number) => void;
    onDelete: () => void;
}

const WelcomeSticker: React.FC<WelcomeStickerProps> = ({
    initialLeft,
    initialTop,
    onPositionChange,
    onDelete,
}) => {
    const [pos, setPos] = useState({ left: initialLeft, top: initialTop });
    const [dragging, setDragging] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const dragRef = React.useRef({ x: 0, y: 0, left: 0, top: 0, moved: false });

    React.useEffect(() => {
        setPos({ left: initialLeft, top: initialTop });
    }, [initialLeft, initialTop]);

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
        if (wasClick) {
            setDetailOpen(true);
        } else {
            onPositionChange(pos.left, pos.top);
        }
    }, [onPositionChange, pos.left, pos.top]);

    React.useEffect(() => {
        if (!dragging) return;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    const handleDelete = () => {
        onDelete();
        setDetailOpen(false);
    };

    return (
        <>
            {/* 贴纸本体：与 DraggableSticker 完全一致——可拖、尺寸 96、阴影 */}
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
                title="拖拽移动，点击查看 (Drag to move, click to view)"
            >
                <img
                    src={WELCOME_IMAGE}
                    alt=""
                    style={{
                        width: 192,
                        height: 192,
                        objectFit: 'contain',
                        display: 'block',
                    }}
                />
            </div>

            {/* 点开后的弹窗：与 StickerDetailModal 一致，有删除、关闭，无举报 */}
            {detailOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                    }}
                    onClick={() => setDetailOpen(false)}
                >
                    <div
                        className="ios-card tap-scale"
                        style={{
                            position: 'relative',
                            background: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            maxWidth: '400px',
                            width: '90%',
                            color: '#333',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 右上角删除按钮：与 StickerDetailModal 一致，红色 */}
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="tap-scale"
                            style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                padding: '8px 14px',
                                borderRadius: 10,
                                border: 'none',
                                background: '#FF3B30',
                                color: 'white',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            删除贴纸 (Delete)
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <img
                                src={WELCOME_IMAGE}
                                alt=""
                                style={{ width: 320, height: 320, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                            />
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.5, fontWeight: 600 }}>
                            {INTRO}
                        </p>
                        <ul style={{ margin: '0 0 16px', paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
                            {FEATURES.map((line, i) => (
                                <li key={i} style={{ marginBottom: 4 }}>{line}</li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className="ios-btn tap-scale"
                            onClick={() => setDetailOpen(false)}
                            style={{
                                width: '100%',
                                padding: 12,
                                background: '#007AFF',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 16,
                            }}
                        >
                            关闭 (Close)
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default WelcomeSticker;
