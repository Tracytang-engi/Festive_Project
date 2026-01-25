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
const express_1 = __importDefault(require("express"));
const security_1 = require("../utils/security");
const VerificationCode_1 = __importDefault(require("../models/VerificationCode"));
const User_1 = __importDefault(require("../models/User"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const requestSignature_1 = require("../middleware/requestSignature");
const router = express_1.default.Router();
// Apply signature check to all auth routes
router.use(requestSignature_1.signatureMiddleware);
// POST /api/auth/request-code
router.post('/request-code', rateLimiter_1.ipLimiterMiddleware, rateLimiter_1.phoneLimiterMiddleware, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ error: "INVALID_PHONE", message: "Phone number is required" });
        }
        // Encrypt phone
        const encryptedPhone = (0, security_1.encryptPhone)(phoneNumber);
        // Generate code & hash
        const code = (0, security_1.generateVerificationCode)();
        const codeHash = yield (0, security_1.hashCode)(code);
        // Access VerificationCode model properly
        // Store in DB (5 min expiration via schema)
        yield VerificationCode_1.default.create({
            encryptedPhone,
            codeHash,
            ipAddress: req.ip || 'unknown',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });
        // Send SMS (Mock)
        yield (0, security_1.sendSMS)(phoneNumber, code);
        // DEBUG: Log code for manual testing since it's a mock
        console.log(`[DEBUG] Code for ${phoneNumber}: ${code}`);
        res.status(200).json({ success: true, message: "Code sent" });
    }
    catch (error) {
        console.error("Request Code Error:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
// POST /api/auth/verify-code
router.post('/verify-code', rateLimiter_1.ipLimiterMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, code, nickname, gender, age, region } = req.body;
        if (!phoneNumber || !code) {
            return res.status(400).json({ error: "INVALID_INPUT", message: "Phone and code required" });
        }
        const encryptedPhone = (0, security_1.encryptPhone)(phoneNumber);
        // Find valid code
        // Sort by createdAt desc to get latest
        const record = yield VerificationCode_1.default.findOne({ encryptedPhone })
            .sort({ createdAt: -1 });
        if (!record) {
            return res.status(400).json({ error: "INVALID_CODE", message: "Code not found or expired" });
        }
        // Check if match
        const isValid = yield (0, security_1.compareCode)(code, record.codeHash);
        if (!isValid) {
            return res.status(400).json({ error: "INVALID_CODE", message: "Incorrect code" });
        }
        // Cleanup codes
        yield VerificationCode_1.default.deleteMany({ encryptedPhone });
        // Find or Create User
        let user = yield User_1.default.findOne({ encryptedPhone });
        if (!user) {
            user = yield User_1.default.create({ encryptedPhone });
        }
        // Update Profile if provided (Registration flow)
        if (nickname) {
            user.nickname = nickname;
            user.gender = gender;
            user.age = age;
            user.region = region;
            yield user.save();
        }
        // Generate Token
        const token = (0, security_1.generateJWT)(user._id.toString());
        res.status(200).json({ success: true, token });
    }
    catch (error) {
        console.error("Verify Code Error:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
