import { useState, useCallback, useMemo } from 'react';
import { AIStatusOrb } from '../smart-task/AIStatusOrb';
import type { AIStatus } from '../../types/ai';
import { Icon } from '../icons/Icon';

/**
 * AIAssistantView — AI 语音助手交互界面
 *
 * 语音助手激活时显示在视野中的交互界面：
 * - 集成 AI_Status_Orb 反映当前 AI 状态
 * - 语音输入可视化（波形指示器）
 * - 对话历史（用户输入和 AI 响应）
 * - 处理中反馈（"正在思考..."等）
 * - 文本输入回退（Demo 交互用）
 * - 仅在助手激活时可见（非 idle 状态）
 *
 * 需求: 8.4
 */

export interface ConversationEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  confidence?: number;
  needsConfirmation?: boolean;
}

export interface AIAssistantViewProps {
  /** AI 助手当前状态 */
  status: AIStatus;
  /** 对话历史 */
  conversation: ConversationEntry[];
  /** 处理中反馈文本 */
  processingText?: string;
  /** 文本输入提交回调 */
  onTextSubmit?: (text: string) => void;
  /** 停用助手回调 */
  onDeactivate?: () => void;
  /** 确认回调（低置信度时） */
  onConfirm?: () => void;
  /** 重新输入回调（低置信度时） */
  onRetry?: () => void;
}

/* ── Status label mapping ── */
const STATUS_LABELS: Record<AIStatus, string> = {
  idle: '待机',
  listening: '聆听中...',
  thinking: '正在思考...',
  responding: '回复中',
};

/* ── Voice waveform bar count ── */
const WAVEFORM_BAR_COUNT = 12;

/* ── CSS keyframes ── */
const KEYFRAMES = `
@keyframes ai-view-wave {
  0%, 100% { height: 4px; }
  50%      { height: 20px; }
}
@keyframes ai-view-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ai-view-dots {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
`;

let stylesInjected = false;
function injectKeyframes() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  stylesInjected = true;
}

/* ── Inline styles ── */
const S = {
  overlay: {
    position: 'fixed' as const,
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90vw',
    maxWidth: 400,
    maxHeight: '60vh',
    background: 'rgba(10, 15, 30, 0.94)',
    backdropFilter: 'blur(24px)',
    borderRadius: 20,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    zIndex: 2000,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(100, 200, 255, 0.04)',
    border: '1px solid rgba(100, 200, 255, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)',
    animation: 'ai-view-fade-in 0.25s cubic-bezier(0, 0, 0.2, 1)',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  statusLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(100, 200, 255, 0.9)',
  },

  closeBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(100, 200, 255, 0.12)',
    color: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },

  waveformContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 32,
    padding: '4px 0',
  },

  waveformBar: (index: number): React.CSSProperties => ({
    width: 3,
    height: 4,
    borderRadius: 2,
    background: 'rgba(80, 220, 160, 0.8)',
    animation: `ai-view-wave 0.8s ease-in-out ${index * 0.07}s infinite`,
  }),

  waveformBarInactive: {
    width: 3,
    height: 4,
    borderRadius: 2,
    background: 'rgba(255, 255, 255, 0.08)',
  },

  conversationArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxHeight: 200,
    overflowY: 'auto' as const,
    padding: '4px 0',
  },

  bubble: (isUser: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: '85%',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    background: isUser ? 'rgba(100, 200, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
    borderBottomRightRadius: isUser ? 3 : 12,
    borderBottomLeftRadius: isUser ? 12 : 3,
    border: `1px solid ${isUser ? 'rgba(100, 200, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)'}`,
  }),

  confirmBadge: {
    fontSize: 11,
    color: 'rgba(255, 180, 60, 0.9)',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },

  processingText: {
    fontSize: 12,
    color: 'rgba(180, 130, 255, 0.9)',
    textAlign: 'center' as const,
    padding: '4px 0',
    fontStyle: 'italic' as const,
  },

  processingDot: (index: number): React.CSSProperties => ({
    display: 'inline-block',
    animation: `ai-view-dots 1.4s ease-in-out ${index * 0.2}s infinite`,
  }),

  inputArea: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },

  textInput: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(100, 200, 255, 0.12)',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.92)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },

  sendBtn: {
    background: 'rgba(100, 200, 255, 0.15)',
    border: '1px solid rgba(100, 200, 255, 0.3)',
    color: 'rgba(100, 200, 255, 0.95)',
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s, border-color 0.15s',
  },

  confirmBar: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },

  confirmBtn: {
    background: 'rgba(80, 220, 160, 0.12)',
    border: '1px solid rgba(80, 220, 160, 0.3)',
    color: 'rgba(80, 220, 160, 0.95)',
    borderRadius: 8,
    padding: '6px 16px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  retryBtn: {
    background: 'rgba(255, 180, 60, 0.1)',
    border: '1px solid rgba(255, 180, 60, 0.25)',
    color: 'rgba(255, 180, 60, 0.95)',
    borderRadius: 8,
    padding: '6px 16px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  emptyHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center' as const,
    padding: '12px 0',
  },
};

