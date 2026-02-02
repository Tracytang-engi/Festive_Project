import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Sidebar from '../components/Layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const serverUrl = 'http://127.0.0.1:3000';
    const initialPreview = user?.backgroundImage ? `${serverUrl}${user.backgroundImage}` : null;
    const [preview, setPreview] = useState<string | null>(initialPreview);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await api.post('/users/background', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setSuccess(true);
                window.location.reload();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const mainBg = themeConfig[theme].mainBg;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', minWidth: '320px', overflowY: 'auto' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                padding: '32px 40px',
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
                        ⚙️ Settings
                    </h1>
                    <button
                        className="ios-btn tap-scale"
                        onClick={() => navigate('/')}
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '10px 16px' }}
                    >
                        Done
                    </button>
                </header>

                <div className="ios-card" style={{
                    maxWidth: '500px',
                    padding: '24px',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#333'
                }}>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                        Custom Background
                    </label>
                    <div
                        style={{
                            border: '2px dashed rgba(60,60,67,0.2)',
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            minHeight: '150px',
                            position: 'relative',
                            cursor: 'pointer',
                            background: preview ? 'transparent' : '#f2f2f7',
                            transition: 'background 0.2s'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        {preview && (
                            <img
                                src={preview}
                                alt="Preview"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '10px',
                                    opacity: 0.5
                                }}
                            />
                        )}
                        <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
                            <span style={{
                                background: 'white',
                                padding: '10px 20px',
                                borderRadius: '20px',
                                fontSize: '15px',
                                fontWeight: 500,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                {file ? file.name : "Choose an image"}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="ios-info-banner" style={{ marginTop: '16px', background: 'rgba(255,59,48,0.15)', borderColor: 'rgba(255,59,48,0.3)', color: '#c0392b' }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="ios-info-banner" style={{ marginTop: '16px', background: 'rgba(52,199,89,0.15)', borderColor: 'rgba(52,199,89,0.3)', color: '#27ae60' }}>
                            Background updated!
                        </div>
                    )}

                    <button
                        className="ios-btn tap-scale"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        style={{
                            width: '100%',
                            marginTop: '20px',
                            padding: '14px',
                            background: (!file || uploading) ? '#ccc' : themeConfig[theme].primary,
                            color: theme === 'spring' ? '#c0392b' : 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: (!file || uploading) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {uploading ? 'Uploading...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
