import { useMemo } from 'react';
import type { TeleprompterState } from '../../services/Teleprompter';
import { Icon } from '../icons/Icon';

/**
 * TeleprompterView — 提词器界面组件
 *
 * 显示：
 * - 半透明区域文本显示 — 需求 15.3
 * - 可配置字体大小 — 需求 15.1
 * - 自动滚动速度控制 — 需求 15.2
 * - 播放/暂停控制 — 需求 15.5
 * - 手机导入状态 — 需求 15.4
 *
 * 需求: 15.1, 15.2, 15.3, 15.4, 15.5
 */

export interface TeleprompterViewProps {
  /** 提词器状态 */
  state: TeleprompterState;
  /** 播放/暂停切换 */
  onTogglePlayPause?: () => void;
  /** 停止 */
  onStop?: () => void;
  /** 滚动速度变更 */
  onSpeedChange?: (speed: number) => void;
  /** 字体大小变更 */
  onFontSizeChange?: (size: number) => void;
  /** 透明度变更 */
  onOpacityChange?: (opacity: number) => void;
}

const S = {
  container: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(255, 255, 255, 0.92)', zIndex: 1400 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(10, 15, 30, 0.96)', borderBottom: '1px solid rgba(100, 200, 255, 0.06)' },
  title: { fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)' },
  phoneBadge: { fontSize: 11, color: 'rgba(80, 220, 160, 0.9)', background: 'rgba(80, 220, 160, 0.08)', borderRadius: 10, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(80, 220, 160, 0.15)' },
  phoneDisconnected: { fontSize: 11, color: 'rgba(255, 180, 60, 0.9)', background: 'rgba(255, 180, 60, 0.08)', borderRadius: 10, padding: '2px 8px', border: '1px solid rgba(255, 180, 60, 0.15)' },
  textArea: { flex: 1, overflow: 'hidden', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  textContent: { lineHeight: 1.8, whiteSpace: 'pre-wrap' as const, maxWidth: 720, textAlign: 'center' as const },
  noText: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255, 255, 255, 0.25)' },
  controlBar: { padding: '12px 16px', background: 'rgba(10, 15, 30, 0.96)', borderTop: '1px solid rgba(100, 200, 255, 0.06)', display: 'flex', flexDirection: 'column' as const, gap: 10 },
  controlRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 },
  playBtn: { width: 44, height: 44, borderRadius: '50%', background: 'rgba(100, 200, 255, 0.08)', border: '1px solid rgba(100, 200, 255, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(100, 200, 255, 0.95)', transition: 'background 0.15s, box-shadow 0.15s', boxShadow: '0 0 12px rgba(100, 200, 255, 0.06)' },
  stopBtn: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(255, 90, 90, 0.06)', border: '1px solid rgba(255, 90, 90, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255, 90, 90, 0.9)', transition: 'background 0.15s' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
  slider: { flex: 1, height: 4, cursor: 'pointer', accentColor: 'rgba(100, 200, 255, 0.8)' },
  sliderLabel: { minWidth: 60, textAlign: 'right' as const, fontSize: 11, color: 'rgba(255, 255, 255, 0.35)' },
  sliderValue: { minWidth: 36, fontSize: 12, color: 'rgba(100, 200, 255, 0.7)', fontWeight: 500, fontFamily: "'SF Mono', 'Fira Code', monospace" },
  statusIndicator: { fontSize: 12, padding: '4px 10px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4 },
};