export function AIAssistantView({
  status,
  conversation,
  processingText,
  onTextSubmit,
  onDeactivate,
  onConfirm,
  onRetry,
}: AIAssistantViewProps) {
  // Inject keyframes once
  useMemo(() => injectKeyframes(), []);

  const [inputText, setInputText] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !onTextSubmit) return;
    onTextSubmit(trimmed);
    setInputText('');
  }, [inputText, onTextSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // 需求 8.4: 仅在助手激活时显示（非 idle）
  if (status === 'idle') {
    return null;
  }

  // Check if the last assistant message needs confirmation
  const lastEntry = conversation.length > 0 ? conversation[conversation.length - 1] : null;
  const showConfirmBar =
    lastEntry?.role === 'assistant' && lastEntry.needsConfirmation && status !== 'thinking';

  return (
    <div
      data-testid="ai-assistant-view"
      data-status={status}
      role="dialog"
      aria-label="AI 语音助手"
      style={S.overlay}
    >
      {/* Header: Orb + status label + close */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <AIStatusOrb status={status} size={32} />
          <span style={S.statusLabel} data-testid="status-label">
            {STATUS_LABELS[status]}
          </span>
        </div>
        {onDeactivate && (
          <button
            style={S.closeBtn}
            onClick={onDeactivate}
            data-testid="deactivate-btn"
            aria-label="关闭助手"
          >
            关闭
          </button>
        )}
      </div>

      {/* Voice waveform visualization — active when listening */}
      <div
        style={S.waveformContainer}
        data-testid="waveform"
        aria-label={status === 'listening' ? '正在聆听语音输入' : '语音输入未激活'}
      >
        {Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => (
          <div
            key={i}
            style={status === 'listening' ? S.waveformBar(i) : S.waveformBarInactive}
          />
        ))}
      </div>

      {/* Conversation history */}
      <div style={S.conversationArea} data-testid="conversation-area">
        {conversation.length === 0 ? (
          <div style={S.emptyHint}>说点什么试试...</div>
        ) : (
          conversation.map((entry, i) => (
            <div key={i} data-testid={`message-${entry.role}`}>
              <div style={S.bubble(entry.role === 'user')}>{entry.text}</div>
              {entry.role === 'assistant' && entry.needsConfirmation && (
                <div style={S.confirmBadge} data-testid="confirm-badge">
                  <Icon name="warning" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />置信度较低，请确认
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Processing feedback */}
      {processingText && (
        <div style={S.processingText} data-testid="processing-text">
          {processingText}
          <span style={S.processingDot(0)}>.</span>
          <span style={S.processingDot(1)}>.</span>
          <span style={S.processingDot(2)}>.</span>
        </div>
      )}

      {/* Confirmation bar for low-confidence responses */}
      {showConfirmBar && (
        <div style={S.confirmBar} data-testid="confirm-bar">
          {onConfirm && (
            <button style={S.confirmBtn} onClick={onConfirm} data-testid="confirm-action-btn">
              确认
            </button>
          )}
          {onRetry && (
            <button style={S.retryBtn} onClick={onRetry} data-testid="retry-btn">
              重新输入
            </button>
          )}
        </div>
      )}

      {/* Text input fallback for Demo */}
      <div style={S.inputArea}>
        <input
          style={S.textInput}
          type="text"
          placeholder="输入文字指令..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="text-input"
          aria-label="文字指令输入"
        />
        <button
          style={S.sendBtn}
          onClick={handleSubmit}
          disabled={!inputText.trim()}
          data-testid="send-btn"
        >
          发送
        </button>
      </div>
    </div>
  );
}
