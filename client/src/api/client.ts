import axios, { type InternalAxiosRequestConfig } from 'axios';
import { generateSignature } from '../utils/security';

// 开发环境用本地，生产环境用 VITE_API_URL（部署时在 Vercel 设置）
// 生产构建若未设置 VITE_API_URL，fallback 到线上 API，避免请求本地端口
const devApiUrl = 'http://127.0.0.1:3000';
const prodApiUrl = 'https://api.festickers.com';
const rawOrigin = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? prodApiUrl : devApiUrl);
export const SERVER_ORIGIN = typeof rawOrigin === 'string' ? rawOrigin.replace(/\/+$/, '') : rawOrigin;
// 避免 Vercel 里 VITE_API_URL 已含 /api 时变成 .../api/api/... 导致 404
const baseURL = SERVER_ORIGIN.endsWith('/api') ? SERVER_ORIGIN : `${SERVER_ORIGIN}/api`;

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const isFormData = config.data instanceof FormData;

    if (isFormData) {
        // FormData：由浏览器自动设置 Content-Type（含 boundary），不设会断送上传
        delete config.headers['Content-Type'];
        // 上传接口不走签名，避免预检/校验导致无响应
        config.headers.Authorization = localStorage.getItem('token')
            ? `Bearer ${localStorage.getItem('token')}`
            : '';
        return config;
    }

    // Add Auth Token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Security Signatures (HMAC) — 仅对非 FormData 请求
    const timestamp = Date.now();
    config.headers['x-timestamp'] = timestamp.toString();
    const payload = config.data || {};
    const signature = generateSignature(payload, timestamp);
    config.headers['x-signature'] = signature;

    // 排查头像 404：打印实际请求 URL（上线后可删）
    if (config.url?.includes('profile/avatar')) {
        const url = (config.baseURL || '') + (config.url || '');
        console.warn('[Avatar API 请求]', url);
    }

    return config;
});

export default api;
