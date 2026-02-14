import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { APP_ORIGIN } from '../constants/config';
import TipModal from './TipModal';
import type { User } from '../types';

interface ShareCardButtonProps {
    user: Pick<User, '_id' | 'nickname' | 'avatar'>;
}

const ShareCardButton: React.FC<ShareCardButtonProps> = ({ user }) => {
    const [tip, setTip] = useState<{ show: boolean; message: string; isSuccess: boolean }>({
        show: false,
        message: '',
        isSuccess: false,
    });

    const handleShare = async () => {
        const shareUrl = `${APP_ORIGIN.replace(/\/+$/, '')}/friend/${user._id}/decor?from=share&nickname=${encodeURIComponent(user.nickname)}`;
        const shareTitle = `${user.nickname} 的春节祝福名片`;
        const shareText = `我是${user.nickname}。请来www.festickers.com找我玩，并且给我留下祝福的贴纸吧！`;

        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                setTip({ show: true, message: '分享成功', isSuccess: true });
            } else {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                setTip({ show: true, message: '链接已复制到剪贴板', isSuccess: true });
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                setTip({ show: true, message: '链接已复制到剪贴板', isSuccess: true });
            } catch {
                setTip({ show: true, message: '分享失败，请手动复制链接', isSuccess: false });
            }
        }
    };

    return (
        <>
            <button
                type="button"
                className="tap-scale"
                onClick={handleShare}
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
