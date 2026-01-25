import CryptoJS from 'crypto-js';

// Must match server's secret. In real app, this key shouldn't be exposed easily, 
// but for this "secure defaults" demo, we'll use an environment var or hardcoded matching logic used in server .env
// Note: Client-side secret storage is impossible to satisfy "perfect" security, 
// usually we'd rely on HTTPS + Cookie, but requirements asked for signature.
const HMAC_SECRET = "super_secret_hmac_key_change_me";

export const generateSignature = (payload: any, timestamp: number) => {
    // If payload is empty (GET), use empty object/string logic matching server
    const data = `${JSON.stringify(payload)}${timestamp}`;
    const hash = CryptoJS.HmacSHA256(data, HMAC_SECRET);
    return hash.toString(CryptoJS.enc.Hex);
};
