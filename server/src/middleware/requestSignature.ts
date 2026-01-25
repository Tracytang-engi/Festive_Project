import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const ALERT_HMAC_SECRET_MISSING = "HMAC_SECRET is missing";

export const signatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip for non-POST/PUT if needed, but requirements imply "All endpoints" or specific secure ones. 
    // Usually only state-changing ones need signature or all API ones.

    // Check headers
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;

    if (!signature || !timestamp) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a6b28d35-4418-428e-ad64-f26ccc119f12', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'debug-session',
                runId: 'pre-fix',
                hypothesisId: 'H1',
                location: 'server/src/middleware/requestSignature.ts:18',
                message: 'Missing signature or timestamp',
                data: { hasSignature: !!signature, hasTimestamp: !!timestamp, path: req.path, method: req.method },
                timestamp: Date.now()
            })
        }).catch(() => { });
        // #endregion
        return res.status(401).json({ error: "INVALID_SIGNATURE", message: "Missing signature or timestamp headers" });
    }

    // Check timestamp freshness (2 minutes)
    const now = Date.now();
    const reqTime = parseInt(timestamp, 10);
    if (isNaN(reqTime) || now - reqTime > 2 * 60 * 1000 || now - reqTime < -5000) { // Allow 5s clock skew future
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a6b28d35-4418-428e-ad64-f26ccc119f12', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'debug-session',
                runId: 'pre-fix',
                hypothesisId: 'H2',
                location: 'server/src/middleware/requestSignature.ts:22',
                message: 'Expired or invalid timestamp',
                data: { now, reqTime, delta: now - reqTime, path: req.path, method: req.method },
                timestamp: Date.now()
            })
        }).catch(() => { });
        // #endregion
        return res.status(401).json({ error: "INVALID_SIGNATURE", message: "Request expired" });
    }

    // Verify Signature
    if (!process.env.HMAC_SECRET) {
        console.error(ALERT_HMAC_SECRET_MISSING);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a6b28d35-4418-428e-ad64-f26ccc119f12', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'debug-session',
                runId: 'pre-fix',
                hypothesisId: 'H3',
                location: 'server/src/middleware/requestSignature.ts:28',
                message: 'HMAC_SECRET missing on server',
                data: { path: req.path, method: req.method },
                timestamp: Date.now()
            })
        }).catch(() => { });
        // #endregion
        return res.status(500).json({ error: "SERVER_ERROR" });
    }

    // Payload is usually body. For GET query params?
    // Using req.body assuming JSON body parser already ran.
    // NOTE: For absolute security, raw body should be used, but for this exercise JSON body is standard express flow.
    // Construct payload string same as client: JSON.stringify(body) + timestamp
    // CAUTION: JSON.stringify key order matters. Client and Server must allow stable stringify.
    // For simplicity here assume simple object. Front end must stringify exactly same way.

    const payload = req.body || {};
    const data = `${JSON.stringify(payload)}${timestamp}`;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.HMAC_SECRET)
        .update(data)
        .digest('hex');

    // Constant time comparison to prevent timing attacks
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: "INVALID_SIGNATURE", message: "Signature mismatch" });
    }

    next();
};
