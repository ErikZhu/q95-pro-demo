import { useMemo } from 'react';
import type {
  SettingsPanelState,
  SettingsCategory,
  SettingsChangeResult,
} from '../../services/SettingsPanel';
import { Icon } from '../icons/Icon';

/**
 * SettingsPanelView — 系统设置面板界面组件
 *
 * 显示：
 * - 设置分类列表（显示、声音、连接、交互、隐私、系统）— 需求 18.1, 18.2
 * - 显示亮度、字体大小调节 — 需求 18.3
 * - 通知偏好和交互方式优先级 — 需求 18.3
 * - 蓝牙配对设备和 Wi-Fi 连接管理 — 需求 18.4
 * - 即时应用更改视觉反馈 — 需求 18.5
 *
 * 需求: 18.1, 18.2, 18.3, 18.4, 18.5
 */

export interface SettingsPanelViewProps {
  /** 设置面板状态 */
  state: SettingsPanelState;
  /** 选择分类 */
  onSelectCategory?: (category: SettingsCategory) => void;
  /** 调节亮度 */
  onBrightnessChange?: (level: number) => void;
  /** 调节字体大小 */
  onFontSizeChange?: (size: number) => void;
  /** 切换自动亮度 */
  onAutoBrightnessToggle?: (enabled: boolean) => void;
  /** 切换通知偏好 */
  onNotificationPrefChange?: (app: string, enabled: boolean) => void;
  /** 连接蓝牙设备 */
  onConnectDevice?: (deviceId: string) => void;
  /** 断开蓝牙设备 */
  onDisconnectDevice?: (deviceId: string) => void;
  /** 连接 Wi-Fi */
  onConnectWifi?: (ssid: string) => void;
  /** 断开 Wi-Fi */
  onDisconnectWifi?: () => void;
}

