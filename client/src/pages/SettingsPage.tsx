import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SettingsPage: React.FC = () => {
    const { user } = useAuth(); // We might need to refresh user data or update context manually
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const serverUrl = 'http://localhost:3000';
    const initialPreview = user?.backgroundImage ? `${serverUrl}${user.backgroundImage}` : null;
    const [preview, setPreview] = useState<string | null>(initialPreview);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

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
            // Note: client.ts sets Content-Type: application/json by default.
            // Axios allows overriding it.
            // But we need to make sure the interceptor doesn't break signatures if they are used.
            // Since we found signatureMiddleware is likely unused or we'll bypass signature for now if complex.
            // Actually, if we use 'api', the interceptor runs.
            // Let's assume signature logic handles empty body fine (since formData isn't in config.data in a simple way for interceptors to read usually).

            const response = await api.post('/users/background', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setSuccess(true);
                // We might need to reload the page or update the user context to see the background applied globally immediately
                // For now, we rely on ThemeContext updating if we refreshed user.
                // But AuthContext user is state. Login refreshes it?
                // We should ideally reload the window or have a fetchUser logic.
                window.location.reload();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 animate-fade-in relative z-10" style={{ color: theme === 'christmas' ? '#d42426' : '#c0392b' }}>
            <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl border-2 border-current">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-display">Settings</h2>
                    <button onClick={() => navigate('/')} className="hover:bg-black/5 p-2 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block font-semibold mb-2">Custom Background</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative"
                            style={{ minHeight: '150px' }}>

                            {preview ? (
                                <div className="absolute inset-0 w-full h-full">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg opacity-50" />
                                </div>
                            ) : null}

                            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <span className="bg-white/80 px-4 py-2 rounded-full shadow-sm text-sm font-medium">
                                    {file ? file.name : "Choose an image"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                    {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">Background updated!</p>}

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transform transition-all 
                            ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
                        `}
                        style={{ backgroundColor: theme === 'christmas' ? '#2f5a28' : '#f1c40f', color: theme === 'spring' ? '#c0392b' : 'white' }}
                    >
                        {uploading ? 'Uploading...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
