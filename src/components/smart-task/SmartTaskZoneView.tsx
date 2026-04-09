import { useState, useEffect, useCallback, useMemo } from 'react';
import { AIStatusOrb } from './AIStatusOrb';
import type { OrbMenuItemData } from './OrbMenuItem';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';
import type { AIStatus } from '../../types/ai';
import type { TaskSummary } from '../../types/data';
import type { SmartTaskZoneState } from '../../services/SmartTaskZone';

/**
 * SmartTaskZoneView — 智能任务区 UI 组件
 *
 * 纯展示组件，不包含服务逻辑。根据外部传入的状态渲染三种模式：
 * - 紧凑模式 (compact): AI_Status_Orb + 当前任务摘要文本（多任务轮播）
 * - 确认提示 (confirm_prompt): "是否展开当前任务？" 提示
 * - 展开模式 (expanded): 半透明浮层显示任务详情、AI 对话历史和操作选项
 *
 * 需求: 3.1, 3.2, 3.3, 3.7, 3.10
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface SmartTaskZoneViewProps {
  /** AI 助手当前状态 */
  aiStatus: AIStatus;
  /** 活跃任务列表 */
  tasks: TaskSummary[];
  /** 当前状态机状态 */
  state: SmartTaskZoneState;
  /** AI 实时反馈文本（如"正在搜索..."） */
  aiFeedbackText?: string;
  /** AI 对话历史 */
  conversationHistory?: ConversationMessage[];
  /** 操作按钮回调 */
  onAction?: (actionId: string) => void;
  /** 确认展开回调 */
  onConfirm?: () => void;
  /** 关闭展开模式回调 */
  onDismiss?: () => void;
  /** 轮播间隔（毫秒），默认 3000 */
  carouselIntervalMs?: number;

  // ── Orb Menu props（全部可选，保持向后兼容） ──
  /** Orb 菜单状态机当前状态 */
  orbMenuState?: OrbMenuState;
  /** Orb 菜单项数据列表 */
  orbMenuItems?: OrbMenuItemData[];
  /** 当前聚焦的菜单项 ID */
  focusedItemId?: string | null;
  /** 当前活跃应用 ID */
  activeAppId?: string | null;
  /** 注视菜单项回调 */
  onGazeItem?: (itemId: string) => void;
  /** 注视菜单项结束回调 */
  onGazeItemEnd?: () => void;
  /** 确认选择菜单项回调 */
  onConfirmSelect?: (source: 'nod' | 'emg_pinch' | 'side_touchpad') => void;
  /** 注视 Orb 开始回调 */
  onOrbGazeStart?: () => void;
  /** 注视 Orb 结束回调 */
  onOrbGazeEnd?: () => void;
}

/** 轮播 hook：在多任务间自动切换 */
function useCarousel(itemCount: number, intervalMs: number): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (itemCount <= 1) {
      setIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % itemCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [itemCount, intervalMs]);

  // Clamp index if itemCount shrinks
  return itemCount === 0 ? 0 : index % itemCount;
}

