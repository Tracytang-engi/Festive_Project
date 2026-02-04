import axios, { type InternalAxiosRequestConfig } from 'axios';
import { generateSignature } from '../utils/security';

export const SERVER_ORIGIN = 'http://127.0.0.1:3000';

const api = axios.create({
    baseURL: `${SERVER_ORIGIN}/api`,
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
    let payload = config.data || {};
    const signature = generateSignature(payload, timestamp);
    config.headers['x-signature'] = signature;

    return config;
});

export default api;
