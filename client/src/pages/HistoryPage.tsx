import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import { getHistoryList, getHistoryDetail, archiveSeason } from '../api/history';
import type { HistoryItem, HistorySceneData } from '../api/history';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';
import StickerIcon from '../components/StickerIcon';
import TipModal from '../components/TipModal';
import ConfirmModal from '../components/ConfirmModal';

const HistoryPage: React.FC = () => {
    const { theme } = useTheme();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedScene, setSelectedScene] = useState<HistorySceneData | null>(null);
    const [loading, setLoading] = useState(false);
    const [tip, setTip] = useState<{ show: boolean; message: string; isSuccess?: boolean }>({ show: false, message: '' });
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await getHistoryList();
            setHistory(data);
        } catch {
            console.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id: string) => {
        try {
            const data = await getHistoryDetail(id);
            setSelectedScene(data);
        } catch {
            setTip({ show: true, message: '加载详情失败，请稍后再试 Failed to load details.' });
        }
    };

    const handleArchiveClick = () => setShowArchiveConfirm(true);

    const handleArchiveConfirm = async () => {
        setShowArchiveConfirm(false);
        const year = new Date().getFullYear();
        try {
            await archiveSeason(year, theme);
            setTip({ show: true, message: '已归档，请查看列表 Archived! Check the list.', isSuccess: true });
            loadHistory();
        } catch {
            setTip({ show: true, message: '归档失败（可能为空或服务器错误） Archive failed.' });
        }
    };

    const mainBg = themeConfig[theme].mainBg;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            {theme === 'christmas' ? (
                <Snowfall intensity="light" />
            ) : (
                <SpringFestivalEffects showSnow={true} intensity="light" />
            )}
            <div style={{
                flex: 1,
                minWidth: 0,
                padding: 'var(--page-padding-y) var(--page-padding-x)',
                overflowY: 'auto',
                background: mainBg,
                color: 'white',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px'
                }}>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                        🕰️ Memory Lane
                    </h1>
                    <button
                        className="ios-btn ios-btn-pill tap-scale"
                        onClick={handleArchiveClick}
                        style={{ background: '#FF9500', color: 'white', padding: '12px 24px' }}
                    >
                        归档本季 Archive Current Season
                    </button>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading && (
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.9 }}>Loading memories...</div>
                    )}
                    {!loading && history.length === 0 && (
                        <div className="ios-card" style={{
                            padding: '48px',
                            textAlign: 'center',
                            color: 'var(--ios-gray)',
                            fontSize: '17px'
                        }}>
                            No archives yet. Memories are created when a season ends.
                        </div>
                    )}

                    {history.map(item => (
                        <div
                            key={item._id}
                            className="ios-card tap-scale"
                            onClick={() => handleViewDetail(item._id)}
                            style={{
                                background: 'rgba(255,255,255,0.95)',
                                color: '#333',
                                padding: '20px 24px',
                                borderRadius: '12px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'box-shadow 0.2s ease'
                            }}
                        >
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                {item.season === 'christmas' ? '🎄 Christmas' : '🧧 Spring Festival'} {item.year}
                            </h2>
                            <span style={{ fontSize: '18px', opacity: 0.6 }}>→</span>
                        </div>
                    ))}
                </div>
            </div>

            <TipModal show={tip.show} message={tip.message} isSuccess={tip.isSuccess} onClose={() => setTip(prev => ({ ...prev, show: false }))} />
            <ConfirmModal
                show={showArchiveConfirm}
                message={`将本季（${theme} ${new Date().getFullYear()}）收件箱的贴纸归档到历史？ Archive to History?`}
                confirmLabel="确定归档"
                confirmLabelEn="Archive"
                danger={false}
                onConfirm={handleArchiveConfirm}
                onCancel={() => setShowArchiveConfirm(false)}
            />
            {selectedScene && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setSelectedScene(null)}
                >
                    <div
                        style={{
                            background: 'white',
                            color: '#333',
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            borderRadius: '16px',
                            padding: '24px',
                            overflowY: 'auto',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                                {selectedScene.season} {selectedScene.year} Snapshot
                            </h2>
                            <button
                                className="ios-btn tap-scale"
                                onClick={() => setSelectedScene(null)}
                                style={{ background: '#f2f2f7', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedScene.data.messages.map((msg: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="ios-card"
                                    style={{
                                        padding: '16px',
                                        background: '#f2f2f7',
                                        borderRadius: '10px',
                                        border: 'none'
                                    }}
                                >
                                    <div className="icon-lg" style={{ marginBottom: '8px' }}><StickerIcon stickerType={msg.stickerType} size={64} /></div>
                                    <p style={{ margin: '0 0 8px', fontSize: '15px', lineHeight: 1.5 }}>{msg.content}</p>
                                    <small style={{ color: 'var(--ios-gray)', fontSize: '13px' }}>From: A friend</small>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
