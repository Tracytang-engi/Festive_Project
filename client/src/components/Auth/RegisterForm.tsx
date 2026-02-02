import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { themeConfig } from '../../constants/theme';
import { useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
    const { register } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');

    const [profile, setProfile] = useState({
        nickname: '',
        gender: 'other',
        age: 18,
        region: 'China'
    });

    const handleRequestCode = async () => {
        try {
            await api.post('/auth/request-code', { phoneNumber: phone });
            setStep(2);
        } catch (err) {
            alert("Failed to send code. Check console.");
        }
    };

    const handleVerify = async () => {
        try {
            await register(phone, code, profile);
            navigate('/');
        } catch (err) {
            alert("Registration failed. Invalid code?");
        }
    };

    const mainBg = themeConfig[theme].mainBg;

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
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
                    🎉 Join the Festivities
                </h1>

                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                Phone Number
                            </label>
                            <input
                                type="text"
                                className="ios-input"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <button
                            className="ios-btn ios-btn-primary ios-btn-pill tap-scale"
                            onClick={handleRequestCode}
                            style={{ width: '100%', padding: '14px', background: 'var(--ios-blue)', color: 'white' }}
                        >
                            Get Verification Code
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                SMS Code
                            </label>
                            <input
                                type="text"
                                className="ios-input"
                                placeholder="Enter verification code"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                Nickname
                            </label>
                            <input
                                type="text"
                                className="ios-input"
                                placeholder="Your nickname"
                                value={profile.nickname}
                                onChange={e => setProfile({ ...profile, nickname: e.target.value })}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                Gender
                            </label>
                            <select
                                className="ios-input"
                                value={profile.gender}
                                onChange={e => setProfile({ ...profile, gender: e.target.value })}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                Age
                            </label>
                            <input
                                type="number"
                                className="ios-input"
                                placeholder="Age"
                                value={profile.age}
                                onChange={e => setProfile({ ...profile, age: Number(e.target.value) })}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ios-gray)', fontWeight: 500, marginBottom: '8px' }}>
                                Region
                            </label>
                            <input
                                type="text"
                                className="ios-input"
                                placeholder="Region"
                                value={profile.region}
                                onChange={e => setProfile({ ...profile, region: e.target.value })}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <button
                            className="ios-btn ios-btn-pill tap-scale"
                            onClick={handleVerify}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: themeConfig[theme].primary,
                                color: theme === 'spring' ? '#c0392b' : 'white',
                                marginTop: '8px'
                            }}
                        >
                            Join the Festivities ✨
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterForm;
