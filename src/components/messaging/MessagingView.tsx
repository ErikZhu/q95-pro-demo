import { useMemo } from 'react';
import type { MessagingState } from '../../services/MessagingModule';
import { Icon } from '../icons/Icon';

/**
 * MessagingView — 消息与通话界面组件
 *
 * 显示：
 * - 消息预览（发送者和摘要）— 需求 17.1
 * - 语音回复入口 — 需求 17.2
 * - 来电界面（接听/拒绝）— 需求 17.3
 * - 通话状态（时长和对方信息）— 需求 17.4
 * - 麦克风/扬声器控制 — 需求 17.5
 * - 蓝牙断开提示 — 需求 17.6
 *
 * 需求: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

export interface MessagingViewProps {
  /** 消息模块状态 */
  state: MessagingState;
  /** 标记消息已读 */
  onMarkAsRead?: (messageId: string) => void;
  /** 语音回复 */
  onVoiceReply?: (messageId: string) => void;
  /** 接听来电 */
  onAcceptCall?: () => void;
  /** 拒绝来电 */
  onRejectCall?: () => void;
  /** 结束通话 */
  onEndCall?: () => void;
  /** 切换麦克风 */
  onToggleMic?: () => void;
  /** 切换扬声器 */
  onToggleSpeaker?: () => void;
}

/** 格式化通话时长 mm:ss */
function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** 格式化消息时间 */
function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const S = {
  container: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(15, 25, 45, 0.96), rgba(10, 10, 26, 0.98))', display: 'flex', flexDirection: 'column' as const, fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(255, 255, 255, 0.92)', zIndex: 1400 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(10, 15, 30, 0.96)', borderBottom: '1px solid rgba(100, 200, 255, 0.06)' },
  title: { fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)' },
  btBadge: { fontSize: 11, color: 'rgba(80, 220, 160, 0.9)', background: 'rgba(80, 220, 160, 0.08)', borderRadius: 10, padding: '2px 8px', border: '1px solid rgba(80, 220, 160, 0.15)' },
  btWarning: { fontSize: 11, color: 'rgba(255, 90, 90, 0.9)', background: 'rgba(255, 90, 90, 0.08)', borderRadius: 10, padding: '2px 8px', border: '1px solid rgba(255, 90, 90, 0.15)' },
  content: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 12, padding: '16px', overflowY: 'auto' as const },
  warningBanner: { width: '100%', background: 'rgba(255, 90, 90, 0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255, 90, 90, 0.2)', fontSize: 13, color: 'rgba(255, 90, 90, 0.95)' },
  callOverlay: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: 'rgba(100, 200, 255, 0.04)', borderRadius: 16, border: '1px solid rgba(100, 200, 255, 0.1)' },
  callerName: { fontSize: 22, fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)' },
  callerNumber: { fontSize: 14, color: 'rgba(255, 255, 255, 0.4)', fontFamily: "'SF Mono', 'Fira Code', monospace" },
  callDuration: { fontSize: 18, fontWeight: 600, fontFamily: "'SF Mono', 'Fira Code', monospace", fontVariantNumeric: 'tabular-nums' as const, color: 'rgba(100, 200, 255, 0.95)' },
  callActions: { display: 'flex', gap: 16, marginTop: 8 },
  callBtn: { padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'background 0.15s' },
  acceptBtn: { background: 'rgba(80, 220, 160, 0.1)', color: 'rgba(80, 220, 160, 0.95)', border: '1px solid rgba(80, 220, 160, 0.3)' },
  rejectBtn: { background: 'rgba(255, 90, 90, 0.1)', color: 'rgba(255, 90, 90, 0.95)', border: '1px solid rgba(255, 90, 90, 0.3)' },
  endBtn: { background: 'rgba(255, 90, 90, 0.1)', color: 'rgba(255, 90, 90, 0.95)', border: '1px solid rgba(255, 90, 90, 0.3)' },
  toggleBtn: { padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'background 0.15s, border-color 0.15s' },
  toggleOn: { background: 'rgba(100, 200, 255, 0.08)', color: 'rgba(100, 200, 255, 0.95)', border: '1px solid rgba(100, 200, 255, 0.2)' },
  toggleOff: { background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)' },
  msgCard: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(100, 200, 255, 0.04)' },
  msgUnread: { borderLeft: '2px solid rgba(100, 200, 255, 0.5)', paddingLeft: 10 },
  msgSender: { fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)' },
  msgSummary: { fontSize: 12, color: 'rgba(255, 255, 255, 0.45)', marginTop: 2 },
  msgTime: { fontSize: 11, color: 'rgba(255, 255, 255, 0.3)', marginLeft: 'auto', flexShrink: 0, fontFamily: "'SF Mono', 'Fira Code', monospace" },
  msgActions: { display: 'flex', gap: 6, marginTop: 4 },
  smallBtn: { fontSize: 11, color: 'rgba(100, 200, 255, 0.7)', background: 'rgba(100, 200, 255, 0.06)', border: '1px solid rgba(100, 200, 255, 0.12)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', transition: 'background 0.15s' },
  emptyHint: { textAlign: 'center' as const, color: 'rgba(255, 255, 255, 0.25)', fontSize: 13, padding: 32 },
  hwLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center' as const, marginTop: 4 },
};

