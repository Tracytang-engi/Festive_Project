import React, { useState, useEffect } from 'react';
import { getFriends } from '../../api/friends';
import { sendMessage } from '../../api/messages';
import StickerIcon from '../StickerIcon';
import TipModal from '../TipModal';
import { getStickersForScene, getStickersByCategory, SPRING_STICKER_CATEGORIES, SPRING_CATEGORY_ICONS } from '../../constants/stickers';
import { CHRISTMAS_SCENE_IDS, SCENE_ICONS, getSceneName } from '../../constants/scenes';
import type { User } from '../../types';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSeason?: 'christmas' | 'spring';
    /** When set, recipient is fixed to this friend (e.g. when opened from friend's homepage). */
    preselectedFriendId?: string;
    /** Hide the "To" friend selector (use with preselectedFriendId). */
    hideFriendSelect?: boolean;
    /** When set, only show sticker picker + message for this scene (opened on friend's scene page). */
    fixedSceneId?: string;
    /** When user chooses a scene (category) from the first step, call this then close (navigate to friend's scene). */
    onSceneChosen?: (sceneId: string) => void;
    /** 发送成功后调用（用于好友页刷新场景数据，让发送者看到刚发的贴纸） */
    onSentSuccess?: () => void;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, initialSeason = 'christmas', preselectedFriendId, hideFriendSelect = false, fixedSceneId, onSceneChosen, onSentSuccess }) => {
    const [friends, setFriends] = useState<User[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<string>('');
    const [season, setSeason] = useState<'christmas' | 'spring'>(initialSeason);
    /** 圣诞：选中的场景 id。春节：选中的分类 id（eve_dinner/couplets/...），null = 显示一级菜单 */
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [sticker, setSticker] = useState<string>('🎄');
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSentSuccess, setShowSentSuccess] = useState(false);
    const [tip, setTip] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    const sceneIds = season === 'spring' ? SPRING_STICKER_CATEGORIES.map(c => c.id) : [...CHRISTMAS_SCENE_IDS];
    const defaultSceneId = season === 'spring' ? 'spring_dinner' : 'xmas_1';

    useEffect(() => {
        if (isOpen) {
            setShowSentSuccess(false);
            loadFriends();
            setSeason(initialSeason);
            if (fixedSceneId && sceneIdToCategory[fixedSceneId]) {
                setSelectedSceneId(sceneIdToCategory[fixedSceneId]);
            } else {
                setSelectedSceneId(null);
            }
            if (preselectedFriendId) setSelectedFriend(preselectedFriendId);
            if (initialSeason === 'spring') {
                setSticker('');
            } else {
                const list = getStickersForScene('christmas', CHRISTMAS_SCENE_IDS[0]);
                setSticker(list[0] ?? '🎄');
            }
        }
    }, [isOpen, initialSeason, preselectedFriendId, fixedSceneId]);

    useEffect(() => {
        if (!isOpen) return;
        if (season === 'spring') {
            // 春节：进入分类时不自动选中任何贴纸，由用户点击选择
            if (selectedSceneId) setSticker('');
        } else {
            const scene = selectedSceneId ?? CHRISTMAS_SCENE_IDS[0];
            const list = getStickersForScene('christmas', scene);
            setSticker(list[0] ?? '🎄');
        }
    }, [season, selectedSceneId, isOpen]);

    const loadFriends = async () => {
        try {
            const list = await getFriends();
            setFriends(list);
            if (!preselectedFriendId) setSelectedFriend(list.length > 0 ? list[0]._id : '');
        } catch (err) {
            console.error("Failed to load friends", err);
        }
    };

    /** 春节分类 id → 后端 sceneId（用于发送） */
    const springCategoryToSceneId: Record<string, string> = {
        eve_dinner: 'spring_dinner',
        couplets: 'spring_couplets',
        temple_fair: 'spring_temple_fair',
        fireworks: 'spring_firecrackers',
    };
    /** 后端 sceneId → 春节分类 id（用于 fixedSceneId 时显示贴纸列表） */
    const sceneIdToCategory: Record<string, string> = {
        spring_dinner: 'eve_dinner',
        spring_couplets: 'couplets',
        spring_temple_fair: 'temple_fair',
        spring_firecrackers: 'fireworks',
    };

    const handleSend = async () => {
        if (!selectedFriend) {
            return setTip({
                show: true,
                message: friends.length === 0
                    ? '请先添加好友 Add friends first.'
                    : '请先选择一位好友 Select a friend first.',
            });
        }
        if (!content.trim()) {
            return setTip({ show: true, message: '请写一句祝福 Write a message!' });
        }
        if (season === 'spring' && (!selectedSceneId || !sticker)) {
            return setTip({ show: true, message: '请先选择分类并选择一张贴纸 Choose a category and a sticker first.' });
        }
        // 后端与展示均用场景 id（spring_dinner 等）；fixedSceneId 来自 URL 可能是分类 id（eve_dinner），需转换
        const sceneId = fixedSceneId
            ? (springCategoryToSceneId[fixedSceneId] ?? fixedSceneId)
            : season === 'spring'
                ? (selectedSceneId ? springCategoryToSceneId[selectedSceneId] ?? defaultSceneId : defaultSceneId)
                : (selectedSceneId ?? defaultSceneId);

        setLoading(true);
        try {
            await sendMessage({
                recipientId: selectedFriend,
                stickerType: sticker,
                content,
                season,
                sceneId,
                isPrivate,
            });
            onSentSuccess?.();
            setContent('');
            setShowSentSuccess(true);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || '发送失败，请重试';
            setTip({ show: true, message: typeof msg === 'string' ? msg : '发送失败，请重试 Send failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    /** From friend's page: first step = choose scene only; on category click navigate to friend's scene. */
    const sceneOnlyStep = !!(hideFriendSelect && preselectedFriendId && onSceneChosen);
    const showScenePicker = fixedSceneId ? false : selectedSceneId === null;
    const categoryForStickers = fixedSceneId ? (sceneIdToCategory[fixedSceneId] ?? 'eve_dinner') : selectedSceneId;
    const stickers = season === 'spring'
        ? (categoryForStickers ? getStickersByCategory(categoryForStickers) : [])
        : getStickersForScene(season, selectedSceneId ?? defaultSceneId);

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {showSentSuccess ? (
                    <>
                        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', lineHeight: 1 }}>✅</div>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>
                                发送成功！ <span className="bilingual-en">Sent!</span>
                            </p>
                            <p style={{ margin: '14px 0 0', padding: '12px 14px', background: 'rgba(0,122,255,0.08)', borderRadius: '10px', fontSize: '15px', fontWeight: 500, color: '#007AFF', lineHeight: 1.5 }}>
                                可以在好友页面装饰贴纸 <span className="bilingual-en">You can decorate stickers on the friend's page</span>
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ios-btn tap-scale"
                            onClick={() => { setShowSentSuccess(false); onClose(); }}
                            style={{ width: '100%', padding: '12px', background: 'var(--ios-blue)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', fontWeight: 500 }}
                        >
                            知道了 <span className="bilingual-en">Got it</span>
                        </button>
                    </>
                ) : (
                <>
                <div style={styles.headerRow}>
                    <h3 style={styles.title}>发送节日祝福 <span className="bilingual-en">Send a Festive Greeting</span></h3>
                    <button
                        type="button"
                        onClick={onClose}
                        style={styles.headerCancelBtn}
                    >
                        取消
                    </button>
                </div>

                {!hideFriendSelect && (
                    <>
                        <label style={styles.label}>发送给 <span className="bilingual-en">To</span></label>
                        <select value={selectedFriend} onChange={e => setSelectedFriend(e.target.value)} className="ios-input" style={styles.input}>
                            {friends.map(f => (
                                <option key={f._id} value={f._id}>{f.nickname} ({f.region ?? '未设置地区'})</option>
                            ))}
                        </select>
                    </>
                )}
                {hideFriendSelect && friends.length > 0 && (
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        发送给 <span className="bilingual-en">To</span>: <strong>{friends.find(f => f._id === selectedFriend)?.nickname ?? selectedFriend}</strong>
                    </p>
                )}

                {!sceneOnlyStep && !fixedSceneId && (
                    <>
                        <label style={styles.label}>季节 Season</label>
                        <div className="ios-segmented ios-segmented-bilingual" style={styles.toggles}>
                            <button className={season === 'christmas' ? 'active' : ''} onClick={() => { setSeason('christmas'); setSelectedSceneId(null); }}>圣诞 <span className="tab-en">Christmas</span></button>
                            <button className={season === 'spring' ? 'active' : ''} onClick={() => { setSeason('spring'); setSelectedSceneId(null); }}>春节 <span className="tab-en">Spring</span></button>
                        </div>
                    </>
                )}

                {sceneOnlyStep ? (
                    <>
                        <label style={styles.label}>选择场景 <span className="bilingual-en">Choose the scene to give stickers</span></label>
                        <div style={styles.sceneGrid}>
                            {SPRING_STICKER_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className="tap-scale"
                                    style={styles.sceneBtn}
                                    onClick={() => {
                                        const sceneId = springCategoryToSceneId[cat.id];
                                        onSceneChosen?.(sceneId);
                                        onClose();
                                    }}
                                >
                                    <span style={{ fontSize: '28px', marginBottom: '4px' }}>{SPRING_CATEGORY_ICONS[cat.id] ?? '📁'}</span>
                                    <span style={{ fontSize: '12px', color: '#333' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <label style={styles.label}>{showScenePicker ? <>选择分类 <span className="bilingual-en">Choose Category</span></> : <>选择贴纸 <span className="bilingual-en">Choose Sticker</span></>}</label>
                        {showScenePicker ? (
                            <div style={styles.sceneGrid}>
                                {sceneIds.map(sid => {
                                    if (season === 'spring') {
                                        const cat = SPRING_STICKER_CATEGORIES.find(c => c.id === sid);
                                        if (!cat) return null;
                                        return (
                                            <button
                                                key={sid}
                                                type="button"
                                                className="tap-scale"
                                                style={styles.sceneBtn}
                                                onClick={() => setSelectedSceneId(sid)}
                                            >
                                                <span style={{ fontSize: '28px', marginBottom: '4px' }}>{SPRING_CATEGORY_ICONS[sid] ?? '📁'}</span>
                                                <span style={{ fontSize: '12px', color: '#333' }}>{cat.name}</span>
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            key={sid}
                                            type="button"
                                            className="tap-scale"
                                            style={styles.sceneBtn}
                                            onClick={() => setSelectedSceneId(sid)}
                                        >
                                            <span style={{ fontSize: '28px', marginBottom: '4px' }}>{SCENE_ICONS[sid] ?? '📁'}</span>
                                            <span style={{ fontSize: '12px', color: '#333' }}>{getSceneName(sid)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                {!fixedSceneId && (
                                    <button type="button" onClick={() => setSelectedSceneId(null)} style={styles.backBtn}>
                                        ← 换分类 <span className="bilingual-en">Change category</span>
                                    </button>
                                )}
                                <div style={styles.stickersWrap}>
                                    <div style={styles.stickers}>
                                        {stickers.map(s => (
                                            <span
                                                key={s}
                                                className="tap-scale"
                                                style={{ ...styles.sticker, border: sticker === s ? '2px solid #007AFF' : 'none', background: sticker === s ? 'rgba(0,122,255,0.08)' : 'transparent' }}
                                                onClick={() => setSticker(s)}
                                            >
                                                <StickerIcon stickerType={s} size={84} />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {!showScenePicker && !sceneOnlyStep && (
                    <>
                        <label style={styles.label}>
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={e => setIsPrivate(e.target.checked)}
                                style={{ marginRight: '8px' }}
                            />
                            私密消息（仅你和对方可见内容，贴纸对所有人可见） <span className="bilingual-en">Private</span>
                        </label>
                        <label style={styles.label}>留言 <span className="bilingual-en">Message</span></label>
                        <textarea
                            placeholder="写下祝福... Write your warm wishes..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            style={styles.textarea}
                        />

                        <div style={styles.actions}>
                            <button className="ios-btn tap-scale" onClick={onClose} style={styles.cancelBtn}>取消 <span className="bilingual-en">Cancel</span></button>
                            <button className="ios-btn tap-scale" onClick={handleSend} disabled={loading} style={styles.sendBtn}>
                                {loading ? <>发送中... <span className="bilingual-en">Sending...</span></> : <>发送祝福 <span className="bilingual-en">Send Wishes</span></>}
                            </button>
                        </div>
                    </>
                )}
                </>
                )}
            </div>
            <TipModal show={tip.show} message={tip.message} onClose={() => setTip(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
        backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '540px',
        display: 'flex', flexDirection: 'column', gap: '16px', color: '#333',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
    },
    title: { margin: 0, fontSize: '20px', fontWeight: 600 },
    headerCancelBtn: {
        border: 'none',
        background: 'transparent',
        color: '#8e8e93',
        fontSize: '14px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '8px',
    },
    label: { fontSize: '13px', color: '#8e8e93', fontWeight: 500 },
    input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(60,60,67,0.12)', fontSize: '16px', width: '100%', boxSizing: 'border-box' as const },
    toggles: { display: 'flex', gap: '8px' },
    sceneGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
    sceneBtn: {
        width: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '12px 8px', borderRadius: '12px', border: '1px solid rgba(60,60,67,0.12)', background: '#f9f9f9',
        cursor: 'pointer', transition: 'background 0.2s'
    },
    backBtn: {
        alignSelf: 'flex-start', padding: '6px 12px', border: 'none', borderRadius: '8px', background: '#f2f2f7',
        cursor: 'pointer', fontSize: '13px', color: '#333'
    },
    stickersWrap: { maxHeight: '200px', overflowY: 'auto', padding: '4px 0' },
    stickers: { display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '8px 0' },
    sticker: { cursor: 'pointer', padding: '8px', borderRadius: '12px', transition: 'background 0.2s', flexShrink: 0 },
    textarea: { padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(60,60,67,0.12)', minHeight: '100px', fontSize: '16px', fontFamily: 'inherit' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
    cancelBtn: { padding: '10px 18px', background: '#f2f2f7', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500 },
    sendBtn: { padding: '10px 18px', background: '#FF3B30', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500, transition: 'opacity 0.2s' }
};

export default ComposeModal;
