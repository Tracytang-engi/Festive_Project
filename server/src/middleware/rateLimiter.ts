import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

// IP-based limiter: 5/hour in prod, 60/hour in dev (for testing)
const rateLimiterIp = new RateLimiterMemory({
    points: isDev ? 60 : 5,
    duration: 3600, // 1 hour
});

// Phone-based limiter: 1/min in prod, 10/min in dev (for testing)
const rateLimiterPhone = new RateLimiterMemory({
    points: isDev ? 10 : 1,
    duration: 60, // 1 minute
});

export const ipLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    return next(); // Rate limit disabled for local testing - re-enable for production
    rateLimiterIp.consume(req.ip || 'unknown')
        .then(() => next())
        .catch(() => {
            res.status(429).json({ error: "RATE_LIMIT", message: "Too many requests from this IP" });
        });
};

export const phoneLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    return next(); // Rate limit disabled for local testing - re-enable for production
    const { phoneNumber } = req.body;
    if (!phoneNumber) return next();

    rateLimiterPhone.consume(phoneNumber)
        .then(() => next())
        .catch(() => {
            res.status(429).json({ error: "RATE_LIMIT", message: "Too many requests for this phone number" });
        });
};