export function MessagingView({
  state,
  onMarkAsRead,
  onVoiceReply,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onToggleMic,
  onToggleSpeaker,
}: MessagingViewProps) {
  const { messages, callState, bluetoothStatus, bluetoothWarning } = state;

  const unreadCount = useMemo(
    () => messages.filter((m) => !m.isRead).length,
    [messages],
  );

  const isRinging = callState.status === 'ringing';
  const isActive = callState.status === 'active';
  const showCallUI = isRinging || isActive;

  return (
    <div
      data-testid="messaging-view"
      role="region"
      aria-label="消息与通话"
      style={S.container}
    >
      {/* Top bar */}
      <div style={S.topBar} data-testid="messaging-top-bar">
        <span style={S.title}>
          消息 {unreadCount > 0 && `(${unreadCount})`}
        </span>
        {bluetoothStatus === 'connected' ? (
          <span style={S.btBadge} data-testid="bt-connected"><Icon name="link" size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> 已连接</span>
        ) : (
          <span style={S.btWarning} data-testid="bt-disconnected"><Icon name="warning" size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> 未连接</span>
        )}
      </div>

      {/* Content */}
      <div style={S.content}>
        {/* Bluetooth warning — 需求 17.6 */}
        {bluetoothWarning && (
          <div style={S.warningBanner} data-testid="bt-warning" role="alert">
            <Icon name="warning" size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{bluetoothWarning}
          </div>
        )}

        {/* Call UI — 需求 17.3, 17.4, 17.5 */}
        {showCallUI && (
          <div style={S.callOverlay} data-testid="call-overlay">
            {isRinging && (
              <div style={{ fontSize: 13, color: 'rgba(100, 200, 255, 0.8)' }}>
                <Icon name="phone" size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />来电
              </div>
            )}
            {isActive && (
              <div style={{ fontSize: 13, color: 'rgba(100, 220, 100, 0.8)' }}>
                <Icon name="speaker" size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />通话中
              </div>
            )}
            <div style={S.callerName} data-testid="caller-name">
              {callState.callerName ?? '未知'}
            </div>
            <div style={S.callerNumber} data-testid="caller-number">
              {callState.callerNumber ?? ''}
            </div>

            {/* 通话时长 — 需求 17.4 */}
            {isActive && (
              <div style={S.callDuration} data-testid="call-duration">
                {formatCallDuration(callState.duration)}
              </div>
            )}

            {/* 接听/拒绝 — 需求 17.3 */}
            {isRinging && (
              <div style={S.callActions}>
                <button
                  style={{ ...S.callBtn, ...S.acceptBtn }}
                  onClick={onAcceptCall}
                  data-testid="accept-call-btn"
                  aria-label="接听"
                >
                  <Icon name="check" size={12} /> 接听
                </button>
                <button
                  style={{ ...S.callBtn, ...S.rejectBtn }}
                  onClick={onRejectCall}
                  data-testid="reject-call-btn"
                  aria-label="拒绝"
                >
                  <Icon name="stop" size={12} /> 拒绝
                </button>
              </div>
            )}

            {/* 通话控制 — 需求 17.5 */}
            {isActive && (
              <>
                <div style={S.callActions}>
                  <button
                    style={{
                      ...S.toggleBtn,
                      ...(callState.useMic ? S.toggleOn : S.toggleOff),
                    }}
                    onClick={onToggleMic}
                    data-testid="toggle-mic-btn"
                    aria-label={callState.useMic ? '关闭麦克风' : '开启麦克风'}
                  >
                    <Icon name="mic" size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {callState.useMic ? '麦克风开' : '麦克风关'}
                  </button>
                  <button
                    style={{
                      ...S.toggleBtn,
                      ...(callState.useSpeaker ? S.toggleOn : S.toggleOff),
                    }}
                    onClick={onToggleSpeaker}
                    data-testid="toggle-speaker-btn"
                    aria-label={callState.useSpeaker ? '关闭扬声器' : '开启扬声器'}
                  >
                    <Icon name="speaker" size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {callState.useSpeaker ? '扬声器开' : '扬声器关'}
                  </button>
                </div>
                <button
                  style={{ ...S.callBtn, ...S.endBtn }}
                  onClick={onEndCall}
                  data-testid="end-call-btn"
                  aria-label="结束通话"
                >
                  <Icon name="stop" size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 结束通话
                </button>
                <div style={S.hwLabel} data-testid="hw-label">
                  通过眼镜内置麦克风和扬声器通话
                </div>
              </>
            )}
          </div>
        )}

        {/* Message list — 需求 17.1, 17.2 */}
        {messages.length === 0 && !showCallUI && (
          <div style={S.emptyHint} data-testid="no-messages">暂无消息</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{ ...S.msgCard, ...(!msg.isRead ? S.msgUnread : {}) }}
            data-testid={`msg-card-${msg.id}`}
          >
            <div style={{ flex: 1 }}>
              <div style={S.msgSender}>{msg.sender}</div>
              <div style={S.msgSummary}>{msg.summary}</div>
              <div style={S.msgActions}>
                {!msg.isRead && (
                  <button
                    style={S.smallBtn}
                    onClick={() => onMarkAsRead?.(msg.id)}
                    data-testid={`mark-read-${msg.id}`}
                    aria-label="标记已读"
                  >
                    已读
                  </button>
                )}
                <button
                  style={S.smallBtn}
                  onClick={() => onVoiceReply?.(msg.id)}
                  data-testid={`voice-reply-${msg.id}`}
                  aria-label="语音回复"
                >
                  <Icon name="mic" size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> 语音回复
                </button>
              </div>
            </div>
            <span style={S.msgTime}>{formatTime(msg.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
