import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "UNAUTHORIZED", message: "No token provided" });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET missing");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid token" });
    }
};
