"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneLimiterMiddleware = exports.ipLimiterMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const isDev = process.env.NODE_ENV !== 'production';
// IP-based limiter: 5/hour in prod, 60/hour in dev (for testing)
const rateLimiterIp = new rate_limiter_flexible_1.RateLimiterMemory({
    points: isDev ? 60 : 5,
    duration: 3600, // 1 hour
});
// Phone-based limiter: 1/min in prod, 10/min in dev (for testing)
const rateLimiterPhone = new rate_limiter_flexible_1.RateLimiterMemory({
    points: isDev ? 10 : 1,
    duration: 60, // 1 minute
});
const ipLimiterMiddleware = (req, res, next) => {
    rateLimiterIp.consume(req.ip || 'unknown')
        .then(() => next())
        .catch(() => {
        res.status(429).json({ error: "RATE_LIMIT", message: "Too many requests from this IP" });
    });
};
exports.ipLimiterMiddleware = ipLimiterMiddleware;
const phoneLimiterMiddleware = (req, res, next) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber)
        return next();
    rateLimiterPhone.consume(phoneNumber)
        .then(() => next())
        .catch(() => {
        res.status(429).json({ error: "RATE_LIMIT", message: "Too many requests for this phone number" });
    });
};
exports.phoneLimiterMiddleware = phoneLimiterMiddleware;
