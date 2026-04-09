import { useState, useCallback, useRef } from 'react';
import type { DeviceStatus } from '../../types/data';
import { Icon, type IconName } from '../icons/Icon';

/**
 * Launcher — 主界面组件（极简模式）
 *
 * 默认视野清爽，右上角紧凑显示：时间、电池、信号、AI 任务状态、收纳图标。
 * 注视（hover 模拟）收纳图标时展开应用快捷入口网格。
 *
 * 需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
 */

export interface LauncherProps {
  deviceStatus: DeviceStatus;
  onLaunchApp: (appId: string) => Promise<void>;
  date?: string;
}

export interface AppShortcut { id: string; icon: IconName; label: string; }

export const APP_SHORTCUTS: AppShortcut[] = [
  { id: 'ar_navigation', icon: 'compass', label: 'AR 导航' },
  { id: 'camera', icon: 'camera', label: '相机' },
  { id: 'music', icon: 'music', label: '音乐' },
  { id: 'translator', icon: 'globe', label: '翻译' },
  { id: 'teleprompter', icon: 'text', label: '提词器' },
  { id: 'health', icon: 'heart', label: '健康' },
];

const MAX_RETRIES = 3;
const LAUNCH_TIMEOUT_MS = 500;
/** 注视展开延迟 ms — 需求 5.4 */
const GAZE_EXPAND_DELAY = 800;
/** 视线移开收起延迟 ms — 需求 5.5 */
const GAZE_COLLAPSE_DELAY = 2000;

type LaunchState = 'idle' | 'loading' | 'error';
interface LaunchStatus { state: LaunchState; appId: string | null; errorMessage: string | null; retryCount: number; }

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('启动超时')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function getBatteryColor(level: number, isCharging: boolean): string {
  if (isCharging) return '#4FC3F7';
  if (level < 5) return '#FF5252';
  if (level < 20) return '#FFA726';
  return '#66BB6A';
}

