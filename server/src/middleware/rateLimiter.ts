import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

// IP-based limiter: 5 requests per hour (as per requirements)
const rateLimiterIp = new RateLimiterMemory({
    points: 5,
    duration: 3600, // 1 hour
});

// Phone-based limiter: 1 request per minute
// Note: This requires body parser to run first to access req.body.phoneNumber
const rateLimiterPhone = new RateLimiterMemory({
    points: 1,
    duration: 60, // 1 minute
});

export const ipLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    rateLimiterIp.consume(req.ip || 'unknown')
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).json({ error: "RATE_LIMIT", message: "Too many requests from this IP" });
        });
};

export const phoneLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        // If no phone provided, maybe skip or let validation handle it? 
        // But for security on request-code endpoint, phone is required.
        // Let's assume validation happens or we just skip if missing (controller will error)
        return next();
    }

    rateLimiterPhone.consume(phoneNumber)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).json({ error: "RATE_LIMIT", message: "Too many requests for this phone number" });
        });
};
