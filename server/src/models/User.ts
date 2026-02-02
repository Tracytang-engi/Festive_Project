import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    userId: string;           // 用户自定义 ID，用于登录
    nickname: string;         // 显示名称
    passwordHash: string;     // bcrypt 加密的密码
    loginAttempts: number;    // 登录失败次数
    lockedUntil?: Date;       // 账户冻结截止时间
    region?: string;
    gender?: string;
    age?: number;
    selectedScene?: string;
    themePreference?: 'christmas' | 'spring';
    backgroundImage?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    userId: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    region: { type: String },
    gender: { type: String },
    age: { type: Number },
    selectedScene: { type: String },
    themePreference: { type: String, enum: ['christmas', 'spring'], default: 'christmas' },
    backgroundImage: { type: String },
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

export default mongoose.model<IUser>('User', UserSchema);
