import { useMemo } from 'react';
import type { NavigationState, Route } from '../../types/navigation';
import { Icon, type IconName } from '../icons/Icon';

/**
 * ARNavigationView — AR 导航叠加显示组件
 *
 * 在用户视野中叠加显示：
 * - 方向箭头（左转、右转、直行、掉头）
 * - 距离信息（到下一转弯点、剩余总距离）
 * - 预计到达时间
 * - GPS 信号状态提示
 * - 导航信息显示在视野底部，不遮挡主要视线 — 需求 11.5
 *
 * 需求: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

export interface ARNavigationViewProps {
  /** 导航状态 */
  navigationState: NavigationState;
  /** 当前路线 */
  route: Route | null;
  /** 停止导航回调 */
  onStopNavigation?: () => void;
  /** 重新规划回调 */
  onReroute?: () => void;
}

/** 方向箭头 Icon 映射 */
const DIRECTION_ICONS: Record<string, IconName> = {
  left: 'arrow-left',
  right: 'arrow-right',
  straight: 'arrow-up',
  uturn: 'back',
};

const DIRECTION_LABELS: Record<string, string> = {
  left: '左转',
  right: '右转',
  straight: '直行',
  uturn: '掉头',
};

/** 格式化距离 */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/** 格式化预计到达时间 */
function formatETA(timestamp: number): string {
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** 格式化剩余时间 */
function formatRemainingTime(timestamp: number): string {
  const remaining = Math.max(0, timestamp - Date.now());
  const minutes = Math.round(remaining / 60000);
  if (minutes < 1) return '即将到达';
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} 小时 ${mins} 分钟`;
}

/** GPS 信号状态配置 */
const GPS_CONFIG: Record<string, { label: string; color: string }> = {
  strong: { label: 'GPS 信号良好', color: 'rgba(80, 220, 160, 0.9)' },
  weak: { label: 'GPS 信号弱', color: 'rgba(255, 200, 60, 0.9)' },
  lost: { label: 'GPS 信号丢失', color: 'rgba(255, 80, 80, 0.9)' },
};

/* ── 需求 11.5: 导航信息显示在视野底部，不遮挡主要视线 ── */
const S = {
  container: {
    position: 'fixed' as const,
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '92vw',
    maxWidth: 420,
    background: 'rgba(10, 15, 30, 0.92)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    padding: 14,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    zIndex: 1500,
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(100, 200, 255, 0.06)',
    border: '1px solid rgba(100, 200, 255, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeLabel: {
    fontSize: 11,
    color: 'rgba(100, 200, 255, 0.6)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    fontWeight: 600,
  },
  stopBtn: {
    background: 'rgba(255, 90, 90, 0.1)',
    border: '1px solid rgba(255, 90, 90, 0.25)',
    color: 'rgba(255, 90, 90, 0.95)',
    borderRadius: 8,
    padding: '4px 12px',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },
  turnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  arrow: {
    fontSize: 36,
    lineHeight: 1,
    color: 'rgba(100, 200, 255, 0.95)',
    filter: 'drop-shadow(0 0 8px rgba(100, 200, 255, 0.3))',
  },
  turnInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  turnDirection: {
    fontSize: 16,
    fontWeight: 600,
  },
  turnDistance: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  streetName: {
    fontSize: 12,
    color: 'rgba(100, 200, 255, 0.6)',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(100, 200, 255, 0.06)',
    paddingTop: 8,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.3,
  },
  gpsBar: (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '4px 0',
    fontSize: 11,
    color,
  }),
  gpsDot: (color: string): React.CSSProperties => ({
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 6px ${color}`,
  }),
  lostBanner: {
    background: 'rgba(255, 90, 90, 0.08)',
    border: '1px solid rgba(255, 90, 90, 0.2)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    color: 'rgba(255, 90, 90, 0.95)',
    textAlign: 'center' as const,
  },
  inactive: {
    position: 'fixed' as const,
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10, 15, 30, 0.7)',
    borderRadius: 12,
    padding: '10px 20px',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: 1500,
  },
};

export function ARNavigationView({
  navigationState,
  route,
  onStopNavigation,
  onReroute,
}: ARNavigationViewProps) {
  const gpsConfig = useMemo(
    () => GPS_CONFIG[navigationState.gpsSignal],
    [navigationState.gpsSignal],
  );

  // 导航未激活时不显示
  if (!navigationState.isActive || !route) {
    return null;
  }

  const { nextTurn, remainingDistance, estimatedArrival, gpsSignal } = navigationState;

  return (
    <div
      data-testid="ar-navigation-view"
      role="region"
      aria-label="AR 导航"
      style={S.container}
    >
      {/* Header: mode + stop */}
      <div style={S.header}>
        <span style={S.modeLabel} data-testid="nav-mode">
          <Icon name={route.mode === 'walk' ? 'run' : 'scooter'} size={12} /> {route.mode === 'walk' ? '步行导航' : '骑行导航'}
        </span>
        {onStopNavigation && (
          <button
            style={S.stopBtn}
            onClick={onStopNavigation}
            data-testid="stop-nav-btn"
            aria-label="停止导航"
          >
            结束
          </button>
        )}
      </div>

      {/* Turn instruction — 需求 11.2 */}
      <div style={S.turnRow} data-testid="turn-instruction">
        <span style={S.arrow} aria-hidden="true">
          <Icon name={DIRECTION_ICONS[nextTurn.direction]} size={32} />
        </span>
        <div style={S.turnInfo}>
          <span style={S.turnDirection}>
            {DIRECTION_LABELS[nextTurn.direction]}
          </span>
          <span style={S.turnDistance}>
            {formatDistance(nextTurn.distance)} 后
          </span>
          {nextTurn.streetName && (
            <span style={S.streetName} data-testid="street-name">
              进入 {nextTurn.streetName}
            </span>
          )}
        </div>
      </div>

      {/* Stats row: remaining distance, ETA, remaining time */}
      <div style={S.statsRow} data-testid="nav-stats">
        <div style={S.stat}>
          <span style={S.statValue} data-testid="remaining-distance">
            {formatDistance(remainingDistance)}
          </span>
          <span style={S.statLabel}>剩余距离</span>
        </div>
        <div style={S.stat}>
          <span style={S.statValue} data-testid="remaining-time">
            {formatRemainingTime(estimatedArrival)}
          </span>
          <span style={S.statLabel}>预计用时</span>
        </div>
        <div style={S.stat}>
          <span style={S.statValue} data-testid="eta">
            {formatETA(estimatedArrival)}
          </span>
          <span style={S.statLabel}>到达时间</span>
        </div>
      </div>

      {/* GPS signal — 需求 11.6 */}
      <div style={S.gpsBar(gpsConfig.color)} data-testid="gps-status">
        <span style={S.gpsDot(gpsConfig.color)} />
        {gpsConfig.label}
      </div>

      {/* GPS lost banner — 需求 11.6 */}
      {gpsSignal === 'lost' && (
        <div style={S.lostBanner} data-testid="gps-lost-banner">
          GPS 信号丢失，使用最近已知位置继续导航
          {onReroute && (
            <button
              style={{ ...S.stopBtn, marginLeft: 8, color: 'rgba(255,200,100,0.95)' }}
              onClick={onReroute}
              data-testid="reroute-btn"
            >
              重新规划
            </button>
          )}
        </div>
      )}
    </div>
  );
}
