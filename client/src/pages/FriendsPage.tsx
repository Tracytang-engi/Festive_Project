import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import { useTheme } from '../context/ThemeContext';
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
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                padding: '40px',
                background: theme === 'christmas'
                    ? 'linear-gradient(to bottom, #1a2a6c, #b21f1f, #fdbb2d)'
                    : 'linear-gradient(to bottom, #aa076b, #61045f)',
                color: 'white',
                overflowY: 'auto'
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
                                        <button onClick={() => handleRespond(req._id, 'accept')} style={styles.acceptBtn}>Accept</button>
                                        <button onClick={() => handleRespond(req._id, 'reject')} style={styles.rejectBtn}>Ignore</button>
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
                                <div key={friend._id} style={styles.card}>
                                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>👤</div>
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
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
    card: { background: 'white', color: '#333', padding: '15px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    acceptBtn: { background: '#2f5a28', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
    rejectBtn: { background: '#d42426', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }
};

export default FriendsPage;
