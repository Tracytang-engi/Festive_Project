import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { getHistoryList, getHistoryDetail, archiveSeason } from '../api/history';
import type { HistoryItem, HistorySceneData } from '../api/history';

const HistoryPage: React.FC = () => {
    const { theme } = useTheme();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedScene, setSelectedScene] = useState<HistorySceneData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await getHistoryList();
            setHistory(data);
        } catch (err) {
            console.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id: string) => {
        try {
            const data = await getHistoryDetail(id);
            setSelectedScene(data);
        } catch (err) {
            alert("Failed to load details");
        }
    };

    const handleSimulateArchive = async () => {
        const year = new Date().getFullYear();
        // Archive current season (whatever is in theme, usually)
        // Or just prompt user
        const c = confirm(`Archive all messages for ${theme} ${year}? This will move them from your Inbox to History.`);
        if (c) {
            try {
                await archiveSeason(year, theme);
                alert("Archived! Check the list.");
                loadHistory();
            } catch (err) {
                alert("Archive failed (maybe empty? or server error)");
            }
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' },
        main: {
            flex: 1, padding: '40px', color: 'white', overflowY: 'auto',
            background: 'linear-gradient(to right, #4b6cb7, #182848)' // Time/Spacey theme
        },
        timeline: { marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' },
        card: {
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            padding: '20px', borderRadius: '15px', backdropFilter: 'blur(5px)', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s'
        },
        modal: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        },
        modalContent: {
            background: 'white', color: '#333', width: '90%', maxWidth: '600px', maxHeight: '80vh',
            borderRadius: '10px', padding: '20px', overflowY: 'auto'
        }
    };

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>🕰️ Memory Lane</h1>
                    <button onClick={handleSimulateArchive} style={{ padding: '10px', borderRadius: '5px', border: 'none', background: '#ffa502', cursor: 'pointer' }}>
                        Simulate End-of-Season Archive
                    </button>
                </header>

                <div style={styles.timeline}>
                    {loading && <p>Loading memories...</p>}
                    {!loading && history.length === 0 && (
                        <p style={{ opacity: 0.7 }}>No archives yet. Memories are created when a season ends.</p>
                    )}

                    {history.map(item => (
                        <div key={item._id} style={styles.card} onClick={() => handleViewDetail(item._id)}>
                            <div>
                                <h2 style={{ margin: 0 }}>{item.season === 'christmas' ? '🎄 Christmas' : '🧧 Spring Festival'} {item.year}</h2>
                            </div>
                            <div>➡️</div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedScene && (
                <div style={styles.modal} onClick={() => setSelectedScene(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2>{selectedScene.season} {selectedScene.year} Snapshot</h2>
                            <button onClick={() => setSelectedScene(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {selectedScene.data.messages.map((msg: any, idx: number) => (
                                <div key={idx} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                    <div style={{ fontSize: '24px' }}>{msg.stickerType}</div>
                                    <p>{msg.content}</p>
                                    <small style={{ color: '#666' }}>From: A friend</small>
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