function getStatusStyle(status: string) {
  switch (status) {
    case 'playing':
      return {
        ...S.statusIndicator,
        background: 'rgba(80, 220, 160, 0.08)',
        color: 'rgba(80, 220, 160, 0.9)',
        border: '1px solid rgba(80, 220, 160, 0.15)',
      };
    case 'paused':
      return {
        ...S.statusIndicator,
        background: 'rgba(255, 180, 60, 0.08)',
        color: 'rgba(255, 180, 60, 0.9)',
        border: '1px solid rgba(255, 180, 60, 0.15)',
      };
    default:
      return {
        ...S.statusIndicator,
        background: 'rgba(255, 255, 255, 0.04)',
        color: 'rgba(255, 255, 255, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      };
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'playing': return '播放中';
    case 'paused': return '已暂停';
    default: return '就绪';
  }
}

export function TeleprompterView({
  state,
  onTogglePlayPause,
  onStop,
  onSpeedChange,
  onFontSizeChange,
  onOpacityChange,
}: TeleprompterViewProps) {
  const { status, text, scrollSpeed, fontSize, opacity, phoneConnected } = state;

  const containerBg = useMemo(
    () => `rgba(10, 15, 30, ${opacity})`,
    [opacity],
  );

  return (
    <div
      data-testid="teleprompter-view"
      role="region"
      aria-label="提词器"
      style={{ ...S.container, background: containerBg }}
    >
      {/* Top bar */}
      <div style={S.topBar} data-testid="teleprompter-top-bar">
        <span style={S.title}>提词器</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={getStatusStyle(status)} data-testid="status-indicator">
            {getStatusLabel(status)}
          </span>
          {/* Phone connection — 需求 15.4 */}
          {phoneConnected ? (
            <span style={S.phoneBadge} data-testid="phone-connected"><Icon name="phone" size={11} /> 已连接</span>
          ) : (
            <span style={S.phoneDisconnected} data-testid="phone-disconnected"><Icon name="phone" size={11} /> 未连接</span>
          )}
        </div>
      </div>

      {/* Text display area — 需求 15.1, 15.3 */}
      {text ? (
        <div
          style={S.textArea}
          data-testid="text-area"
          aria-live="polite"
        >
          <div
            style={{
              ...S.textContent,
              fontSize,
              color: `rgba(255, 255, 255, ${Math.min(1, opacity + 0.1)})`,
            }}
            data-testid="text-content"
          >
            {text}
          </div>
        </div>
      ) : (
        <div style={S.noText} data-testid="no-text">
          请加载提词文本…
        </div>
      )}

      {/* Control bar — 需求 15.2, 15.5 */}
      <div style={S.controlBar} data-testid="control-bar">
        {/* Play/Pause/Stop controls */}
        <div style={S.controlRow}>
          <button
            style={S.playBtn}
            onClick={onTogglePlayPause}
            data-testid="play-pause-btn"
            aria-label={status === 'playing' ? '暂停' : '播放'}
            disabled={!text}
          >
            {status === 'playing' ? <Icon name="pause" size={18} /> : <Icon name="play" size={18} />}
          </button>
          <button
            style={S.stopBtn}
            onClick={onStop}
            data-testid="stop-btn"
            aria-label="停止"
            disabled={status === 'idle'}
          >
            <Icon name="stop" size={13} />
          </button>
        </div>

        {/* Scroll speed slider — 需求 15.2 */}
        <div style={S.sliderRow} data-testid="speed-control">
          <span style={S.sliderLabel}>滚动速度</span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={scrollSpeed}
            onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
            style={S.slider}
            data-testid="speed-slider"
            aria-label="滚动速度"
          />
          <span style={S.sliderValue}>{scrollSpeed.toFixed(1)}x</span>
        </div>

        {/* Font size slider — 需求 15.1 */}
        <div style={S.sliderRow} data-testid="font-size-control">
          <span style={S.sliderLabel}>字体大小</span>
          <input
            type="range"
            min={12}
            max={72}
            step={2}
            value={fontSize}
            onChange={(e) => onFontSizeChange?.(parseInt(e.target.value, 10))}
            style={S.slider}
            data-testid="font-size-slider"
            aria-label="字体大小"
          />
          <span style={S.sliderValue}>{fontSize}px</span>
        </div>

        {/* Opacity slider — 需求 15.3 */}
        <div style={S.sliderRow} data-testid="opacity-control">
          <span style={S.sliderLabel}>透明度</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onOpacityChange?.(parseFloat(e.target.value))}
            style={S.slider}
            data-testid="opacity-slider"
            aria-label="透明度"
          />
          <span style={S.sliderValue}>{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
