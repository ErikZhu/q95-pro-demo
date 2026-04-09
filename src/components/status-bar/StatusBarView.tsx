import { useMemo } from 'react';
import type { DeviceStatus } from '../../types/data';
import { Icon, type IconName } from '../icons/Icon';

/**
 * StatusBarView — 设备状态栏 UI 组件
 *
 * 纯展示组件，显示电量、蓝牙、Wi-Fi、时间等设备状态信息。
 * 支持展开/收起详细信息面板（电量数值、已连接设备名称、信号强度）。
 * 使用高对比度颜色确保在不同亮度环境下清晰可读。
 *
 * 需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

export interface StatusBarViewProps {
  /** 设备状态数据 */
  status: DeviceStatus;
  /** 是否展开详细信息面板 */
  isExpanded: boolean;
  /** 展开/收起切换回调 */
  onToggleExpand?: () => void;
}

/** 电量颜色：绿色(正常)、橙色(<20%)、红色(<5%) — 需求 4.2 */
function getBatteryColor(level: number, isCharging: boolean): string {
  if (isCharging) return '#9B6EF3';
  if (level < 5) return '#FF5252';
  if (level < 20) return '#FFA726';
  return '#8B5CF6';
}

/** 电量图标 — 需求 4.1, 4.2 */
function getBatteryIconName(_level: number, isCharging: boolean): IconName {
  if (isCharging) return 'battery-charging';
  if (_level < 20) return 'battery-low';
  return 'battery';
}

/** Wi-Fi 信号强度描述 */
function getWifiStrengthLabel(strength?: number): string {
  if (strength === undefined) return '—';
  if (strength >= 75) return '强';
  if (strength >= 40) return '中';
  return '弱';
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

  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    height: '100%',
    paddingRight: 10,
    cursor: 'pointer',
  },

  iconGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
  },

  time: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.92)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },

  statusIcon: (color: string): React.CSSProperties => ({
    fontSize: 14,
    filter: `drop-shadow(0 0 3px ${color})`,
    lineHeight: 1,
  }),

  connDot: (connected: boolean): React.CSSProperties => ({
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: connected ? 'rgba(140, 80, 255, 0.9)' : 'rgba(255, 90, 90, 0.9)',
    boxShadow: connected ? '0 0 6px rgba(140, 80, 255, 0.4)' : '0 0 6px rgba(255, 90, 90, 0.4)',
    flexShrink: 0,
  }),

  batteryLabel: (color: string): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 600,
    color,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    minWidth: 28,
    textAlign: 'right' as const,
  }),

  /* ── Expanded detail panel — 需求 4.5 ── */
  panel: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: 4,
    minWidth: 200,
    background: 'rgba(10, 15, 30, 0.94)',
    backdropFilter: 'blur(20px)',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    zIndex: 1000,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(110, 54, 238, 0.06)',
    border: '1px solid rgba(110, 54, 238, 0.12)',
    animation: 'fadeIn 0.15s cubic-bezier(0, 0, 0.2, 1)',
  },

  panelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    fontSize: 12,
  },

  panelLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    letterSpacing: 0.3,
  },

  panelValue: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: 500,
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },

  divider: {
    height: 1,
    background: 'rgba(110, 54, 238, 0.06)',
  },
};

/* ── Low-battery blink keyframes ── */
const BLINK_KEYFRAMES = `
@keyframes sb-low-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
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

export function StatusBarView({ status, isExpanded, onToggleExpand }: StatusBarViewProps) {
  useMemo(() => injectBlinkKeyframes(), []);

  const { battery, bluetooth, wifi, time } = status;
  const batteryColor = getBatteryColor(battery.level, battery.isCharging);
  const batteryIcon = getBatteryIconName(battery.level, battery.isCharging);

  const batteryStyle: React.CSSProperties = {
    ...S.statusIcon(batteryColor),
    ...(battery.isCritical ? { animation: 'sb-low-blink 1s ease-in-out infinite' } : {}),
  };

  return (
    <div style={S.root} data-testid="status-bar-view">
      {/* Compact bar — 需求 4.1 */}
      <div
        style={S.bar}
        onClick={onToggleExpand}
        data-testid="status-bar-compact"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="设备状态栏"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggleExpand?.();
        }}
      >
        {/* Wi-Fi — 需求 4.1, 4.4 */}
        <div style={S.iconGroup} data-testid="wifi-indicator">
          <span style={S.statusIcon(wifi.connected ? '#9B6EF3' : '#FF5252')} aria-label={wifi.connected ? 'Wi-Fi 已连接' : 'Wi-Fi 未连接'}>
            <Icon name={wifi.connected ? 'wifi' : 'wifi-off'} size={12} color={wifi.connected ? '#9B6EF3' : '#FF5252'} />
          </span>
          <div style={S.connDot(wifi.connected)} />
        </div>

        {/* Bluetooth — 需求 4.1, 4.4 */}
        <div style={S.iconGroup} data-testid="bluetooth-indicator">
          <span style={S.statusIcon(bluetooth.connected ? '#8B5CF6' : '#FF5252')} aria-label={bluetooth.connected ? '蓝牙已连接' : '蓝牙未连接'}>
            <Icon name={bluetooth.connected ? 'bluetooth' : 'bluetooth-off'} size={12} color={bluetooth.connected ? '#8B5CF6' : '#FF5252'} />
          </span>
          <div style={S.connDot(bluetooth.connected)} />
        </div>

        {/* Battery — 需求 4.1, 4.2 */}
        <div style={S.iconGroup} data-testid="battery-indicator">
          <span style={batteryStyle} aria-label={`电量 ${battery.level}%`}>
            <Icon name={batteryIcon} size={12} color={batteryColor} />
          </span>
          <span style={S.batteryLabel(batteryColor)} data-testid="battery-level">
            {battery.level}%
          </span>
        </div>

        {/* Time — 需求 4.1 */}
        <span style={S.time} data-testid="time-display">{time}</span>
      </div>

      {/* Expanded detail panel — 需求 4.5 */}
      {isExpanded && (
        <div style={S.panel} data-testid="status-detail-panel">
          {/* Battery detail */}
          <div style={S.panelRow}>
            <span style={S.panelLabel}>电量</span>
            <span style={{ ...S.panelValue, color: batteryColor }} data-testid="panel-battery-value">
              {battery.level}% {battery.isCharging ? '(充电中)' : ''}
            </span>
          </div>

          <div style={S.divider} />

          {/* Bluetooth detail */}
          <div style={S.panelRow}>
            <span style={S.panelLabel}>蓝牙</span>
            <span style={S.panelValue} data-testid="panel-bluetooth-value">
              {bluetooth.connected
                ? bluetooth.deviceName ?? '已连接'
                : '未连接'}
            </span>
          </div>

          <div style={S.divider} />

          {/* Wi-Fi detail */}
          <div style={S.panelRow}>
            <span style={S.panelLabel}>Wi-Fi</span>
            <span style={S.panelValue} data-testid="panel-wifi-value">
              {wifi.connected
                ? `${wifi.ssid ?? '已连接'} · 信号${getWifiStrengthLabel(wifi.strength)}`
                : '未连接'}
            </span>
          </div>

          <div style={S.divider} />

          {/* Time detail */}
          <div style={S.panelRow}>
            <span style={S.panelLabel}>时间</span>
            <span style={S.panelValue} data-testid="panel-time-value">{time}</span>
          </div>
        </div>
      )}
    </div>
  );
}
