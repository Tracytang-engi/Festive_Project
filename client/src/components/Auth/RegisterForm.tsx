import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');

    // Profile
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

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2>Registration</h2>

            {step === 1 && (
                <div>
                    <input
                        type="text"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                    />
                    <button onClick={handleRequestCode} style={{ width: '100%', padding: '10px', background: '#333', color: 'white', border: 'none' }}>
                        Get Code
                    </button>
                </div>
            )}

            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" placeholder="SMS Code" value={code} onChange={e => setCode(e.target.value)} style={{ padding: '8px' }} />
                    <input type="text" placeholder="Nickname" value={profile.nickname} onChange={e => setProfile({ ...profile, nickname: e.target.value })} style={{ padding: '8px' }} />
                    <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })} style={{ padding: '8px' }}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                    <input type="number" placeholder="Age" value={profile.age} onChange={e => setProfile({ ...profile, age: Number(e.target.value) })} style={{ padding: '8px' }} />
                    <input type="text" placeholder="Region" value={profile.region} onChange={e => setProfile({ ...profile, region: e.target.value })} style={{ padding: '8px' }} />

                    <button onClick={handleVerify} style={{ width: '100%', padding: '10px', background: '#2f5a28', color: 'white', border: 'none' }}>
                        Join the Festivities
                    </button>
                </div>
            )}
        </div>
    );
};

export default RegisterForm;
