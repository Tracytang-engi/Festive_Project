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
const Ad_1 = __importDefault(require("../models/Ad"));
const router = express_1.default.Router();
// GET /api/ads (Public)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Return latest active ad
        const ad = yield Ad_1.default.findOne({ active: true }).sort({ createdAt: -1 });
        if (!ad) {
            // Default Fallback
            return res.json({
                imageUrl: "https://via.placeholder.com/300x500?text=SuperCamEngi+WeChat", // Placeholder as per plan
                linkUrl: "#",
                text: "Add SuperCamEngi on WeChat!"
            });
        }
        res.json(ad);
    }
    catch (err) {
        res.status(500).json({ error: "SERVER_ERROR" });
    }
}));
exports.default = router;
