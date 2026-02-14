import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'festickers_onboarding_step';

/** 第一步：添加好友（多步骤）→ 第二步：查看 My Friends → inner circle → 发贴纸 */
export type OnboardingStep =
    | 'welcome'              // 欢迎语，点击继续
    | 'point_discover'       // 箭头指「发现」，点击进入发现页添加好友
    | 'discover_search'      // 在发现页：输入昵称并搜索
    | 'discover_click_add'   // 在发现页：有结果时，点击「添加」发送请求
    | 'point_my_friends'     // 箭头指「我的好友」，点击查看好友
    | 'friends_enter_inner'  // 在好友页：点击好友卡片进入 inner circle
    | 'decor_choose_scene'   // 在好友装饰页：选择场景进入
    | 'decor_send_drag'      // 在场景内：发祝福、拖贴纸、指引退出
    | 'done';

const STEP_ORDER: OnboardingStep[] = [
    'welcome',
    'point_discover',
    'discover_search',
    'discover_click_add',
    'point_my_friends',
    'friends_enter_inner',
    'decor_choose_scene',
    'decor_send_drag',
    'done',
];

function readStoredStep(): OnboardingStep {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v != null && v !== '' && v !== 'undefined' && STEP_ORDER.includes(v as OnboardingStep)) {
            return v as OnboardingStep;
        }
    } catch {}
    return 'welcome';
}

function writeStoredStep(step: OnboardingStep) {
    try {
        localStorage.setItem(STORAGE_KEY, step);
    } catch {}
}

type OnboardingContextValue = {
    step: OnboardingStep;
    nextStep: () => void;
    completeOnboarding: () => void;
    isActive: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [step, setStepState] = useState<OnboardingStep>(readStoredStep);
    const location = useLocation();
    const setStep = useCallback((s: OnboardingStep) => {
        setStepState(s);
        writeStoredStep(s);
    }, []);

    const nextStep = useCallback(() => {
        const idx = STEP_ORDER.indexOf(step);
        if (idx < 0 || idx >= STEP_ORDER.length - 1) {
            setStep('done');
            return;
        }
        setStep(STEP_ORDER[idx + 1]);
    }, [step]);

    const completeOnboarding = useCallback(() => {
        setStep('done');
    }, []);

    // 根据路由与 URL 自动推进步骤
    useEffect(() => {
        if (step === 'done') return;
        const path = location.pathname;

        // 点击了「发现」进入发现页（发现页只提示「可以在这里查找好友」，然后引导去我的好友）
        if (step === 'point_discover' && path === '/discover') {
            setStep('discover_search');
            return;
        }

        // 从发现页点击「我的好友」进入好友页，或从 point_my_friends 进入
        if ((step === 'discover_search' || step === 'point_my_friends') && path === '/friends') {
            setStep('friends_enter_inner');
            return;
        }

        // 点击好友卡片进入装饰页
        if (step === 'friends_enter_inner' && path.match(/^\/friend\/[^/]+\/decor$/)) {
            setStep('decor_choose_scene');
            return;
        }

        // 选择场景进入由 FriendDecorPage 内点击场景时调用 nextStep 推进
    }, [step, location.pathname]);

    const isActive = step !== 'done';

    return (
        <OnboardingContext.Provider
            value={{
                step,
                nextStep,
                completeOnboarding,
                isActive,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    return useContext(OnboardingContext);
}