/* ── Inline styles ── */
const S = {
  root: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)',
    userSelect: 'none' as const,
  },

  compact: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    height: '100%',
    boxSizing: 'border-box' as const,
  },

  taskText: {
    fontSize: 12,
    lineHeight: 1.4,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    flex: 1,
    minWidth: 0,
    letterSpacing: 0.2,
  },

  feedbackText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    fontStyle: 'normal' as const,
    marginTop: 2,
    lineHeight: 1.4,
    maxWidth: 320,
    overflow: 'hidden' as const,
    display: '-webkit-box' as const,
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    animation: 'sensible-fade-in 0.3s ease-out',
  },

  userInputText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    fontStyle: 'italic' as const,
    marginTop: 2,
    maxWidth: 320,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    display: '-webkit-box' as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    animation: 'sensible-fade-in 0.3s ease-out',
  },

  phaseLabel: {
    fontSize: 9,
    color: 'rgba(160, 120, 255, 0.7)',
    fontWeight: 600 as const,
    letterSpacing: 0.5,
    marginBottom: 1,
  },

  thinkingDots: {
    fontSize: 11,
    color: 'rgba(160, 120, 255, 0.6)',
    fontStyle: 'italic' as const,
    marginTop: 2,
    letterSpacing: 1,
  },

  greetingTitle: {
    fontSize: 12,
    fontWeight: 600 as const,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1,
    marginBottom: 2,
  },

  greetingSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.3,
  },

  carouselDots: {
    display: 'flex',
    gap: 3,
    marginTop: 3,
  },

  dot: (active: boolean): React.CSSProperties => ({
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: active ? 'rgba(110, 54, 238, 0.9)' : 'rgba(255, 255, 255, 0.2)',
    transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: active ? '0 0 6px rgba(110, 54, 238, 0.3)' : 'none',
  }),

  confirmPrompt: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    height: '100%',
    boxSizing: 'border-box' as const,
  },

  confirmText: {
    fontSize: 12,
    color: 'rgba(255, 180, 60, 0.95)',
    animation: 'stz-blink 1.5s ease-in-out infinite',
  },

  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '70vw',
    maxWidth: 420,
    maxHeight: '80vh',
    background: 'rgba(10, 15, 30, 0.92)',
    backdropFilter: 'blur(20px)',
    borderRadius: '0 0 16px 0',
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    overflowY: 'auto' as const,
    zIndex: 1000,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(110, 54, 238, 0.06)',
    border: '1px solid rgba(110, 54, 238, 0.1)',
  },

  overlayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  overlayTitle: {
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  closeBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(110, 54, 238, 0.12)',
    color: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },

  section: {
    borderTop: '1px solid rgba(110, 54, 238, 0.06)',
    paddingTop: 10,
  },

  sectionTitle: {
    fontSize: 10,
    color: 'rgba(110, 54, 238, 0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 6,
    fontWeight: 600,
  },

  taskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(110, 54, 238, 0.04)',
    marginBottom: 0,
    fontSize: 12,
  },

  taskItemTitle: {
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.92)',
  },

  taskItemStatus: {
    color: 'rgba(110, 54, 238, 0.7)',
    fontSize: 11,
  },

  chatBubble: (isUser: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    borderRadius: 10,
    fontSize: 12,
    lineHeight: 1.5,
    maxWidth: '85%',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    background: isUser ? 'rgba(110, 54, 238, 0.15)' : 'rgba(255, 255, 255, 0.04)',
    borderBottomRightRadius: isUser ? 2 : 10,
    borderBottomLeftRadius: isUser ? 10 : 2,
    border: `1px solid ${isUser ? 'rgba(110, 54, 238, 0.12)' : 'rgba(255, 255, 255, 0.04)'}`,
  }),

  chatContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    maxHeight: 180,
    overflowY: 'auto' as const,
  },

  actionBar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },

  actionBtn: {
    background: 'rgba(110, 54, 238, 0.1)',
    border: '1px solid rgba(110, 54, 238, 0.2)',
    color: 'rgba(110, 54, 238, 0.95)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
  },
};

/* ── Keyframes for confirm prompt blink ── */
const BLINK_KEYFRAMES = `
@keyframes stz-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
@keyframes sensible-fade-in {
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sensible-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
@keyframes sensible-dots {
  0%, 20%  { content: '.'; }
  40%      { content: '..'; }
  60%, 100% { content: '...'; }
}
`;

