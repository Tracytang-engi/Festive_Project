import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { SERVER_ORIGIN } from '../api/client';
import Sidebar from '../components/Layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { themeConfig } from '../constants/theme';
import { SPRING_SCENE_IDS, CHRISTMAS_SCENE_IDS, SCENE_ICONS, getSceneName, getSpringSceneBackgroundImage, getChristmasSceneBackgroundImage } from '../constants/scenes';
import { AVATAR_EMOJIS, DEFAULT_AVATAR } from '../constants/avatars';
import Snowfall from '../components/Effects/Snowfall';
import SpringFestivalEffects from '../components/Effects/SpringFestivalEffects';

const NICKNAME_CHANGE_LIMIT = 3;
const PASSWORD_CHANGE_LIMIT = 1;

function getDefaultBackgroundUrl(sceneId: string): string {
    if (sceneId.startsWith('spring')) return getSpringSceneBackgroundImage(sceneId);
    return getChristmasSceneBackgroundImage(sceneId);
}

const ALL_SCENES = [
    { theme: 'spring' as const, ids: [...SPRING_SCENE_IDS] },
    { theme: 'christmas' as const, ids: [...CHRISTMAS_SCENE_IDS] },
];

const SettingsPage: React.FC = () => {
    const { user, checkAuth } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [selectedSceneId, setSelectedSceneId] = useState<string>(SPRING_SCENE_IDS[0]);
    const [file, setFile] = useState<File | null>(null);
    const customBackgrounds = user?.customBackgrounds ?? {};
    const currentCustomUrl = customBackgrounds[selectedSceneId] ? `${SERVER_ORIGIN}${customBackgrounds[selectedSceneId]}` : null;
    const defaultUrl = getDefaultBackgroundUrl(selectedSceneId);
    const [preview, setPreview] = useState<string | null>(currentCustomUrl || defaultUrl);
    const [uploading, setUploading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 个人主页：头像
    const currentAvatar = user?.avatar || DEFAULT_AVATAR;
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [avatarSuccess, setAvatarSuccess] = useState(false);

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

    // 切换选中的场景时只更新预览，不清空已选文件（避免 customBackgrounds 每次渲染是新对象导致 file 被清空、上传无请求）
    React.useEffect(() => {
        const custom = user?.customBackgrounds?.[selectedSceneId];
        if (custom) setPreview(`${SERVER_ORIGIN}${custom}`);
        else setPreview(getDefaultBackgroundUrl(selectedSceneId));
    }, [selectedSceneId, user?.customBackgrounds]);

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
            const response = await api.post(
                `/users/background?sceneId=${encodeURIComponent(selectedSceneId)}`,
                formData,
                { timeout: 20000 }
            );
            if (response.data.success) {
                setSuccess(true);
                setFile(null);
                if (response.data.imageUrl) setPreview(`${SERVER_ORIGIN}${response.data.imageUrl}`);
                await checkAuth();
            }
        } catch (err: any) {
            const data = err?.response?.data;
            const msg = data?.message || data?.error || (err.code === 'ECONNABORTED' ? (theme === 'spring' ? '上传超时，请检查网络或稍后重试' : 'Upload timeout') : 'Upload failed');
            setError(msg);
            if (import.meta.env.DEV) console.error('Background upload error', err?.message || err, data);
        } finally {
            setUploading(false);
        }
    };

    const handleRestoreDefault = async () => {
        setRestoring(true);
        setError(null);
        setSuccess(false);
        try {
            await api.delete(`/users/background/${selectedSceneId}`);
            setPreview(getDefaultBackgroundUrl(selectedSceneId));
            setSuccess(true);
            setFile(null);
            await checkAuth();
        } catch (err: any) {
            setError((err as any)?.response?.data?.message || 'Restore failed');
        } finally {
            setRestoring(false);
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
                minWidth: 0,
                padding: 'var(--page-padding-y) var(--page-padding-x)',
                overflowY: 'auto',
                background: mainBg,
                color: 'white',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                position: 'relative',
                zIndex: 60,
            }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px'
                }}>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                        ⚙️ 设置 <span className="bilingual-en">Settings</span>
                    </h1>
                    <button
                        className="ios-btn tap-scale"
                        onClick={() => navigate('/')}
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '10px 16px' }}
                    >
                        完成 <span className="bilingual-en">Done</span>
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
                        个人主页 <span className="bilingual-en">Profile</span>
                    </h2>

                    {/* 头像 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                            头像 <span className="bilingual-en">Avatar</span>
                        </label>
                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#666' }}>
                            当前头像 <span className="bilingual-en">Current avatar</span>：<span style={{ fontSize: '28px' }}>{currentAvatar}</span>
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {AVATAR_EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className="tap-scale"
                                    disabled={avatarLoading}
                                    onClick={async () => {
                                        setAvatarLoading(true);
                                        setAvatarError(null);
                                        setAvatarSuccess(false);
                                        try {
                                            await api.put('/users/profile/avatar', { avatar: emoji });
                                            setAvatarSuccess(true);
                                            await checkAuth();
                                        } catch (err: any) {
                                            const status = err?.response?.status;
                                            const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? (status === 404 ? (theme === 'spring' ? '接口不存在(404)，请检查网络或联系管理员' : 'Not found (404)') : (theme === 'spring' ? '更新失败，请重试' : 'Update failed'));
                                            setAvatarError(msg);
                                        } finally {
                                            setAvatarLoading(false);
                                        }
                                    }}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        fontSize: '24px',
                                        border: currentAvatar === emoji ? '2px solid var(--ios-blue)' : '1px solid rgba(60,60,67,0.2)',
                                        borderRadius: '10px',
                                        background: currentAvatar === emoji ? 'rgba(0,122,255,0.1)' : '#f2f2f7',
                                        cursor: avatarLoading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        {avatarError && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(255,59,48,0.15)', borderColor: 'rgba(255,59,48,0.3)', color: '#c0392b' }}>
                                {avatarError}
                            </div>
                        )}
                        {avatarSuccess && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(52,199,89,0.15)', borderColor: 'rgba(52,199,89,0.3)', color: '#27ae60' }}>
                                {theme === 'spring' ? <>头像已更新 <span className="bilingual-en">Avatar updated</span></> : 'Avatar updated'}
                            </div>
                        )}
                    </div>

                    {/* 修改昵称 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                            修改昵称 <span className="bilingual-en">Edit nickname</span>
                        </label>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>
                            当前昵称 <span className="bilingual-en">Current</span>：{user?.nickname ?? '-'} · 剩余修改次数 <span className="bilingual-en">Remaining</span>：{Math.max(0, nicknameRemain)}/{NICKNAME_CHANGE_LIMIT}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="输入新昵称 Enter new nickname"
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
                                {nicknameLoading ? <>提交中... <span className="bilingual-en">Submitting...</span></> : <>保存 <span className="bilingual-en">Save</span></>}
                            </button>
                        </div>
                        {nicknameError && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(255,59,48,0.15)', borderColor: 'rgba(255,59,48,0.3)', color: '#c0392b' }}>
                                {nicknameError}
                            </div>
                        )}
                        {nicknameSuccess && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(52,199,89,0.15)', borderColor: 'rgba(52,199,89,0.3)', color: '#27ae60' }}>
                                昵称已更新 <span className="bilingual-en">Nickname updated</span>
                            </div>
                        )}
                    </div>

                    {/* 修改密码 */}
                    <div>
                        <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                            修改密码 <span className="bilingual-en">Change password</span>
                        </label>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>
                            剩余修改次数 <span className="bilingual-en">Remaining</span>：{Math.max(0, passwordRemain)}/{PASSWORD_CHANGE_LIMIT}（每人限 1 次 <span className="bilingual-en">once per user</span>）
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="当前密码 Current password"
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
                                placeholder="新密码 6 位 New password, 6 digits"
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
                                {passwordLoading ? <>提交中... <span className="bilingual-en">Submitting...</span></> : <>保存新密码 <span className="bilingual-en">Save new password</span></>}
                            </button>
                        </div>
                        {passwordError && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(255,59,48,0.15)', borderColor: 'rgba(255,59,48,0.3)', color: '#c0392b' }}>
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="ios-info-banner" style={{ marginTop: '10px', background: 'rgba(52,199,89,0.15)', borderColor: 'rgba(52,199,89,0.3)', color: '#27ae60' }}>
                                密码已更新 <span className="bilingual-en">Password updated</span>
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
                        自定义背景（按场景） <span className="bilingual-en">Custom Background</span>
                    </label>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                        先选择要修改的场景，再上传图片；可随时恢复默认。 <span className="bilingual-en">Select a scene, then upload an image; you can restore default anytime.</span>
                    </p>

                    <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
                            选择场景 <span className="bilingual-en">Select scene</span>
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {ALL_SCENES.flatMap(({ ids }) => ids).map(sid => (
                                <button
                                    key={sid}
                                    type="button"
                                    onClick={() => setSelectedSceneId(sid)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        border: selectedSceneId === sid ? '2px solid ' + themeConfig[theme].primary : '1px solid rgba(60,60,67,0.2)',
                                        background: selectedSceneId === sid ? 'rgba(0,0,0,0.04)' : '#f9f9f9',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <span>{SCENE_ICONS[sid] ?? '📁'}</span>
                                    <span>{getSceneName(sid)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

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
                                    opacity: 0.6
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
                                {file ? file.name : <>选择图片 <span className="bilingual-en">Choose image</span></>}
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
                            已更新 <span className="bilingual-en">Updated!</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="ios-btn tap-scale"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            style={{
                                flex: 1,
                                minWidth: '120px',
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
                            {uploading ? <>上传中... <span className="bilingual-en">Uploading...</span></> : <>保存 <span className="bilingual-en">Save</span></>}
                        </button>
                        {customBackgrounds[selectedSceneId] && (
                            <button
                                type="button"
                                className="ios-btn tap-scale"
                                onClick={handleRestoreDefault}
                                disabled={restoring}
                                style={{
                                    padding: '14px 20px',
                                    background: restoring ? '#ccc' : 'rgba(60,60,67,0.12)',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    cursor: restoring ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {restoring ? <>恢复中... <span className="bilingual-en">Restoring...</span></> : <>恢复默认 <span className="bilingual-en">Restore default</span></>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
