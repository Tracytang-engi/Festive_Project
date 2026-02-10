"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSignature = exports.generateJWT = exports.sendSMS = exports.comparePassword = exports.hashPassword = exports.compareCode = exports.hashCode = exports.generateVerificationCode = exports.decryptPhone = exports.encryptPhone = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ALERT_AES_KEY_MISSING = "AES_KEY environment variable is not set or valid (must be 32 bytes for AES-256)";
const ALERT_JWT_SECRET_MISSING = "JWT_SECRET is missing";
const ALERT_HMAC_SECRET_MISSING = "HMAC_SECRET is missing";
// Ensure keys are present (in production better to throw error on startup)
const getAesKey = () => {
    const key = process.env.AES_KEY;
    if (!key)
        throw new Error(ALERT_AES_KEY_MISSING);
    // If key is hex string, handle it, otherwise ensure length
    // For simplicity assuming user provides a 32-char string or hex
    // Adjust logic to fit strict 32 byte requirement
    return crypto_1.default.scryptSync(key, 'salt', 32);
};
// 1. Phone Number Handling (AES-256-CBC)
const encryptPhone = (phone) => {
    const key = getAesKey();
    // Deterministic IV for DB lookup capabilities:
    // IV = First 16 bytes of HMAC(phone) or Hash(phone)
    // This allows findOne({ encryptedPhone }) to work.
    const iv = crypto_1.default.createHash('sha256').update(phone).digest().subarray(0, 16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(phone, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};
exports.encryptPhone = encryptPhone;
const decryptPhone = (encryptedPhone) => {
    const key = getAesKey();
    const [ivHex, encryptedHex] = encryptedPhone.split(':');
    if (!ivHex || !encryptedHex)
        throw new Error("Invalid encrypted format");
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptPhone = decryptPhone;
// 2. Verification Code Handling
const generateVerificationCode = () => {
    // Generate 6-digit random number
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateVerificationCode = generateVerificationCode;
const hashCode = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRounds = 10;
    return yield bcrypt_1.default.hash(code, saltRounds);
});
exports.hashCode = hashCode;
const compareCode = (code, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.compare(code, hash);
});
exports.compareCode = compareCode;
// 密码加密（bcrypt）
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRounds = 10;
    return yield bcrypt_1.default.hash(password, saltRounds);
});
exports.hashPassword = hashPassword;
const comparePassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.compare(password, hash);
});
exports.comparePassword = comparePassword;
// 6. Utility Functions
const sendSMS = (phone, code) => __awaiter(void 0, void 0, void 0, function* () {
    // Mock implementation
    console.log(`[MOCK SMS] To: ${phone}, Code: ${code}`);
    // Simulate network delay
    yield new Promise(resolve => setTimeout(resolve, 500));
});
exports.sendSMS = sendSMS;
const generateJWT = (userId) => {
    if (!process.env.JWT_SECRET)
        throw new Error(ALERT_JWT_SECRET_MISSING);
    // Expire in 7 days
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
};
exports.generateJWT = generateJWT;
// Request Signature
const generateSignature = (payload, timestamp) => {
    if (!process.env.HMAC_SECRET)
        throw new Error(ALERT_HMAC_SECRET_MISSING);
    const data = `${JSON.stringify(payload)}${timestamp}`;
    return crypto_1.default.createHmac('sha256', process.env.HMAC_SECRET).update(data).digest('hex');
};
exports.generateSignature = generateSignature;
