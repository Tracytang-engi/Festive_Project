import React, { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Layout/Sidebar';

const DiscoverPage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = async () => {
        const res = await api.get(`/users/search?nickname=${query}`);
        setResults(res.data);
    };

    const sendRequest = async (targetId: string) => {
        try {
            await api.post('/friends/request', { targetUserId: targetId });
            alert("Request sent!");
        } catch (err) {
            alert("Failed to send request (or already sent)");
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ flex: 1, padding: '40px' }}>
                <h1>Discover Friends</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search nickname..."
                        style={{ padding: '10px', width: '300px' }}
                    />
                    <button onClick={handleSearch} style={{ padding: '10px 20px' }}>Search</button>
                </div>

                <div style={{ marginTop: '20px' }}>
                    {results.map(u => (
                        <div key={u._id} style={{
                            padding: '15px',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <strong>{u.nickname}</strong> ({u.region})
                            </div>
                            <button onClick={() => sendRequest(u._id)}>Add Friend</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiscoverPage;
