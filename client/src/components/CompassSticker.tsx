import React, { useState, useMemo } from 'react';
import UserGuideModal from './UserGuideModal';

/**
 * 指南针贴纸：浮动、发光效果，上方气泡显示「用户指南」，点击打开用户指南弹窗
 */
const CompassSticker: React.FC = () => {
    const [showGuide, setShowGuide] = useState(false);

    const compassGlowFilter = useMemo(() =>
        'drop-shadow(0 0 6px #f1c40f) drop-shadow(0 0 12px #e67e22) drop-shadow(0 0 4px #f1c40f)',
        []
    );

    return (
        <>
            <div
                onClick={() => setShowGuide(true)}
                className="tap-scale"
                style={{
                    position: 'absolute',
                    top: '22%',
                    left: '20%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Thought bubble – 用户指南 */}
                <div
                    className="animate-float"
                    style={{
                        background: 'white',
                        padding: '10px 15px',
                        borderRadius: '20px',
                        borderBottomLeftRadius: '0',
                        marginBottom: '10px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    用户指南 💭
                </div>

                {/* Compass sticker with glowing edge */}
                <div
                    className="animate-float"
                    style={{
                        width: 'clamp(72px, 10vw, 120px)',
                        height: 'clamp(72px, 10vw, 120px)',
                        filter: compassGlowFilter,
                        textShadow: '0 0 20px rgba(241, 196, 15, 0.8), 0 0 30px rgba(230, 126, 34, 0.5)',
                        animationDelay: '0.3s',
                    }}
                    title="用户指南 User Guide"
                >
                    <img
                        src="/compass_sticker.png"
                        alt="用户指南"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </div>

            <UserGuideModal
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                contentZh={`🎉 欢迎来到 Festickers！
这是一个专属于节日的互动空间，你可以走进朋友的节日场景，送出贴纸和祝福，一起留下温暖的回忆！

🧭 快速上手指南：
注册登录：账号和密码是确认身份的唯一凭证，请牢记哦！个性头像、个人信息可以在设置中修改~

选择节日主题
在侧边栏切换圣诞 🎄 或春节 🧧 场景。

进入朋友的节日页面
在【寻找好友】界面搜索好友昵称，发送添加请求→等待好友通过→点击好友名字 → 选择他们的节日场景。

发送贴纸祝福
在好友的节日场景中，点击"发祝福"→ 选择贴纸 → 写下你的祝福 → 发送后可以长按拖拽调整送出贴纸的位置，一起装扮好友的界面！

装饰你的节日场景
在自己的页面查看收到的贴纸，长按拖动贴纸重新摆放，保存你的专属布局。收到的信息会在节日当天零点解锁~

✨ 每一张贴纸都承载着一份节日心意，快去探索吧！`}
                contentEn={`🎉 Welcome to Festickers!
A festive space where you can explore friends' scenes, send stickers and blessings, and create warm memories together!

🧭 Quick Start:
Sign up & login: Your account and password are your identity—keep them safe! Update avatar and profile in Settings.

Choose a theme: Switch between Christmas 🎄 and Spring Festival 🧧 in the sidebar.

Visit friends' scenes: In Discover, search by nickname → send a friend request → wait for approval → tap a friend → select their festive scene.

Send sticker blessings: On a friend's scene, tap "发祝福" → pick a sticker → write your wish → send. Long-press to drag and reposition stickers!

Decorate your scene: View received stickers, long-press to drag and rearrange, then save your layout. Messages unlock at midnight on the festival day.

✨ Every sticker carries a festive wish—go explore!`}
            />
        </>
    );
};

export default CompassSticker;
