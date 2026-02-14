import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';

const OVERLAY_Z = 10000;

function useTargetRect(selector: string | null): DOMRect | null {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const step = useOnboarding()?.step;

    useEffect(() => {
        if (!selector) {
            setRect(null);
            return;
        }
        let cancelled = false;
        let teardown: (() => void) | null = null;
        const setup = (el: Element) => {
            const update = () => setRect(el.getBoundingClientRect());
            update();
            const ro = new ResizeObserver(update);
            ro.observe(el);
            window.addEventListener('scroll', update, true);
            return () => {
                ro.disconnect();
                window.removeEventListener('scroll', update, true);
            };
        };

        const tryAttach = () => {
            if (cancelled) return;
            const el = document.querySelector(selector);
            if (el) {
                teardown = setup(el);
            }
        };

        tryAttach();
        if (!teardown) setRect(null);
        const t1 = setTimeout(tryAttach, 150);
        const t2 = setTimeout(tryAttach, 450);
        return () => {
            cancelled = true;
            clearTimeout(t1);
            clearTimeout(t2);
            teardown?.();
        };
    }, [selector, step]);

    return rect;
}

/** 高亮目标 + 一侧文案 */
function ArrowTooltip({
    targetRect,
    text,
    placement = 'right',
}: {
    targetRect: DOMRect | null;
    text: string;
    placement?: 'right' | 'left' | 'bottom';
}) {
    if (!targetRect) return null;

    const padding = 12;
    let boxLeft = targetRect.left + targetRect.width / 2 - 120;
    let boxTop = targetRect.top - 56;
    if (placement === 'right') {
        boxLeft = targetRect.right + 16;
        boxTop = targetRect.top + targetRect.height / 2 - 24;
    } else if (placement === 'left') {
        boxLeft = targetRect.left - 240 - 16;
        boxTop = targetRect.top + targetRect.height / 2 - 24;
    } else if (placement === 'bottom') {
        boxLeft = targetRect.left + targetRect.width / 2 - 120;
        boxTop = targetRect.bottom + 16;
    }

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    left: targetRect.left - padding,
                    top: targetRect.top - padding,
                    width: targetRect.width + padding * 2,
                    height: targetRect.height + padding * 2,
                    border: '3px solid rgba(255,255,255,0.95)',
                    borderRadius: '14px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    zIndex: OVERLAY_Z + 1,
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    left: Math.max(16, Math.min(boxLeft, window.innerWidth - 260)),
                    top: Math.max(16, Math.min(boxTop, window.innerHeight - 80)),
                    maxWidth: '260px',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    color: '#1d1d1f',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: 500,
                    lineHeight: 1.45,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    pointerEvents: 'none',
                    zIndex: OVERLAY_Z + 2,
                }}
            >
                {text ?? ''}
            </div>
        </>
    );
}

function Backdrop() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: OVERLAY_Z,
                background: 'rgba(0,0,0,0.4)',
                pointerEvents: 'none',
            }}
        />
    );
}

/** 每步都显示的「跳过」：点击后直接结束新手指引（左上角，避免与右侧发祝福等重合） */
function SkipButton({ onSkip }: { onSkip: () => void }) {
    return (
        <button
            type="button"
            onClick={onSkip}
            style={{
                position: 'fixed',
                top: 16,
                left: 100,
                zIndex: OVERLAY_Z + 10,
                padding: '8px 14px',
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#666',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
        >
            跳过新手指引
        </button>
    );
}

/** 欢迎弹窗：说明第一步添加好友、第二步查看好友发贴纸 */
function WelcomeModal({ onNext }: { onNext: () => void }) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: OVERLAY_Z,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.55)',
                padding: '24px',
            }}
            onClick={onNext}
        >
            <div
                className="tap-scale"
                style={{
                    maxWidth: '380px',
                    width: '100%',
                    padding: '28px 24px',
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    borderRadius: '20px',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
                    color: '#1d1d1f',
                    textAlign: 'center',
                    cursor: 'pointer',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <p style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 600, lineHeight: 1.5 }}>
                    欢迎来到 festickers！
                </p>
                <p style={{ margin: '0 0 12px', fontSize: '15px', color: '#333', lineHeight: 1.6 }}>
                    这是一个节日贴纸网站，快来为好友送上祝福吧！
                </p>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                    第一步：添加好友 → 第二步：查看好友、进入节日场景、发送贴纸。
                </p>
                <button
                    type="button"
                    className="ios-btn tap-scale"
                    onClick={onNext}
                    style={{
                        padding: '12px 28px',
                        background: 'var(--ios-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    开始指引
                </button>
            </div>
        </div>
    );
}

