import express, { Request, Response, NextFunction } from 'express';
import {
    encryptPhone,
    generateVerificationCode,
    hashCode,
    sendSMS,
    compareCode,
    generateJWT
} from '../utils/security';
import VerificationCode from '../models/VerificationCode';
import User from '../models/User';
import { ipLimiterMiddleware, phoneLimiterMiddleware } from '../middleware/rateLimiter';
import { signatureMiddleware } from '../middleware/requestSignature';

const router = express.Router();

// Apply signature check to all auth routes
router.use(signatureMiddleware);

// POST /api/auth/request-code
router.post('/request-code',
    ipLimiterMiddleware,
    phoneLimiterMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ error: "INVALID_PHONE", message: "Phone number is required" });
            }

            // Encrypt phone
            const encryptedPhone = encryptPhone(phoneNumber);

            // Generate code & hash
            const code = generateVerificationCode();
            const codeHash = await hashCode(code);

            // Access VerificationCode model properly
            // Store in DB (5 min expiration via schema)
            await VerificationCode.create({
                encryptedPhone,
                codeHash,
                ipAddress: req.ip || 'unknown',
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            });

            // Send SMS (Mock)
            await sendSMS(phoneNumber, code);

            // DEBUG: Log code for manual testing since it's a mock
            console.log(`[DEBUG] Code for ${phoneNumber}: ${code}`);

            res.status(200).json({ success: true, message: "Code sent" });
        } catch (error) {
            console.error("Request Code Error:", error);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a6b28d35-4418-428e-ad64-f26ccc119f12', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'pre-fix',
                    hypothesisId: 'H4',
                    location: 'server/src/routes/auth.ts:54',
                    message: 'Error in /auth/request-code handler',
                    data: {
                        errorMessage: (error as any)?.message || 'unknown',
                        phoneBody: (req.body as any)?.phoneNumber || null
                    },
                    timestamp: Date.now()
                })
            }).catch(() => { });
            // #endregion
            res.status(500).json({ error: "SERVER_ERROR" });
        }
    }
);

// Dev-only bypass codes so registration works without checking server console
const DEV_BYPASS_CODES = ['123456', '654321'];

// POST /api/auth/verify-code
router.post('/verify-code',
    ipLimiterMiddleware,
    async (req: Request, res: Response) => {
        try {
            const { phoneNumber, code, nickname, gender, age, region } = req.body;
            if (!phoneNumber || !code) {
                return res.status(400).json({ error: "INVALID_INPUT", message: "Phone and code required" });
            }

            const encryptedPhone = encryptPhone(phoneNumber);

            // In development, accept bypass codes so testing works without server console
            const isDevBypass = process.env.NODE_ENV !== 'production' &&
                DEV_BYPASS_CODES.includes(String(code).trim());

            if (!isDevBypass) {
                // Find valid code
                // Sort by createdAt desc to get latest
                const record = await VerificationCode.findOne({ encryptedPhone })
                    .sort({ createdAt: -1 });

                if (!record) {
                    return res.status(400).json({ error: "INVALID_CODE", message: "Code not found or expired" });
                }

                // Check if match
                const isValid = await compareCode(code, record.codeHash);
                if (!isValid) {
                    return res.status(400).json({ error: "INVALID_CODE", message: "Incorrect code" });
                }

                // Cleanup codes
                await VerificationCode.deleteMany({ encryptedPhone });
            }

            // Find or Create User
            let user = await User.findOne({ encryptedPhone });
            if (!user) {
                user = await User.create({ encryptedPhone });
            }

            // Update Profile if provided (Registration flow)
            if (nickname) {
                user.nickname = nickname;
                user.gender = gender;
                user.age = age;
                user.region = region;
                await user.save();
            }

            // Generate Token
            const token = generateJWT((user._id as any).toString());

            res.status(200).json({ success: true, token });
        } catch (error) {
            console.error("Verify Code Error:", error);
            res.status(500).json({ error: "SERVER_ERROR" });
        }
    }
);

export default router;
