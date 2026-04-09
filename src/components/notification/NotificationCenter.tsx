import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Notification, NotificationAction } from '../../types/data';
import { Icon } from '../icons/Icon';

/**
 * NotificationCenterView — 通知中心 UI 组件
 *
 * 实现三种视图模式：
 * - 隐藏模式 (hidden): 无通知时不显示
 * - 简要提示 (toast): 新通知到达时在视野边缘显示简要提示 — 需求 7.1
 * - 通知列表 (list): 向下滑动展开完整通知列表 — 需求 7.3
 * - 通知详情 (detail): 选择通知后展示详情和快捷操作 — 需求 7.5
 *
 * 需求: 7.1, 7.3, 7.5
 */

export type NotificationViewMode = 'hidden' | 'toast' | 'list' | 'detail';

export interface NotificationCenterViewProps {
  /** 所有通知（时间倒序） */
  notifications: Notification[];
  /** 按应用分组的通知 */
  groupedNotifications: Map<string, Notification[]>;
  /** 当前视图模式 */
  mode: NotificationViewMode;
  /** 新到达的通知（用于 toast 显示） */
  toastNotification?: Notification | null;
  /** 当前选中查看详情的通知 */
  selectedNotification?: Notification | null;
  /** 未读数量 */
  unreadCount: number;
  /** 模式切换回调 */
  onModeChange?: (mode: NotificationViewMode) => void;
  /** 选择通知回调 */
  onSelectNotification?: (notification: Notification) => void;
  /** 标记已读回调 */
  onMarkAsRead?: (notificationId: string) => void;
  /** 快捷操作回调 */
  onAction?: (notificationId: string, actionId: string) => void;
  /** 关闭详情回调 */
  onCloseDetail?: () => void;
  /** Toast 自动消失时间（毫秒），默认 3000 */
  toastDurationMs?: number;
  /** 是否按应用分组显示 */
  groupByApp?: boolean;
}

/** 格式化时间戳为可读时间 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/* ── Inline styles ── */
const S = {
  root: {
    position: 'relative' as const,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)',
    userSelect: 'none' as const,
  },

  /* ── Toast ── */
  toast: {
    position: 'fixed' as const,
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    minWidth: 260,
    maxWidth: 400,
    background: 'rgba(10, 15, 30, 0.94)',
    backdropFilter: 'blur(20px)',
    borderRadius: 12,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 2000,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(110, 54, 238, 0.06)',
    border: '1px solid rgba(110, 54, 238, 0.12)',
    animation: 'nc-slide-in 0.25s cubic-bezier(0, 0, 0.2, 1)',
  },

  toastIcon: {
    fontSize: 18,
    flexShrink: 0,
    filter: 'drop-shadow(0 0 4px rgba(110, 54, 238, 0.3))',
  },

  toastContent: {
    flex: 1,
    minWidth: 0,
  },

  toastApp: {
    fontSize: 10,
    color: 'rgba(110, 54, 238, 0.6)',
    marginBottom: 2,
    letterSpacing: 0.3,
  },

  toastTitle: {
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },

  toastSummary: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    marginTop: 1,
  },

  /* ── List panel ── */
  listOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1500,
  },

  listPanel: {
    position: 'fixed' as const,
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90vw',
    maxWidth: 420,
    maxHeight: '80vh',
    background: 'rgba(10, 15, 30, 0.96)',
    backdropFilter: 'blur(24px)',
    borderRadius: '0 0 16px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 1600,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(110, 54, 238, 0.04)',
    border: '1px solid rgba(110, 54, 238, 0.08)',
    borderTop: 'none',
    animation: 'nc-slide-down 0.25s cubic-bezier(0, 0, 0.2, 1)',
  },

  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(110, 54, 238, 0.06)',
  },

  listTitle: {
    fontSize: 15,
    fontWeight: 600,
  },

  badge: {
    background: 'rgba(255, 90, 90, 0.2)',
    color: 'rgba(255, 90, 90, 0.95)',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 10,
    padding: '2px 7px',
    marginLeft: 8,
    border: '1px solid rgba(255, 90, 90, 0.2)',
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

  listBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 0',
  },

  groupHeader: {
    fontSize: 10,
    color: 'rgba(110, 54, 238, 0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    padding: '8px 16px 4px',
    fontWeight: 600,
  },

  notificationItem: (isRead: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    background: isRead ? 'transparent' : 'rgba(110, 54, 238, 0.03)',
    borderBottom: '1px solid rgba(110, 54, 238, 0.04)',
    transition: 'background 0.15s',
  }),

  unreadDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'rgba(110, 54, 238, 0.9)',
    boxShadow: '0 0 6px rgba(110, 54, 238, 0.3)',
    flexShrink: 0,
    marginTop: 6,
  },

  readDotPlaceholder: {
    width: 5,
    height: 5,
    flexShrink: 0,
    marginTop: 6,
  },

  itemContent: {
    flex: 1,
    minWidth: 0,
  },

  itemAppName: {
    fontSize: 10,
    color: 'rgba(110, 54, 238, 0.5)',
    letterSpacing: 0.3,
  },

  itemTitle: {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },

  itemSummary: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    marginTop: 2,
  },

  itemTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
    marginTop: 2,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },

  emptyState: {
    textAlign: 'center' as const,
    padding: '32px 16px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 13,
  },

  /* ── Detail panel ── */
  detailOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailPanel: {
    width: '85vw',
    maxWidth: 380,
    background: 'rgba(10, 15, 30, 0.96)',
    backdropFilter: 'blur(24px)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(110, 54, 238, 0.04)',
    border: '1px solid rgba(110, 54, 238, 0.1)',
    animation: 'nc-fade-in 0.2s cubic-bezier(0, 0, 0.2, 1)',
  },

  detailHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  detailAppName: {
    fontSize: 11,
    color: 'rgba(110, 54, 238, 0.6)',
    marginBottom: 4,
    letterSpacing: 0.3,
  },

  detailTitle: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
  },

  detailTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 4,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },

  detailBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: 'rgba(255, 255, 255, 0.75)',
    borderTop: '1px solid rgba(110, 54, 238, 0.06)',
    paddingTop: 12,
  },

  actionBar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    borderTop: '1px solid rgba(110, 54, 238, 0.06)',
    paddingTop: 12,
  },

  actionBtn: {
    background: 'rgba(110, 54, 238, 0.1)',
    border: '1px solid rgba(110, 54, 238, 0.2)',
    color: 'rgba(110, 54, 238, 0.95)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    flex: 1,
    minWidth: 80,
    textAlign: 'center' as const,
    transition: 'background 0.15s, border-color 0.15s',
  },

  markReadBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(110, 54, 238, 0.1)',
    color: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },
};

