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
                imageUrl: "https://via.placeholder.com/300x500?text=SuperCamEngi+WeChat", // Placeholder as per plan
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
