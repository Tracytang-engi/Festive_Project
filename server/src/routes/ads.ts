import express from 'express';
import Ad from '../models/Ad';

const router = express.Router();

// GET /api/ads (Public)
router.get('/', async (req, res) => {
    try {
        // Return latest active ad
        const ad = await Ad.findOne({ active: true }).sort({ createdAt: -1 });

        if (!ad) {
            // Default Fallback
            return res.json({
                imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='500' viewBox='0 0 300 500'%3E%3Crect width='300' height='500' fill='%23e0e0e0'/%3E%3Ctext x='150' y='250' text-anchor='middle' fill='%23999' font-size='16' font-family='sans-serif'%3ESuperCamEngi WeChat%3C/text%3E%3C/svg%3E",
                linkUrl: "#",
                text: "Add SuperCamEngi on WeChat!"
            });
        }

        res.json(ad);
    } catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
