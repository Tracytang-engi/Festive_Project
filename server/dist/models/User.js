"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, unique: true },
    avatar: { type: String },
    passwordHash: { type: String, required: true },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    region: { type: String },
    gender: { type: String },
    age: { type: Number },
    selectedScene: { type: String },
    themePreference: { type: String, enum: ['christmas', 'spring'], default: 'christmas' },
    backgroundImage: { type: String },
    customBackgrounds: { type: mongoose_1.Schema.Types.Mixed },
    nicknameChangeCount: { type: Number, default: 0 },
    passwordChangeCount: { type: Number, default: 0 },
    sceneLayout: { type: mongoose_1.Schema.Types.Mixed },
    email: { type: String, sparse: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'moderator'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});
// 返回用户信息时排除敏感字段
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.loginAttempts;
    delete obj.lockedUntil;
    return obj;
};
exports.default = mongoose_1.default.model('User', UserSchema);