export function Launcher({ deviceStatus, onLaunchApp }: LauncherProps) {
  const [expanded, setExpanded] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus>({ state: 'idle', appId: null, errorMessage: null, retryCount: 0 });
  const retryCountRef = useRef(0);
  const gazeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doLaunch = useCallback(async (appId: string, retries: number) => {
    setLaunchStatus({ state: 'loading', appId, errorMessage: null, retryCount: retries });
    try {
      await withTimeout(onLaunchApp(appId), LAUNCH_TIMEOUT_MS);
      setLaunchStatus({ state: 'idle', appId: null, errorMessage: null, retryCount: 0 });
      retryCountRef.current = 0;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '启动失败';
      const nextRetry = retries + 1;
      if (nextRetry < MAX_RETRIES) { retryCountRef.current = nextRetry; doLaunch(appId, nextRetry); }
      else { retryCountRef.current = 0; setLaunchStatus({ state: 'error', appId, errorMessage: message, retryCount: nextRetry }); }
    }
  }, [onLaunchApp]);

  const handleAppClick = useCallback((appId: string) => {
    if (launchStatus.state === 'loading') return;
    retryCountRef.current = 0;
    doLaunch(appId, 0);
  }, [doLaunch, launchStatus.state]);

  const handleManualRetry = useCallback(() => {
    if (launchStatus.appId) { retryCountRef.current = 0; doLaunch(launchStatus.appId, 0); }
  }, [doLaunch, launchStatus.appId]);

  const handleDismissError = useCallback(() => {
    setLaunchStatus({ state: 'idle', appId: null, errorMessage: null, retryCount: 0 });
  }, []);

  /* 注视展开 — hover 模拟 gaze detection (需求 5.4) */
  const _handleGazeEnter = useCallback(() => {
    if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null; }
    gazeTimerRef.current = setTimeout(() => setExpanded(true), GAZE_EXPAND_DELAY);
  }, []);

  const _handleGazeLeave = useCallback(() => {
    if (gazeTimerRef.current) { clearTimeout(gazeTimerRef.current); gazeTimerRef.current = null; }
    collapseTimerRef.current = setTimeout(() => setExpanded(false), GAZE_COLLAPSE_DELAY);
  }, []);

  /* 展开区域也需要保持 hover */
  const handleGridEnter = useCallback(() => {
    if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null; }
  }, []);

  const handleGridLeave = useCallback(() => {
    collapseTimerRef.current = setTimeout(() => setExpanded(false), GAZE_COLLAPSE_DELAY);
  }, []);

  const { battery, bluetooth: _bluetooth, wifi: _wifi, time: _time } = deviceStatus;
  const _batteryColor = getBatteryColor(battery.level, battery.isCharging);
  const isLoading = launchStatus.state === 'loading';

  return (
    <div style={S.root} data-testid="launcher">
      {/* 空白画布 — 无任务时的主体区域 */}
      <div style={S.canvas} data-testid="launcher-canvas">
        {/* 科技感呼吸边框 */}
        <div className="tech-breathing-frame" data-testid="launcher-tech-frame">
          <div className="tech-frame-corner tl" />
          <div className="tech-frame-corner tr" />
          <div className="tech-frame-corner bl" />
          <div className="tech-frame-corner br" />
        </div>
      </div>


      {/* 展开的应用网格 — 需求 5.3, 5.4 */}
      {expanded && (
        <div
          style={S.appGrid}
          onMouseEnter={handleGridEnter}
          onMouseLeave={handleGridLeave}
          data-testid="launcher-app-grid"
        >
          {APP_SHORTCUTS.map((app) => (
            <button
              key={app.id}
              style={S.appBtn(launchStatus.appId === app.id && isLoading, isLoading)}
              onClick={() => handleAppClick(app.id)}
              disabled={isLoading}
              data-testid={`app-${app.id}`}
              aria-label={`启动${app.label}`}
            >
              <span style={S.appIcon}><Icon name={app.icon} size={20} /></span>
              <span style={S.appLabel}>{app.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div style={S.loadingOverlay} data-testid="launcher-loading">
          <Icon name="loader" size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={S.loadingText}>
            正在启动{APP_SHORTCUTS.find((a) => a.id === launchStatus.appId)?.label ?? '应用'}...
          </span>
        </div>
      )}

      {/* Error banner — 需求 5.8 */}
      {launchStatus.state === 'error' && (
        <div style={S.errorBanner} data-testid="launcher-error" role="alert">
          <span><Icon name="alert" size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {launchStatus.errorMessage}</span>
          <button style={S.retryBtn} onClick={handleManualRetry} data-testid="launcher-retry-btn">重试</button>
          <button style={{ ...S.retryBtn, background: 'transparent' }} onClick={handleDismissError} data-testid="launcher-dismiss-btn" aria-label="关闭错误提示">✕</button>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */
const S = {
  root: {
    width: '100%', height: '100%', position: 'relative' as const,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)', userSelect: 'none' as const,
  },

  canvas: {
    position: 'absolute' as const, inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 40%, rgba(110, 54, 238, 0.02) 0%, transparent 70%)',
    borderRadius: 4, zIndex: 0,
  } as React.CSSProperties,

  statusCluster: {
    position: 'absolute' as const, top: 6, right: 8,
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 10, color: 'rgba(255, 255, 255, 0.6)',
    zIndex: 20,
  },

  statusTime: {
    fontSize: 11, fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.8, fontFamily: "'SF Mono', 'Fira Code', monospace",
  } as React.CSSProperties,

  statusItem: {
    display: 'flex', alignItems: 'center', gap: 2, fontSize: 10,
  } as React.CSSProperties,

  drawerTrigger: (expanded: boolean): React.CSSProperties => ({
    width: 24, height: 24, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: expanded ? 'rgba(110, 54, 238, 0.15)' : 'rgba(255, 255, 255, 0.06)',
    border: `1px solid ${expanded ? 'rgba(110, 54, 238, 0.4)' : 'rgba(110, 54, 238, 0.12)'}`,
    cursor: 'pointer',
    transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: expanded ? '0 0 12px rgba(110, 54, 238, 0.1)' : 'none',
  }),

  drawerIcon: { fontSize: 14, color: 'rgba(255, 255, 255, 0.75)' } as React.CSSProperties,

  appGrid: {
    position: 'absolute' as const, top: 30, right: 8,
    display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 4,
    padding: 8, borderRadius: 12,
    background: 'rgba(10, 15, 30, 0.92)', backdropFilter: 'blur(16px)',
    border: '1px solid rgba(110, 54, 238, 0.12)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(110, 54, 238, 0.06)',
    zIndex: 30,
    animation: 'fadeIn 0.15s cubic-bezier(0, 0, 0.2, 1)',
  } as React.CSSProperties,

  appBtn: (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
    padding: 6, borderRadius: 8, border: '1px solid transparent',
    background: isActive ? 'rgba(110, 54, 238, 0.15)' : 'rgba(255, 255, 255, 0.04)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.4 : 1,
    transition: 'background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s',
    color: 'rgba(255, 255, 255, 0.92)', fontFamily: 'inherit', outline: 'none',
  }),

  appIcon: { fontSize: 20, lineHeight: 1, filter: 'drop-shadow(0 0 4px rgba(110, 54, 238, 0.15))' } as React.CSSProperties,
  appLabel: { fontSize: 8, color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap' as const } as React.CSSProperties,

  loadingOverlay: {
    position: 'absolute' as const, inset: 0,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'rgba(10, 10, 26, 0.6)', backdropFilter: 'blur(8px)', borderRadius: 8, zIndex: 40,
  } as React.CSSProperties,

  loadingText: { fontSize: 11, color: 'rgba(110, 54, 238, 0.8)', letterSpacing: 0.3 } as React.CSSProperties,

  errorBanner: {
    position: 'absolute' as const, bottom: 8, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 90, 90, 0.15)', backdropFilter: 'blur(12px)', borderRadius: 8,
    padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, color: 'rgba(255, 90, 90, 0.95)', zIndex: 40, whiteSpace: 'nowrap' as const,
    border: '1px solid rgba(255, 90, 90, 0.25)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,

  retryBtn: {
    background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 4, padding: '2px 8px', color: '#fff', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s',
  } as React.CSSProperties,
};