export default function OnboardingOverlay() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const onboarding = useOnboarding();
    const path = location.pathname;
    const step = onboarding?.step ?? 'done';
    const isFriendDecorPath = /^\/friend\/[^/]+\/decor$/.test(path);
    const isInSceneView = isFriendDecorPath && !!searchParams.get('scene');

    const targetDiscover = useTargetRect('[data-onboarding-target="discover"]');
    const targetMyFriends = useTargetRect('[data-onboarding-target="my-friends"]');
    const targetFriendCard = useTargetRect('[data-onboarding-target="friend-card"]');
    const targetDecorChooseScene = useTargetRect(isFriendDecorPath ? '[data-onboarding-target="decor-choose-scene"]' : null);
    const targetDecorChooseSceneWrap = useTargetRect(isFriendDecorPath ? '[data-onboarding-target="decor-choose-scene-wrap"]' : null);
    const targetFriendsListWrap = useTargetRect('[data-onboarding-target="friends-list-wrap"]');
    const targetComposeBtn = useTargetRect('[data-onboarding-target="compose-btn"]');
    const targetStickerArea = useTargetRect('[data-onboarding-target="sticker-area"]');
    const targetComposeStickerGrid = useTargetRect('[data-onboarding-target="compose-sticker-grid"]');

    if (!onboarding || !onboarding.isActive) return null;

    const { nextStep, completeOnboarding } = onboarding;
    const skip = () => <SkipButton onSkip={completeOnboarding} />;

    // ——— 欢迎（仅首页）
    if (step === 'welcome' && path === '/') {
        return createPortal(
            <>
                <SkipButton onSkip={completeOnboarding} />
                <WelcomeModal onNext={nextStep} />
            </>,
            document.body
        );
    }

    // ——— 第一步：添加好友 ———

    // 1.1 箭头指「发现」，点击进入发现页
    if (step === 'point_discover') {
        return createPortal(
            <>
                <Backdrop />
                {skip()}
                <ArrowTooltip targetRect={targetDiscover} text="第一步：添加好友。点击这里进入发现页。" placement="right" />
            </>,
            document.body
        );
    }

    // 1.2 在发现页：显示「可以在这里查找好友」，直接指引进入我的好友（无需加好友）
    if (step === 'discover_search' && path === '/discover') {
        return createPortal(
            <>
                <Backdrop />
                {skip()}
                <ArrowTooltip
                    targetRect={targetMyFriends}
                    text="可以在这里查找好友。点击左侧「我的好友」进入好友列表。"
                    placement="right"
                />
            </>,
            document.body
        );
    }

    // ——— 第二步：查看 My Friends → inner circle → 发贴纸 → 退出 ———

    // 2.1 箭头指「我的好友」
    if (step === 'point_my_friends') {
        const onDiscover = path === '/discover';
        const text = onDiscover
            ? '好友请求已发送！点击这里进入「我的好友」继续。'
            : '第二步：查看好友。点击这里进入「我的好友」。';
        return createPortal(
            <>
                <Backdrop />
                {skip()}
                <ArrowTooltip targetRect={targetMyFriends} text={text} placement="right" />
            </>,
            document.body
        );
    }

    // 2.2 在好友页：点击好友卡片进入 inner circle（透明+阴影 spotlight + 操作提示框）
    if (step === 'friends_enter_inner' && path === '/friends') {
        const tipText = targetFriendCard
            ? '点击好友卡片，进入 TA 的节日场景（inner circle）。'
            : '添加好友后这里会显示好友列表，点击好友卡片即可进入 TA 的节日场景。';
        const friendsRect = targetFriendCard ?? targetFriendsListWrap;
        return createPortal(
            <>
                <Backdrop />
                {skip()}
                {friendsRect && (
                    <ArrowTooltip targetRect={friendsRect} text={tipText} placement="right" />
                )}
            </>,
            document.body
        );
    }

    // 2.3 在好友装饰页「选择场景」界面：透明+阴影 spotlight + 操作提示框（必有指引）
    const isSceneSelectionScreen = isFriendDecorPath && !isInSceneView;
    const chooseSceneText = '先点击「选择场景查看」，再点一个场景进入；进入后即可发祝福、拖贴纸。';
    if ((step === 'decor_choose_scene' || (step === 'decor_send_drag' && isSceneSelectionScreen)) && isFriendDecorPath) {
        const chooseSceneRect = targetDecorChooseScene ?? targetDecorChooseSceneWrap;
        return createPortal(
            <>
                <Backdrop />
                {skip()}
                {chooseSceneRect ? (
                    <ArrowTooltip
                        targetRect={chooseSceneRect}
                        text={chooseSceneText}
                        placement="bottom"
                    />
                ) : (
                    <div
                        style={{
                            position: 'fixed',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '320px',
                            padding: '20px 24px',
                            background: 'rgba(255,255,255,0.75)',
                            backdropFilter: 'saturate(180%) blur(20px)',
                            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                            color: '#1d1d1f',
                            borderRadius: '16px',
                            fontSize: '15px',
                            lineHeight: 1.5,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                            zIndex: OVERLAY_Z + 2,
                            pointerEvents: 'none',
                            textAlign: 'center',
                        }}
                    >
                        {chooseSceneText}
                    </div>
                )}
            </>,
            document.body
        );
    }

    // 2.4 在场景内（已选场景）：发祝福、拖贴纸
    if (step === 'decor_send_drag' && isFriendDecorPath && isInSceneView) {
        const showComposeTip = !!targetComposeBtn;
        const stickerRect = targetStickerArea;
        const showStickerGridTip = !!targetComposeStickerGrid;

        return createPortal(
            <>
                <Backdrop />
                {skip()}
                {showComposeTip && !showStickerGridTip && (
                    <ArrowTooltip
                        targetRect={targetComposeBtn}
                        text="点击「发祝福」选择贴纸并写下祝福发送给好友。"
                        placement="left"
                    />
                )}
                {showStickerGridTip && (
                    <ArrowTooltip
                        targetRect={targetComposeStickerGrid}
                        text="已默认选中第一个贴纸，可点击其他贴纸更换；写下祝福语后点击「发送祝福」。"
                        placement="left"
                    />
                )}
                {stickerRect && (
                    <div
                        style={{
                            position: 'fixed',
                            left: Math.max(16, stickerRect.left - 8),
                            top: stickerRect.bottom + 12,
                            maxWidth: '280px',
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.75)',
                            backdropFilter: 'saturate(180%) blur(20px)',
                            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                            color: '#1d1d1f',
                            borderRadius: '12px',
                            fontSize: '14px',
                            lineHeight: 1.5,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            zIndex: OVERLAY_Z + 2,
                            pointerEvents: 'none',
                        }}
                    >
                        长按贴纸可拖拽调整位置。
                    </div>
                )}
                <div
                    style={{
                        position: 'fixed',
                        bottom: '32px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: OVERLAY_Z + 3,
                        pointerEvents: 'auto',
                    }}
                >
                    <button
                        type="button"
                        className="ios-btn tap-scale"
                        onClick={completeOnboarding}
                        style={{
                            padding: '14px 32px',
                            background: 'var(--ios-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '14px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(0,122,255,0.4)',
                        }}
                    >
                        完成新手指引
                    </button>
                </div>
            </>,
            document.body
        );
    }

    return null;
}
