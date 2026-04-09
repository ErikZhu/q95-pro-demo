import { useState, useCallback, useEffect, useRef } from 'react';
import type { InputEvent, InputSource } from '../../types/interaction';
import { Icon } from '../icons/Icon';

/**
 * DemoControlPanel — 多模态交互模拟面板
 *
 * 提供模拟六种交互方式的浮动操作面板，支持键盘映射、
 * 鼠标模拟触控、按钮模拟手势等，实现接近真实体验的动效和响应速度。
 *
 * 需求: 22.2, 22.4
 */

export interface DemoControlPanelProps {
  /** 是否显示面板 */
  visible: boolean;
  /** 切换面板显示 */
  onToggle: () => void;
  /** 交互事件回调 */
  onInput: (event: InputEvent) => void;
  /** 模拟眼动光标位置回调 (百分比 0-100)，null 表示离开追踪区域 */
  onGazeCursorMove?: (pos: { x: number; y: number } | null) => void;
}

/* ── Helpers ── */

function makeEvent(
  source: InputSource,
  type: string,
  data: Record<string, unknown> = {},
): InputEvent {
  return { source, type, data, timestamp: Date.now() };
}

/** 键盘映射配置 */
const KEYBOARD_MAP: Record<string, { source: InputSource; type: string; data?: Record<string, unknown>; label: string }> = {
  p: { source: 'physical_button', type: 'power', label: '电源' },
  Enter: { source: 'physical_button', type: 'confirm', label: '确认' },
  Escape: { source: 'physical_button', type: 'back', label: '返回' },
  '+': { source: 'physical_button', type: 'volume_up', label: '音量+' },
  '-': { source: 'physical_button', type: 'volume_down', label: '音量-' },
  ArrowUp: { source: 'side_touchpad', type: 'swipe', data: { direction: 'up' }, label: '上滑' },
  ArrowDown: { source: 'side_touchpad', type: 'swipe', data: { direction: 'down' }, label: '下滑' },
  ArrowLeft: { source: 'side_touchpad', type: 'swipe', data: { direction: 'left' }, label: '左滑' },
  ArrowRight: { source: 'side_touchpad', type: 'swipe', data: { direction: 'right' }, label: '右滑' },
  ' ': { source: 'side_touchpad', type: 'tap', label: '点击' },
};

/** 活跃按钮的闪烁持续时间 (ms) — 需求 22.4 */
const FLASH_DURATION_MS = 150;

/* ── Styles ── */

const S = {
  overlay: (visible: boolean): React.CSSProperties => ({
    position: 'fixed', top: 0, right: 0, bottom: 0, width: 300, zIndex: 10000,
    background: 'rgba(10, 10, 26, 0.96)', backdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(110, 54, 238, 0.08)',
    transform: visible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
  }),
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(110, 54, 238, 0.06)', flexShrink: 0 } as React.CSSProperties,
  title: { fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.92)', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.4)', fontSize: 18, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, lineHeight: 1 } as React.CSSProperties,
  body: { flex: 1, overflowY: 'auto' as const, padding: '8px 10px', display: 'flex', flexDirection: 'column' as const, gap: 10 } as React.CSSProperties,
  section: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column' as const, gap: 6, border: '1px solid rgba(110, 54, 238, 0.04)' } as React.CSSProperties,
  sectionLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  row: { display: 'flex', flexWrap: 'wrap' as const, gap: 4 } as React.CSSProperties,
  btn: (active: boolean): React.CSSProperties => ({
    padding: '5px 10px', fontSize: 11, borderRadius: 6,
    border: `1px solid ${active ? 'rgba(110, 54, 238, 0.3)' : 'rgba(110, 54, 238, 0.08)'}`,
    background: active ? 'rgba(110, 54, 238, 0.15)' : 'rgba(255, 255, 255, 0.03)',
    color: active ? 'rgba(110, 54, 238, 0.95)' : 'rgba(255, 255, 255, 0.75)',
    cursor: 'pointer', whiteSpace: 'nowrap' as const, lineHeight: 1.4,
    transition: 'background 0.12s, transform 0.1s, border-color 0.12s',
    transform: active ? 'scale(0.95)' : 'scale(1)', userSelect: 'none' as const,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }),
  kbd: { fontSize: 9, color: 'rgba(255, 255, 255, 0.2)', marginLeft: 4 } as React.CSSProperties,
  inputRow: { display: 'flex', gap: 4 } as React.CSSProperties,
  textInput: { flex: 1, padding: '5px 8px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(110, 54, 238, 0.08)', background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.92)', outline: 'none', transition: 'border-color 0.15s' } as React.CSSProperties,
  trackArea: { width: '100%', height: 70, borderRadius: 8, border: '1px solid rgba(110, 54, 238, 0.08)', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255, 255, 255, 0.25)', cursor: 'crosshair', position: 'relative' as const, userSelect: 'none' as const } as React.CSSProperties,
  cursor: (x: number, y: number): React.CSSProperties => ({ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 8, height: 8, borderRadius: '50%', background: 'rgba(110, 54, 238, 0.8)', boxShadow: '0 0 8px rgba(110, 54, 238, 0.4)', transform: 'translate(-50%, -50%)', transition: 'left 0.05s, top 0.05s', pointerEvents: 'none' as const }),
  footer: { padding: '8px 14px', borderTop: '1px solid rgba(110, 54, 238, 0.06)', fontSize: 10, color: 'rgba(255, 255, 255, 0.25)', textAlign: 'center' as const, flexShrink: 0 } as React.CSSProperties,
};

