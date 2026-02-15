import React, { useState } from 'react';
import { Share2, Link2 } from 'lucide-react';
import { APP_ORIGIN } from '../constants/config';
import TipModal from './TipModal';

interface ShareCardButtonProps {
    user: { _id: string; nickname?: string; avatar?: string };
}

const ShareCardButton: React.FC<ShareCardButtonProps> = ({ user }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [tip, setTip] = useState<{ show: boolean; message: string; isSuccess: boolean }>({
        show: false,
        message: '',
        isSuccess: false,
    });

    const nickname = user.nickname ?? '';
    const shareUrl = `${APP_ORIGIN.replace(/\/+$/, '')}/friend/${user._id}/decor?from=share&nickname=${encodeURIComponent(nickname)}`;
    const shareText = `我是${nickname}。请来www.festickers.com找我玩，并且给我留下祝福的贴纸吧！`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            setTip({ show: true, message: '链接和文案已复制到剪贴板', isSuccess: true });
        } catch {
            setTip({ show: true, message: '复制失败，请手动复制', isSuccess: false });
        }
    };

    /* Web Share API / QR code — 已抑制，后续可恢复
    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        }
    };
    */

    return (
        <>
            <button
                type="button"
                className="tap-scale"
                onClick={() => setShowShareModal(true)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '24px',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#333',
                }}
            >
                <Share2 size={18} />
                分享名片 <span className="bilingual-en">Share Card</span>
            </button>

            {showShareModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '24px',
                    }}
                    onClick={() => setShowShareModal(false)}
                >
                    <div
                        className="ios-card tap-scale"
                        style={{
                            maxWidth: '400px',
                            width: '100%',
                            padding: '24px',
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            color: '#333',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>分享名片 <span className="bilingual-en">Share Card</span></h3>
                        <p style={{ margin: '0 0 12px', fontSize: '15px', lineHeight: 1.6, color: '#333' }}>{shareText}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: '#666', wordBreak: 'break-all' }}>
                            <Link2 size={16} style={{ flexShrink: 0 }} />
                            <span>{shareUrl}</span>
                        </div>
                        <button
                            type="button"
                            className="ios-btn tap-scale"
                            onClick={() => { handleCopyLink(); setShowShareModal(false); }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--ios-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '16px',
                                cursor: 'pointer',
                            }}
                        >
                            复制分享链接
                        </button>
                        <button
                            type="button"
                            className="ios-btn tap-scale"
                            onClick={() => setShowShareModal(false)}
                            style={{
                                width: '100%',
                                marginTop: '10px',
                                padding: '10px',
                                background: '#8e8e93',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '15px',
                                cursor: 'pointer',
                            }}
                        >
                            关闭
                        </button>
                    </div>
                </div>
            )}

            <TipModal
                show={tip.show}
                message={tip.message}
                isSuccess={tip.isSuccess}
                onClose={() => setTip(prev => ({ ...prev, show: false }))}
            />
        </>
    );
};

export default ShareCardButton;