let blinkInjected = false;
function injectBlinkKeyframes() {
  if (blinkInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = BLINK_KEYFRAMES;
  document.head.appendChild(style);
  blinkInjected = true;
}

/* ── Idle 祝福语池 ── */
const GREETINGS = [
  '万事如意', '心想事成', '一帆风顺', '吉祥如意',
  '平安喜乐', '前程似锦', '步步高升', '好运连连',
  '事事顺心', '福星高照', '鹏程万里', '锦绣前程',
  '春风得意', '如虎添翼', '蒸蒸日上', '大展宏图',
];
function pickGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

/* ── Default action buttons for expanded mode ── */
const DEFAULT_ACTIONS = [
  { id: 'voice_reply', label: '语音回复' },
  { id: 'dismiss_all', label: '全部关闭' },
  { id: 'open_detail', label: '查看详情' },
];

export function SmartTaskZoneView({
  aiStatus,
  tasks,
  state,
  aiFeedbackText,
  conversationHistory = [],
  onAction,
  onConfirm,
  onDismiss,
  carouselIntervalMs = 3000,
  orbMenuState,
  orbMenuItems: _orbMenuItems,
  focusedItemId: _focusedItemId,
  activeAppId,
  onGazeItem: _onGazeItem,
  onGazeItemEnd: _onGazeItemEnd,
  onConfirmSelect: _onConfirmSelect,
  onOrbGazeStart,
  onOrbGazeEnd,
}: SmartTaskZoneViewProps) {
  // Inject blink keyframes once
  useMemo(() => injectBlinkKeyframes(), []);

  // 每次挂载随机选一条祝福语
  const [greeting] = useState(() => pickGreeting());

  const carouselIndex = useCarousel(tasks.length, carouselIntervalMs);

  const handleAction = useCallback(
    (actionId: string) => {
      onAction?.(actionId);
    },
    [onAction],
  );

  /* ── Compact mode — Sensible Response System ── */
  if (state === 'compact') {
    return (
      <div style={S.root} data-testid="smart-task-zone-view" data-state="compact">
        <div style={S.compact}>
          <AIStatusOrb
            status={aiStatus}
            size={40}
            orbMenuState={orbMenuState}
            activeAppId={activeAppId}
            onGazeStart={onOrbGazeStart}
            onGazeEnd={onOrbGazeEnd}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Phase 1: 用户输入确认 — L2 字幕 */}
            {aiStatus === 'listening' && aiFeedbackText && (
              <div>
                <div style={S.phaseLabel}>正在聆听...</div>
                <div style={S.userInputText} data-testid="ai-user-input">
                  {aiFeedbackText}
                </div>
              </div>
            )}

            {/* Phase 2: 思考中 — L1 仅 Orb + 微弱提示 */}
            {aiStatus === 'thinking' && (
              <div>
                <div style={S.phaseLabel}>思考中</div>
                <div style={S.thinkingDots} data-testid="ai-thinking">
                  正在思考...
                </div>
              </div>
            )}

            {/* Phase 3: AI 回复 — L2 字幕流 */}
            {aiStatus === 'responding' && aiFeedbackText && (
              <div>
                <div style={S.phaseLabel}>小Q</div>
                <div style={S.feedbackText} data-testid="ai-feedback-text">
                  {aiFeedbackText}
                </div>
              </div>
            )}

            {/* Phase 4: idle — 祝福语 + 待命提示 */}
            {aiStatus === 'idle' && (
              <div>
                <div style={S.greetingTitle}>{greeting}</div>
                <div style={S.greetingSub}>小Q随时等候主人的吩咐</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Confirm prompt mode ── */
  if (state === 'confirm_prompt') {
    return (
      <div style={S.root} data-testid="smart-task-zone-view" data-state="confirm_prompt">
        <div style={S.confirmPrompt}>
          <AIStatusOrb
            status={aiStatus}
            size={40}
            orbMenuState={orbMenuState}
            activeAppId={activeAppId}
          />
          <div>
            <div style={S.confirmText} data-testid="confirm-prompt-text">
              是否展开当前任务？
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              点头或捏合确认
            </div>
            {onConfirm && (
              <button
                style={{ ...S.closeBtn, marginTop: 4, fontSize: 10 }}
                onClick={onConfirm}
                data-testid="confirm-btn"
              >
                确认展开
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Expanded mode — 需求 3.7 ── */
  return (
    <div style={S.root} data-testid="smart-task-zone-view" data-state="expanded">
      <div style={S.overlay} data-testid="expanded-overlay">
        {/* Header */}
        <div style={S.overlayHeader}>
          <div style={S.overlayTitle}>
            <AIStatusOrb
              status={aiStatus}
              size={24}
              orbMenuState={orbMenuState}
              activeAppId={activeAppId}
            />
            <span>智能任务区</span>
          </div>
          {onDismiss && (
            <button style={S.closeBtn} onClick={onDismiss} data-testid="dismiss-btn">
              收起
            </button>
          )}
        </div>

        {/* AI 实时反馈 — 需求 3.3 */}
        {aiFeedbackText && (
          <div style={S.feedbackText} data-testid="ai-feedback-text">
            {aiFeedbackText}
          </div>
        )}

        {/* 任务列表 */}
        <div style={S.section}>
          <div style={S.sectionTitle}>活跃任务</div>
          {tasks.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>暂无活跃任务</div>
          ) : (
            tasks.map((task) => (
              <div key={task.taskId} style={S.taskItem} data-testid="task-item">
                <div>
                  <div style={S.taskItemTitle}>{task.title}</div>
                  <div style={S.taskItemStatus}>{task.statusText}</div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{task.source}</div>
              </div>
            ))
          )}
        </div>

        {/* AI 对话历史 */}
        {conversationHistory.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>AI 对话</div>
            <div style={S.chatContainer} data-testid="conversation-history">
              {conversationHistory.map((msg, i) => (
                <div key={i} style={S.chatBubble(msg.role === 'user')}>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作选项 */}
        <div style={S.section}>
          <div style={S.sectionTitle}>操作</div>
          <div style={S.actionBar}>
            {DEFAULT_ACTIONS.map((action) => (
              <button
                key={action.id}
                style={S.actionBtn}
                onClick={() => handleAction(action.id)}
                data-testid={`action-${action.id}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
