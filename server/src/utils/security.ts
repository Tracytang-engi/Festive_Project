import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ALERT_AES_KEY_MISSING = "AES_KEY environment variable is not set or valid (must be 32 bytes for AES-256)";
const ALERT_JWT_SECRET_MISSING = "JWT_SECRET is missing";
const ALERT_HMAC_SECRET_MISSING = "HMAC_SECRET is missing";

// Ensure keys are present (in production better to throw error on startup)
const getAesKey = (): Buffer => {
    const key = process.env.AES_KEY;
    if (!key) throw new Error(ALERT_AES_KEY_MISSING);
    // If key is hex string, handle it, otherwise ensure length
    // For simplicity assuming user provides a 32-char string or hex
    // Adjust logic to fit strict 32 byte requirement
    return crypto.scryptSync(key, 'salt', 32);
};

// 1. Phone Number Handling (AES-256-CBC)
export const encryptPhone = (phone: string): string => {
    const key = getAesKey();
    // Deterministic IV for DB lookup capabilities:
    // IV = First 16 bytes of HMAC(phone) or Hash(phone)
    // This allows findOne({ encryptedPhone }) to work.
    const iv = crypto.createHash('sha256').update(phone).digest().subarray(0, 16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(phone, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptPhone = (encryptedPhone: string): string => {
    const key = getAesKey();
    const [ivHex, encryptedHex] = encryptedPhone.split(':');
    if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted format");

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

// 2. Verification Code Handling
export const generateVerificationCode = (): string => {
    // Generate 6-digit random number
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashCode = async (code: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(code, saltRounds);
};

export const compareCode = async (code: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(code, hash);
};

// 密码加密（bcryptjs，与 bcrypt 算法兼容）
export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

// 6. Utility Functions
export const sendSMS = async (phone: string, code: string): Promise<void> => {
    // Mock implementation
    console.log(`[MOCK SMS] To: ${phone}, Code: ${code}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
};

export const generateJWT = (userId: string): string => {
    if (!process.env.JWT_SECRET) throw new Error(ALERT_JWT_SECRET_MISSING);
    // Expire in 7 days
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
};

// Request Signature
export const generateSignature = (payload: any, timestamp: number): string => {
    if (!process.env.HMAC_SECRET) throw new Error(ALERT_HMAC_SECRET_MISSING);
    const data = `${JSON.stringify(payload)}${timestamp}`;
    return crypto.createHmac('sha256', process.env.HMAC_SECRET).update(data).digest('hex');
};
