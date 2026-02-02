import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { themeConfig } from '../../constants/theme';
import { useNavigate } from 'react-router-dom';

type Mode = 'login' | 'register';

const AuthForm: React.FC = () => {
    const { login, register } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [mode, setMode] = useState<Mode>('login');
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [region, setRegion] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const mainBg = themeConfig[theme].mainBg;

    const handleCheckId = async () => {
        if (!userId.trim()) {
            setError('请输入 ID');
            return;
        }
        if (userId.trim().length !== 6) {
            setError('ID 必须为 6 位');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/check-id', { userId: userId.trim() });
            if (res.data.exists) {
                setStep(2);
            } else {
                setError('请先注册账号');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || '检查失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!password.trim()) {
            setError('请输入密码');
            return;
        }
        if (password.trim().length !== 6) {
            setError('密码必须为 6 位');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login(userId.trim(), password.trim());
            navigate('/');
        } catch (err: any) {
            const data = err?.response?.data;
            setError(data?.message || '登录失败');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!nickname.trim() || !userId.trim() || !password.trim()) {
            setError('请填写名称、ID 和密码');
            return;
        }
        if (!region.trim()) {
            setError('请选择地区');
            return;
        }
        if (userId.trim().length !== 6) {
            setError('ID 必须为 6 位');
            return;
        }
        if (password.length !== 6) {
            setError('密码必须为 6 位');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await register(nickname.trim(), userId.trim(), password.trim(), region.trim());
            navigate('/');
        } catch (err: any) {
            const data = err?.response?.data;
            setError(data?.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m: Mode) => {
        setMode(m);
        setStep(1);
        setUserId('');
        setPassword('');
        setNickname('');
        setRegion('');
        setError('');
    };

    const backToStep1 = () => {
        setStep(1);
        setPassword('');
        setError('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            minWidth: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto',
            background: mainBg,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            <div className="ios-card" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '32px',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                color: '#333'
            }}>
                <h1 style={{ margin: '0 0 28px', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                    🎉 Festivities
                </h1>

                {/* 登录 / 注册 切换 */}
                <div className="ios-segmented" style={{ marginBottom: '24px' }}>
                    <button
                        className={`${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        登录
                    </button>
                    <button
                        className={`${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        注册
                    </button>
                </div>

                {error && (
                    <div className="ios-info-banner" style={{
                        marginBottom: '16px',
                        background: 'rgba(255,59,48,0.15)',
                        borderColor: 'rgba(255,59,48,0.3)',
                        color: '#c0392b'
                    }}>
                        {error}
                    </div>
                )}

                {/* 登录流程 */}
                {mode === 'login' && (
                    <>
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                        ID 号码
                                    </label>
                                    <input
                                        type="text"
                                        className="ios-input"
                                        placeholder="6位数字或字母"
                                        value={userId}
                                        maxLength={6}
                                        onChange={e => { setUserId(e.target.value.slice(0, 6)); setError(''); }}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <button
                                    className="ios-btn ios-btn-primary ios-btn-pill tap-scale"
                                    onClick={handleCheckId}
                                    disabled={loading}
                                    style={{ width: '100%', padding: '14px', background: 'var(--ios-blue)', color: 'white' }}
                                >
                                    {loading ? '检查中...' : '下一步'}
                                </button>
                            </div>
                        )}
                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <button
                                    type="button"
                                    className="ios-btn tap-scale"
                                    onClick={backToStep1}
                                    style={{ alignSelf: 'flex-start', padding: '8px 16px', background: '#f2f2f7', border: 'none', borderRadius: '8px', fontSize: '14px' }}
                                >
                                    ← 返回
                                </button>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                        密码
                                    </label>
                                    <input
                                        type="password"
                                        className="ios-input"
                                        placeholder="6位密码"
                                        value={password}
                                        maxLength={6}
                                        onChange={e => { setPassword(e.target.value.slice(0, 6)); setError(''); }}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <button
                                    className="ios-btn ios-btn-primary ios-btn-pill tap-scale"
                                    onClick={handleLogin}
                                    disabled={loading}
                                    style={{ width: '100%', padding: '14px', background: 'var(--ios-blue)', color: 'white' }}
                                >
                                    {loading ? '登录中...' : '登录'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* 注册流程 */}
                {mode === 'register' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                名称
                            </label>
                            <input
                                type="text"
                                className="ios-input"
                                placeholder="设置您的显示名称"
                                value={nickname}
                                onChange={e => { setNickname(e.target.value); setError(''); }}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                地区
                            </label>
                            <select
                                className="ios-input"
                                value={region}
                                onChange={e => { setRegion(e.target.value); setError(''); }}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(60,60,67,0.12)', fontSize: '16px' }}
                            >
                                <option value="">请选择地区</option>
                                <option value="北京">北京</option>
                                <option value="上海">上海</option>
                                <option value="广州">广州</option>
                                <option value="深圳">深圳</option>
                                <option value="杭州">杭州</option>
                                <option value="成都">成都</option>
                                <option value="武汉">武汉</option>
                                <option value="西安">西安</option>
                                <option value="南京">南京</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                ID 号码
                            </label>
                            <input
                                type="text"
                                className="ios-input"
                                placeholder="6位数字或字母"
                                value={userId}
                                maxLength={6}
                                onChange={e => { setUserId(e.target.value.slice(0, 6)); setError(''); }}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                密码
                            </label>
                            <input
                                type="password"
                                className="ios-input"
                                placeholder="6位密码"
                                value={password}
                                maxLength={6}
                                onChange={e => { setPassword(e.target.value.slice(0, 6)); setError(''); }}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <button
                            className="ios-btn ios-btn-pill tap-scale"
                            onClick={handleRegister}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: themeConfig[theme].primary,
                                color: theme === 'spring' ? '#c0392b' : 'white',
                                marginTop: '8px'
                            }}
                        >
                            {loading ? '注册中...' : '加入 Festivities ✨'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthForm;
