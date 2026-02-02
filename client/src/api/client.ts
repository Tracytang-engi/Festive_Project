import axios, { type InternalAxiosRequestConfig } from 'axios';
import { generateSignature } from '../utils/security';

const api = axios.create({
    baseURL: 'http://127.0.0.1:3000/api', // Point to Backend (use 127.0.0.1 to avoid ERR_NAME_NOT_RESOLVED on some Windows)
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Add Auth Token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Security Signatures (HMAC)
    const timestamp = Date.now();
    config.headers['x-timestamp'] = timestamp.toString();

    // Payload: data for POST/PUT, empty object for GET?
    // WARNING: Server expects JSON.stringify(body) + timestamp.
    // GET requests usually have no body. Server middleware needs to handle that.
    // Our server middleware used `req.body || {}`.

    let payload = config.data || {};
    // Axios might treat data as undefined for GET.

    const signature = generateSignature(payload, timestamp);
    config.headers['x-signature'] = signature;

    return config;
});

export default api;
