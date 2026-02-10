import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import { getReports, resolveReport, dismissReport, type ReportItem } from '../api/admin';

const ModeratorPage: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getReports();
            setReports(data);
        } catch (err: any) {
            const msg = err.response?.status === 403
                ? '需要审核员权限'
                : (err.response?.data?.message || err.message || '加载失败');
            setError(msg);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleResolve = async (reportId: string, deleteMessage?: boolean) => {
        setActingId(reportId);
        try {
            await resolveReport(reportId, deleteMessage);
            setReports(prev => prev.filter(r => r._id !== reportId));
        } catch {
            alert('操作失败');
        } finally {
            setActingId(null);
        }
    };

    const handleDismiss = async (reportId: string) => {
        setActingId(reportId);
        try {
            await dismissReport(reportId);
            setReports(prev => prev.filter(r => r._id !== reportId));
        } catch {
            alert('操作失败');
        } finally {
            setActingId(null);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <Sidebar />
            <div style={{ flex: 1, padding: '24px', background: '#f2f2f7', overflowY: 'auto' }}>
                <h1 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 600 }}>举报审核 (Reports)</h1>

                {loading && <p>加载中... (Loading...)</p>}
                {error && (
                    <div style={{ padding: '16px', background: '#ffebee', borderRadius: '12px', color: '#c62828', marginBottom: '16px' }}>
                        {error}
                        {error.includes('权限') && (
                            <button
                                onClick={() => navigate('/')}
                                style={{ marginLeft: '12px', padding: '6px 12px', cursor: 'pointer' }}
                            >
                                返回首页 (Back)
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && reports.length === 0 && (
                    <p style={{ color: '#666' }}>暂无待审核举报 (No pending reports)</p>
                )}

                {!loading && reports.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {reports.map(r => (
                            <div
                                key={r._id}
                                style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                }}
                            >
                                <div style={{ marginBottom: '12px', fontSize: '13px', color: '#8e8e93' }}>
                                    举报 ID: {r._id} · 举报人: {r.reporter?.nickname ?? '-'} · {new Date(r.createdAt).toLocaleString()}
                                </div>
                                {r.reason && (
                                    <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                                        <strong>举报原因:</strong> {r.reason}
                                    </div>
                                )}
                                {r.message && (
                                    <div style={{
                                        background: '#f9f9f9',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                    }}>
                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                                            消息 ID: {r.message._id} · 贴纸: {r.message.stickerType} · 私密: {r.message.isPrivate ? '是' : '否'}
                                        </div>
                                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                                            发送者: {r.message.sender?.nickname ?? '-'} · 接收者: {r.message.recipient?.nickname ?? '-'}
                                        </div>
                                        <div style={{ fontSize: '15px', marginTop: '8px' }}>{r.message.content}</div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleResolve(r._id)}
                                        disabled={!!actingId}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#34C759',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: actingId ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                        }}
                                    >
                                        通过 (Approve)
                                    </button>
                                    <button
                                        onClick={() => handleResolve(r._id, true)}
                                        disabled={!!actingId}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#FF3B30',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: actingId ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                        }}
                                    >
                                        通过并删除消息 (Approve & delete)
                                    </button>
                                    <button
                                        onClick={() => handleDismiss(r._id)}
                                        disabled={!!actingId}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#f2f2f7',
                                            color: '#333',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: actingId ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                        }}
                                    >
                                        驳回 (Dismiss)
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModeratorPage;