const S = {
  container: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(15, 25, 45, 0.96), rgba(10, 10, 26, 0.98))', display: 'flex', flexDirection: 'column' as const, fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(255, 255, 255, 0.92)', zIndex: 1400 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(10, 15, 30, 0.96)', borderBottom: '1px solid rgba(110, 54, 238, 0.06)' },
  title: { fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)' },
  body: { flex: 1, display: 'flex', flexDirection: 'row' as const, overflow: 'hidden' as const },
  sidebar: { width: 140, borderRight: '1px solid rgba(110, 54, 238, 0.06)', display: 'flex', flexDirection: 'column' as const, padding: '8px 0', overflowY: 'auto' as const },
  catBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'transparent', color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, cursor: 'pointer', textAlign: 'left' as const, width: '100%', transition: 'background 0.15s, color 0.15s' },
  catBtnActive: { background: 'rgba(110, 54, 238, 0.06)', color: 'rgba(110, 54, 238, 0.95)', borderLeft: '2px solid rgba(110, 54, 238, 0.7)' },
  detail: { flex: 1, padding: 16, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 4 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(110, 54, 238, 0.04)' },
  label: { fontSize: 13, color: 'rgba(255, 255, 255, 0.75)' },
  value: { fontSize: 13, color: 'rgba(110, 54, 238, 0.9)', fontFamily: "'SF Mono', 'Fira Code', monospace" },
  slider: { width: 120, accentColor: 'rgba(110, 54, 238, 0.8)' },
  toggle: { width: 40, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'background 0.15s' },
  toggleOn: { background: 'rgba(110, 54, 238, 0.2)', color: 'rgba(110, 54, 238, 0.95)' },
  toggleOff: { background: 'rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.35)' },
  deviceRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(110, 54, 238, 0.04)' },
  connBtn: { padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(110, 54, 238, 0.2)', background: 'rgba(110, 54, 238, 0.06)', color: 'rgba(110, 54, 238, 0.9)', fontSize: 11, cursor: 'pointer', transition: 'background 0.15s' },
  disconnBtn: { padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(255, 90, 90, 0.2)', background: 'rgba(255, 90, 90, 0.06)', color: 'rgba(255, 90, 90, 0.9)', fontSize: 11, cursor: 'pointer', transition: 'background 0.15s' },
  feedback: { padding: '8px 12px', borderRadius: 8, background: 'rgba(140, 80, 255, 0.06)', border: '1px solid rgba(140, 80, 255, 0.2)', fontSize: 12, color: 'rgba(140, 80, 255, 0.9)' },
  feedbackFail: { background: 'rgba(255, 90, 90, 0.06)', border: '1px solid rgba(255, 90, 90, 0.2)', color: 'rgba(255, 90, 90, 0.9)' },
  emptyHint: { textAlign: 'center' as const, color: 'rgba(255, 255, 255, 0.25)', fontSize: 13, padding: 32 },
};

/** 渲染显示设置 — 需求 18.3 */
function DisplaySettings({
  state,
  onBrightnessChange,
  onFontSizeChange,
  onAutoBrightnessToggle,
}: Pick<SettingsPanelViewProps, 'state' | 'onBrightnessChange' | 'onFontSizeChange' | 'onAutoBrightnessToggle'>) {
  const { settings } = state;
  return (
    <>
      <div style={S.sectionTitle}>显示设置</div>
      <div style={S.row}>
        <span style={S.label}>亮度</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.displayBrightness}
            onChange={(e) => onBrightnessChange?.(Number(e.target.value))}
            style={S.slider}
            data-testid="brightness-slider"
            aria-label="显示亮度"
          />
          <span style={S.value}>{settings.displayBrightness}%</span>
        </div>
      </div>
      <div style={S.row}>
        <span style={S.label}>自动亮度</span>
        <button
          style={{ ...S.toggle, ...(settings.autoBrightness ? S.toggleOn : S.toggleOff) }}
          onClick={() => onAutoBrightnessToggle?.(!settings.autoBrightness)}
          data-testid="auto-brightness-toggle"
          aria-label={settings.autoBrightness ? '关闭自动亮度' : '开启自动亮度'}
        >
          {settings.autoBrightness ? 'ON' : 'OFF'}
        </button>
      </div>
      <div style={S.row}>
        <span style={S.label}>字体大小</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={10}
            max={24}
            value={settings.fontSize}
            onChange={(e) => onFontSizeChange?.(Number(e.target.value))}
            style={S.slider}
            data-testid="font-size-slider"
            aria-label="字体大小"
          />
          <span style={S.value}>{settings.fontSize}px</span>
        </div>
      </div>
    </>
  );
}

/** 渲染声音设置 */
function SoundSettings({ state }: Pick<SettingsPanelViewProps, 'state'>) {
  return (
    <>
      <div style={S.sectionTitle}>声音设置</div>
      <div style={S.row}>
        <span style={S.label}>唤醒词</span>
        <span style={S.value} data-testid="wake-word">{state.settings.wakeWord}</span>
      </div>
    </>
  );
}

/** 渲染连接设置 — 需求 18.4 */
function ConnectivitySettings({
  state,
  onConnectDevice,
  onDisconnectDevice,
  onConnectWifi,
  onDisconnectWifi,
}: Pick<SettingsPanelViewProps, 'state' | 'onConnectDevice' | 'onDisconnectDevice' | 'onConnectWifi' | 'onDisconnectWifi'>) {
  return (
    <>
      <div style={S.sectionTitle}>蓝牙设备</div>
      {state.pairedDevices.map((device) => (
        <div key={device.id} style={S.deviceRow} data-testid={`device-${device.id}`}>
          <div>
            <div style={S.label}>{device.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{device.type}</div>
          </div>
          {device.connected ? (
            <button
              style={S.disconnBtn}
              onClick={() => onDisconnectDevice?.(device.id)}
              data-testid={`disconnect-${device.id}`}
              aria-label={`断开 ${device.name}`}
            >
              断开
            </button>
          ) : (
            <button
              style={S.connBtn}
              onClick={() => onConnectDevice?.(device.id)}
              data-testid={`connect-${device.id}`}
              aria-label={`连接 ${device.name}`}
            >
              连接
            </button>
          )}
        </div>
      ))}

      <div style={{ ...S.sectionTitle, marginTop: 8 }}>Wi-Fi 网络</div>
      {state.wifiNetworks.map((net) => (
        <div key={net.ssid} style={S.deviceRow} data-testid={`wifi-${net.ssid}`}>
          <div>
            <div style={S.label}>
              {net.ssid} {net.secured ? <Icon name="lock" size={11} style={{ verticalAlign: 'middle', marginLeft: 4 }} /> : null} 
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              信号: {net.strength}%
            </div>
          </div>
          {net.connected ? (
            <button
              style={S.disconnBtn}
              onClick={() => onDisconnectWifi?.()}
              data-testid={`disconnect-wifi-${net.ssid}`}
              aria-label={`断开 ${net.ssid}`}
            >
              断开
            </button>
          ) : (
            <button
              style={S.connBtn}
              onClick={() => onConnectWifi?.(net.ssid)}
              data-testid={`connect-wifi-${net.ssid}`}
              aria-label={`连接 ${net.ssid}`}
            >
              连接
            </button>
          )}
        </div>
      ))}
    </>
  );
}

/** 渲染交互设置 — 需求 18.3 */
function InteractionSettings({ state }: Pick<SettingsPanelViewProps, 'state'>) {
  return (
    <>
      <div style={S.sectionTitle}>交互方式优先级</div>
      {state.settings.interactionPriority.map((source, idx) => (
        <div key={source} style={S.row} data-testid={`priority-${source}`}>
          <span style={S.label}>{idx + 1}. {source}</span>
        </div>
      ))}
    </>
  );
}

/** 渲染隐私设置 */
function PrivacySettings({
  state,
  onNotificationPrefChange,
}: Pick<SettingsPanelViewProps, 'state' | 'onNotificationPrefChange'>) {
  const prefs = state.settings.notificationPrefs;
  return (
    <>
      <div style={S.sectionTitle}>通知偏好</div>
      {Object.entries(prefs).map(([app, enabled]) => (
        <div key={app} style={S.row} data-testid={`notif-pref-${app}`}>
          <span style={S.label}>{app}</span>
          <button
            style={{ ...S.toggle, ...(enabled ? S.toggleOn : S.toggleOff) }}
            onClick={() => onNotificationPrefChange?.(app, !enabled)}
            data-testid={`notif-toggle-${app}`}
            aria-label={enabled ? `关闭 ${app} 通知` : `开启 ${app} 通知`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}
    </>
  );
}

/** 渲染系统设置 */
function SystemSettings() {
  return (
    <>
      <div style={S.sectionTitle}>系统信息</div>
      <div style={S.row}>
        <span style={S.label}>设备型号</span>
        <span style={S.value}>Q95 Pro</span>
      </div>
      <div style={S.row}>
        <span style={S.label}>系统版本</span>
        <span style={S.value}>1.0.0-demo</span>
      </div>
    </>
  );
}

/** 渲染分类详情内容 */
function CategoryDetail(props: SettingsPanelViewProps) {
  const { state } = props;
  switch (state.activeCategory) {
    case 'display':
      return <DisplaySettings {...props} />;
    case 'sound':
      return <SoundSettings state={state} />;
    case 'connectivity':
      return <ConnectivitySettings {...props} />;
    case 'interaction':
      return <InteractionSettings state={state} />;
    case 'privacy':
      return <PrivacySettings {...props} />;
    case 'system':
      return <SystemSettings />;
    default:
      return <div style={S.emptyHint} data-testid="no-category">请选择设置分类</div>;
  }
}

/** 变更反馈提示 — 需求 18.5 */
function ChangeFeedback({ change }: { change: SettingsChangeResult | null }) {
  if (!change) return null;
  const isSuccess = change.success;
  return (
    <div
      style={{ ...S.feedback, ...(isSuccess ? {} : S.feedbackFail) }}
      data-testid="change-feedback"
      role="status"
      aria-live="polite"
    >
      <Icon name={isSuccess ? 'check' : 'warning'} size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
      设置已{isSuccess ? '应用' : '失败'}：{change.key}
    </div>
  );
}

export function SettingsPanelView(props: SettingsPanelViewProps) {
  const { state, onSelectCategory } = props;

  const categoryCount = useMemo(() => state.categories.length, [state.categories]);

  return (
    <div
      data-testid="settings-panel"
      role="region"
      aria-label="系统设置"
      style={S.container}
    >
      {/* Top bar */}
      <div style={S.topBar} data-testid="settings-top-bar">
        <span style={S.title}>设置</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {categoryCount} 个分类
        </span>
      </div>

      {/* Body: sidebar + detail */}
      <div style={S.body}>
        {/* 分类列表 — 需求 18.2 */}
        <nav style={S.sidebar} data-testid="category-list" aria-label="设置分类">
          {state.categories.map((cat) => (
            <button
              key={cat.id}
              style={{
                ...S.catBtn,
                ...(state.activeCategory === cat.id ? S.catBtnActive : {}),
              }}
              onClick={() => onSelectCategory?.(cat.id)}
              data-testid={`category-${cat.id}`}
              aria-current={state.activeCategory === cat.id ? 'true' : undefined}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>

        {/* 设置详情 */}
        <div style={S.detail} data-testid="settings-detail">
          {/* 变更反馈 — 需求 18.5 */}
          <ChangeFeedback change={state.lastChange} />
          <CategoryDetail {...props} />
        </div>
      </div>
    </div>
  );
}