/* ── Keyframes ── */
const KEYFRAMES = `
@keyframes nc-slide-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes nc-slide-down {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes nc-fade-in {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

/* ── Toast sub-component — 需求 7.1 ── */
function ToastView({
  notification,
  onDismiss,
  durationMs,
}: {
  notification: Notification;
  onDismiss: () => void;
  durationMs: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss, durationMs]);

  return (
    <div style={S.toast} data-testid="notification-toast" role="alert">
      <span style={S.toastIcon}><Icon name="bell" size={16} /></span>
      <div style={S.toastContent}>
        <div style={S.toastApp}>{notification.appName}</div>
        <div style={S.toastTitle}>{notification.title}</div>
        <div style={S.toastSummary}>{notification.summary}</div>
      </div>
    </div>
  );
}

/* ── Notification list item ── */
function NotificationItem({
  notification,
  onSelect,
}: {
  notification: Notification;
  onSelect: (n: Notification) => void;
}) {
  return (
    <div
      style={S.notificationItem(notification.isRead)}
      onClick={() => onSelect(notification)}
      data-testid="notification-item"
      data-read={notification.isRead}
      role="button"
      tabIndex={0}
      aria-label={`${notification.appName}: ${notification.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(notification);
      }}
    >
      {notification.isRead ? (
        <div style={S.readDotPlaceholder} />
      ) : (
        <div style={S.unreadDot} data-testid="unread-dot" />
      )}
      <div style={S.itemContent}>
        <div style={S.itemAppName}>{notification.appName}</div>
        <div style={S.itemTitle}>{notification.title}</div>
        <div style={S.itemSummary}>{notification.summary}</div>
      </div>
      <div style={S.itemTime}>{formatTime(notification.timestamp)}</div>
    </div>
  );
}

