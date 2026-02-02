import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import { getFriends, getFriendRequests, respondToFriendRequest } from '../api/friends';
import type { User } from '../types';

const FriendsPage: React.FC = () => {
    const { theme } = useTheme();
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<any[]>([]); // { _id, requester: User }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [friendsList, requestsList] = await Promise.all([
                getFriends(),
                getFriendRequests()
            ]);
            setFriends(friendsList);
            setRequests(requestsList);
        } catch (err) {
            console.error("Failed to load friends data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
        try {
            await respondToFriendRequest(requestId, action);
            // Refresh data
            loadData();
        } catch (err) {
            alert("Action failed.");
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                padding: '32px 40px',
                background: themeConfig[theme].mainBg,
                color: 'white',
                overflowY: 'auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
                <h1>My Inner Circle 👥</h1>

                {loading && <p>Loading connections...</p>}

                {/* Requests Section */}
                {requests.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <h2>🔔 Friend Requests</h2>
                        <div style={styles.grid}>
                            {requests.map(req => (
                                <div key={req._id} style={styles.card}>
                                    <div>
                                        <strong>{req.requester.nickname}</strong>
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>{req.requester.region}</div>
                                    </div>
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                                        <button className="ios-btn tap-scale" onClick={() => handleRespond(req._id, 'accept')} style={styles.acceptBtn}>Accept</button>
                                        <button className="ios-btn tap-scale" onClick={() => handleRespond(req._id, 'reject')} style={styles.rejectBtn}>Ignore</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Friends List */}
                <div>
                    <h2>My Friends ({friends.length})</h2>
                    <div style={styles.grid}>
                        {friends.length === 0 ? <p>No friends yet. Go to Discover to find some!</p> : (
                            friends.map(friend => (
                                <div key={friend._id} className="tap-scale" style={styles.card}>
                                    <div className="icon-lg" style={{ marginBottom: '10px' }}>👤</div>
                                    <div>
                                        <strong>{friend.nickname}</strong>
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>{friend.region}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
    card: { background: 'rgba(255,255,255,0.95)', color: '#333', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'box-shadow 0.2s ease' },
    acceptBtn: { background: '#34C759', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'opacity 0.2s' },
    rejectBtn: { background: '#FF3B30', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'opacity 0.2s' }
};

export default FriendsPage;