/* ── Component ── */

export function DemoControlPanel({ visible, onToggle, onInput, onGazeCursorMove }: DemoControlPanelProps) {
  const [voiceText, setVoiceText] = useState('');
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = useCallback(
    (id: string, source: InputSource, type: string, data: Record<string, unknown> = {}) => {
      onInput(makeEvent(source, type, data));
      setActiveBtn(id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setActiveBtn(null), FLASH_DURATION_MS);
    },
    [onInput],
  );

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      const mapping = KEYBOARD_MAP[e.key];
      if (!mapping) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      e.preventDefault();
      fire(`kb-${e.key}`, mapping.source, mapping.type, mapping.data ?? {});
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, fire]);

  useEffect(() => { return () => { if (flashTimer.current) clearTimeout(flashTimer.current); }; }, []);

  const handleVoiceSubmit = () => {
    const text = voiceText.trim();
    if (!text) return;
    fire('voice-send', 'voice', 'command', { text });
    setVoiceText('');
  };

  const handleTrackMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setCursorPos({ x, y });
    fire('head-move', 'head_tracking', 'move', { x, y });
    onGazeCursorMove?.({ x, y });
  };

  const handleTrackLeave = () => {
    onGazeCursorMove?.(null);
  };

  return (
    <div style={S.overlay(visible)} data-testid="demo-control-panel" role="dialog" aria-label="多模态交互模拟面板" aria-hidden={!visible}>
      <div style={S.header}>
        <span style={S.title}><Icon name="gamepad" size={14} /> 交互模拟面板</span>
        <button style={S.closeBtn} onClick={onToggle} data-testid="panel-close" aria-label="关闭面板">✕</button>
      </div>
      <div style={S.body}>
        {/* 1. 物理按键 */}
        <div style={S.section} data-testid="section-physical-button">
          <div style={S.sectionLabel}><Icon name="keyboard" size={12} /> 物理按键 Physical Buttons</div>
          <div style={S.row}>
            <button style={S.btn(activeBtn === 'btn-power')} data-testid="btn-power" onClick={() => fire('btn-power', 'physical_button', 'power')}>
              <Icon name="power" size={11} /> 电源 <span style={S.kbd}>[P]</span>
            </button>
            <button style={S.btn(activeBtn === 'btn-confirm')} data-testid="btn-confirm" onClick={() => fire('btn-confirm', 'physical_button', 'confirm')}>
              <Icon name="confirm" size={11} /> 确认 <span style={S.kbd}>[Enter]</span>
            </button>
            <button style={S.btn(activeBtn === 'btn-back')} data-testid="btn-back" onClick={() => fire('btn-back', 'physical_button', 'back')}>
              <Icon name="back" size={11} /> 返回 <span style={S.kbd}>[Esc]</span>
            </button>
            <button style={S.btn(activeBtn === 'btn-vol-up')} data-testid="btn-vol-up" onClick={() => fire('btn-vol-up', 'physical_button', 'volume_up')}>
              <Icon name="volume-up" size={11} /> 音量+ <span style={S.kbd}>[+]</span>
            </button>
            <button style={S.btn(activeBtn === 'btn-vol-down')} data-testid="btn-vol-down" onClick={() => fire('btn-vol-down', 'physical_button', 'volume_down')}>
              <Icon name="volume-down" size={11} /> 音量- <span style={S.kbd}>[-]</span>
            </button>
          </div>
        </div>

        {/* 2. 语音 */}
        <div style={S.section} data-testid="section-voice">
          <div style={S.sectionLabel}><Icon name="mic" size={12} /> 语音 Voice</div>
          <div style={S.inputRow}>
            <input style={S.textInput} data-testid="voice-text-input" placeholder="输入语音指令..." value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleVoiceSubmit(); } }} />
            <button style={S.btn(activeBtn === 'voice-send')} data-testid="voice-send-btn" onClick={handleVoiceSubmit}>发送</button>
          </div>
        </div>

        {/* 3. EMG 手环 */}
        <div style={S.section} data-testid="section-emg-band">
          <div style={S.sectionLabel}><Icon name="fist" size={12} /> EMG 手环 EMG Band</div>
          <div style={S.row}>
            <button style={S.btn(activeBtn === 'emg-pinch')} data-testid="emg-pinch" onClick={() => fire('emg-pinch', 'emg_band', 'pinch')}>
              <Icon name="pinch" size={11} /> 捏合
            </button>
            <button style={S.btn(activeBtn === 'emg-double-pinch')} data-testid="emg-double-pinch" onClick={() => fire('emg-double-pinch', 'emg_band', 'double_pinch')}>
              <Icon name="pinch" size={11} /> 双击捏合
            </button>
            <button style={S.btn(activeBtn === 'emg-fist')} data-testid="emg-fist" onClick={() => fire('emg-fist', 'emg_band', 'fist')}>
              <Icon name="fist" size={11} /> 握拳
            </button>
          </div>
        </div>

        {/* 4. 侧边触控 */}
        <div style={S.section} data-testid="section-side-touchpad">
          <div style={S.sectionLabel}><Icon name="touch" size={12} /> 侧边触控 Side Touchpad</div>
          <div style={S.row}>
            <button style={S.btn(activeBtn === 'tp-up')} data-testid="tp-swipe-up" onClick={() => fire('tp-up', 'side_touchpad', 'swipe', { direction: 'up' })}>
              <Icon name="arrow-up" size={11} /> 上滑 <span style={S.kbd}>[↑]</span>
            </button>
            <button style={S.btn(activeBtn === 'tp-down')} data-testid="tp-swipe-down" onClick={() => fire('tp-down', 'side_touchpad', 'swipe', { direction: 'down' })}>
              <Icon name="arrow-down" size={11} /> 下滑 <span style={S.kbd}>[↓]</span>
            </button>
            <button style={S.btn(activeBtn === 'tp-left')} data-testid="tp-swipe-left" onClick={() => fire('tp-left', 'side_touchpad', 'swipe', { direction: 'left' })}>
              <Icon name="arrow-left" size={11} /> 左滑 <span style={S.kbd}>[←]</span>
            </button>
            <button style={S.btn(activeBtn === 'tp-right')} data-testid="tp-swipe-right" onClick={() => fire('tp-right', 'side_touchpad', 'swipe', { direction: 'right' })}>
              <Icon name="arrow-right" size={11} /> 右滑 <span style={S.kbd}>[→]</span>
            </button>
            <button style={S.btn(activeBtn === 'tp-tap')} data-testid="tp-tap" onClick={() => fire('tp-tap', 'side_touchpad', 'tap')}>
              <Icon name="touch" size={11} /> 点击 <span style={S.kbd}>[Space]</span>
            </button>
          </div>
        </div>

        {/* 5. 摄像头手势 */}
        <div style={S.section} data-testid="section-camera-gesture">
          <div style={S.sectionLabel}><Icon name="camera-gesture" size={12} /> 摄像头手势 Camera Gesture</div>
          <div style={S.row}>
            <button style={S.btn(activeBtn === 'cam-palm')} data-testid="cam-palm-stop" onClick={() => fire('cam-palm', 'camera_gesture', 'palm_stop')}>
              <Icon name="hand" size={11} /> 手掌停止
            </button>
            <button style={S.btn(activeBtn === 'cam-point')} data-testid="cam-point" onClick={() => fire('cam-point', 'camera_gesture', 'point')}>
              <Icon name="point" size={11} /> 指向
            </button>
            <button style={S.btn(activeBtn === 'cam-wave')} data-testid="cam-wave" onClick={() => fire('cam-wave', 'camera_gesture', 'wave')}>
              <Icon name="wave" size={11} /> 挥手
            </button>
            <button style={S.btn(activeBtn === 'cam-thumbs')} data-testid="cam-thumbs-up" onClick={() => fire('cam-thumbs', 'camera_gesture', 'thumbs_up')}>
              <Icon name="thumbsup" size={11} /> 点赞
            </button>
          </div>
        </div>

        {/* 6. 头部追踪 */}
        <div style={S.section} data-testid="section-head-tracking">
          <div style={S.sectionLabel}><Icon name="crosshair" size={12} /> 头部追踪 Head Tracking</div>
          <div style={S.row}>
            <button style={S.btn(activeBtn === 'head-nod')} data-testid="head-nod" onClick={() => fire('head-nod', 'head_tracking', 'nod')}>
              <Icon name="nod" size={11} /> 点头
            </button>
            <button style={S.btn(activeBtn === 'head-shake')} data-testid="head-shake" onClick={() => fire('head-shake', 'head_tracking', 'shake')}>
              <Icon name="shake" size={11} /> 摇头
            </button>
          </div>
          <div style={S.sectionLabel}><Icon name="eye" size={12} /> 模拟眼动 Gaze Simulation</div>
          <div style={S.trackArea} data-testid="head-track-area" onMouseMove={handleTrackMove} onMouseLeave={handleTrackLeave} role="region" aria-label="模拟眼动 — 移动鼠标模拟注视光标">
            <div style={S.cursor(cursorPos.x, cursorPos.y)} data-testid="head-cursor" />
            <span style={{ pointerEvents: 'none' }}>移动鼠标模拟注视</span>
          </div>
        </div>
      </div>
      <div style={S.footer}>键盘快捷键在面板打开时生效 · P/Enter/Esc/+/-/方向键/空格</div>
    </div>
  );
}

export { KEYBOARD_MAP, makeEvent, FLASH_DURATION_MS };