/* ── Detail view — 需求 7.5 ── */
function DetailView({
  notification,
  onClose,
  onMarkAsRead,
  onAction,
}: {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  onAction?: (notificationId: string, actionId: string) => void;
}) {
  return (
    <div
      style={S.detailOverlay}
      data-testid="notification-detail-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={S.detailPanel} data-testid="notification-detail">
        <div style={S.detailHeader}>
          <div>
            <div style={S.detailAppName}>{notification.appName}</div>
            <div style={S.detailTitle}>{notification.title}</div>
            <div style={S.detailTime}>{formatTime(notification.timestamp)}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose} data-testid="detail-close-btn">
            ✕
          </button>
        </div>

        <div style={S.detailBody} data-testid="notification-detail-body">
          {notification.summary}
        </div>

        {/* 快捷操作 — 需求 7.5 */}
        <div style={S.actionBar}>
          {!notification.isRead && onMarkAsRead && (
            <button
              style={S.markReadBtn}
              onClick={() => onMarkAsRead(notification.id)}
              data-testid="mark-read-btn"
            >
              标记已读
            </button>
          )}
          {notification.actions && notification.actions.length > 0 ? (
            notification.actions.map((action: NotificationAction) => (
              <button
                key={action.actionId}
                style={S.actionBtn}
                onClick={() => onAction?.(notification.id, action.actionId)}
                data-testid={`action-${action.actionId}`}
              >
                {action.label}
              </button>
            ))
          ) : (
            <button
              style={S.actionBtn}
              onClick={onClose}
              data-testid="action-dismiss"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function NotificationCenterView({
  notifications,
  groupedNotifications,
  mode,
  toastNotification,
  selectedNotification,
  unreadCount,
  onModeChange,
  onSelectNotification,
  onMarkAsRead,
  onAction,
  onCloseDetail,
  toastDurationMs = 3000,
  groupByApp = false,
}: NotificationCenterViewProps) {
  useMemo(() => injectKeyframes(), []);

  const [internalGroupByApp, setInternalGroupByApp] = useState(groupByApp);

  const handleDismissToast = useCallback(() => {
    onModeChange?.('hidden');
  }, [onModeChange]);

  const handleSelectNotification = useCallback(
    (notification: Notification) => {
      onSelectNotification?.(notification);
    },
    [onSelectNotification],
  );

  const handleCloseList = useCallback(() => {
    onModeChange?.('hidden');
  }, [onModeChange]);

  const handleCloseDetail = useCallback(() => {
    onCloseDetail?.();
  }, [onCloseDetail]);

  const toggleGroupByApp = useCallback(() => {
    setInternalGroupByApp((prev) => !prev);
  }, []);

  /* ── Hidden mode ── */
  if (mode === 'hidden') {
    return <div style={S.root} data-testid="notification-center" data-mode="hidden" />;
  }

  /* ── Toast mode — 需求 7.1 ── */
  if (mode === 'toast' && toastNotification) {
    return (
      <div style={S.root} data-testid="notification-center" data-mode="toast">
        <ToastView
          notification={toastNotification}
          onDismiss={handleDismissToast}
          durationMs={toastDurationMs}
        />
      </div>
    );
  }

  /* ── Detail mode — 需求 7.5 ── */
  if (mode === 'detail' && selectedNotification) {
    return (
      <div style={S.root} data-testid="notification-center" data-mode="detail">
        <DetailView
          notification={selectedNotification}
          onClose={handleCloseDetail}
          onMarkAsRead={onMarkAsRead}
          onAction={onAction}
        />
      </div>
    );
  }

  /* ── List mode — 需求 7.3 ── */
  if (mode === 'list') {
    return (
      <div style={S.root} data-testid="notification-center" data-mode="list">
        <div style={S.listOverlay} onClick={handleCloseList} data-testid="list-overlay" />
        <div style={S.listPanel} data-testid="notification-list-panel">
          {/* Header */}
          <div style={S.listHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={S.listTitle}>通知中心</span>
              {unreadCount > 0 && (
                <span style={S.badge} data-testid="unread-badge">
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={{
                  ...S.closeBtn,
                  background: internalGroupByApp
                    ? 'rgba(80, 160, 255, 0.2)'
                    : 'rgba(255,255,255,0.1)',
                }}
                onClick={toggleGroupByApp}
                data-testid="group-toggle-btn"
                aria-label="按应用分组"
              >
                <Icon name={internalGroupByApp ? 'folder' : 'list'} size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{internalGroupByApp ? '分组' : '列表'}
              </button>
              <button
                style={S.closeBtn}
                onClick={handleCloseList}
                data-testid="list-close-btn"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={S.listBody} data-testid="notification-list-body">
            {notifications.length === 0 ? (
              <div style={S.emptyState} data-testid="empty-state">
                暂无通知
              </div>
            ) : internalGroupByApp ? (
              /* Grouped view */
              Array.from(groupedNotifications.entries()).map(([appId, group]) => (
                <div key={appId} data-testid="notification-group">
                  <div style={S.groupHeader} data-testid="group-header">
                    {group[0]?.appName ?? appId} ({group.length})
                  </div>
                  {group.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onSelect={handleSelectNotification}
                    />
                  ))}
                </div>
              ))
            ) : (
              /* Flat list view */
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onSelect={handleSelectNotification}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Fallback */
  return <div style={S.root} data-testid="notification-center" data-mode="hidden" />;
}
