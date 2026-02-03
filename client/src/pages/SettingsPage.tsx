import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Sidebar from '../components/Layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';

const NICKNAME_CHANGE_LIMIT = 3;
const PASSWORD_CHANGE_LIMIT = 1;

const SettingsPage: React.FC = () => {
    const { user, checkAuth } = useAuth();
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

    // 个人主页：昵称
    const nicknameRemain = NICKNAME_CHANGE_LIMIT - (user?.nicknameChangeCount ?? 0);
    const [nicknameInput, setNicknameInput] = useState('');
    const [nicknameLoading, setNicknameLoading] = useState(false);
    const [nicknameError, setNicknameError] = useState<string | null>(null);
    const [nicknameSuccess, setNicknameSuccess] = useState(false);

    // 个人主页：密码
    const passwordRemain = PASSWORD_CHANGE_LIMIT - (user?.passwordChangeCount ?? 0);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

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

    const handleNicknameSubmit = async () => {
        const trimmed = nicknameInput.trim();
        if (!trimmed) {
            setNicknameError('请输入新昵称');
            return;
        }
        setNicknameLoading(true);
        setNicknameError(null);
        setNicknameSuccess(false);
        try {
            await api.put('/users/profile/nickname', { nickname: trimmed });
            setNicknameSuccess(true);
            setNicknameInput('');
            await checkAuth();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || '修改失败';
            setNicknameError(msg);
        } finally {
            setNicknameLoading(false);
        }
    };

    const handlePasswordSubmit = async () => {
        if (!currentPassword || !newPassword.trim()) {
            setPasswordError('请填写当前密码和新密码');
            return;
        }
        if (newPassword.trim().length !== 6) {
            setPasswordError('新密码须为 6 位');
            return;
        }
        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);
        try {
            await api.put('/users/profile/password', {
                currentPassword,
                newPassword: newPassword.trim()
            });
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            await checkAuth();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || '修改失败';
            setPasswordError(msg);
        } finally {
            setPasswordLoading(false);
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

                {/* 个人主页 */}
                <div className="ios-card" style={{
                    maxWidth: '500px',
                    padding: '24px',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#333',
                    marginBottom: '24px'
                }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>
                        个人主页
                    </h2>

                    {/* 修改昵称 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                            修改昵称
                        </label>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>
                            当前昵称：{user?.nickname ?? '-'} · 剩余修改次数：{Math.max(0, nicknameRemain)}/{NICKNAME_CHANGE_LIMIT}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="输入新昵称"
                                disabled={nicknameRemain <= 0}
                                style={{
                                    flex: '1',
                                    minWidth: '140px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(60,60,67,0.2)',
                                    fontSize: '15px'
                                }}
                            />
                            <button
                                className="ios-btn tap-scale"
                                onClick={handleNicknameSubmit}
                                disabled={nicknameRemain <= 0 || nicknameLoading || !nicknameInput.trim()}
                                style={{
                                    padding: '10px 18px',
                                    background: (nicknameRemain <= 0 || nicknameLoading || !nicknameInput.trim()) ? '#ccc' : themeConfig[theme].primary,
                                    color: theme === 'spring' ? '#c0392b' : 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: (nicknameRemain <= 0 || nicknameLoading) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {nicknameLoading ? '提交中...' : '保存'}
                            </button>
                        </div>
                        {nicknameError && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(255,59,48,0.15)', borderColor: 'rgba(255,59,48,0.3)', color: '#c0392b' }}>
                                {nicknameError}
                            </div>
                        )}
                        {nicknameSuccess && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(52,199,89,0.15)', borderColor: 'rgba(52,199,89,0.3)', color: '#27ae60' }}>
                                昵称已更新
                            </div>
                        )}
                    </div>

                    {/* 修改密码 */}
                    <div>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                            修改密码
                        </label>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>
                            剩余修改次数：{Math.max(0, passwordRemain)}/{PASSWORD_CHANGE_LIMIT}（每人限 1 次）
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="当前密码"
                                disabled={passwordRemain <= 0}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(60,60,67,0.2)',
                                    fontSize: '15px'
                                }}
                            />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="新密码（6 位）"
                                disabled={passwordRemain <= 0}
                                maxLength={6}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(60,60,67,0.2)',
                                    fontSize: '15px'
                                }}
                            />
                            <button
                                className="ios-btn tap-scale"
                                onClick={handlePasswordSubmit}
                                disabled={passwordRemain <= 0 || passwordLoading || !currentPassword || newPassword.trim().length !== 6}
                                style={{
                                    padding: '12px',
                                    background: (passwordRemain <= 0 || passwordLoading || !currentPassword || newPassword.trim().length !== 6) ? '#ccc' : themeConfig[theme].primary,
                                    color: theme === 'spring' ? '#c0392b' : 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: (passwordRemain <= 0 || passwordLoading) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {passwordLoading ? '提交中...' : '保存新密码'}
                            </button>
                        </div>
                        {passwordError && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(255,59,48,0.15)', borderColor: 'rgba(255,59,48,0.3)', color: '#c0392b' }}>
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(52,199,89,0.15)', borderColor: 'rgba(52,199,89,0.3)', color: '#27ae60' }}>
                                密码已更新
                            </div>
                        )}
                    </div>
                </div>

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
