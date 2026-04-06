import { useState } from 'react';
import type { InputEvent, InputSource } from '../../types/interaction';
import { Icon } from '../icons/Icon';

/**
 * InteractionSimulator — 多模态交互输入模拟组件
 *
 * 为 Demo 提供模拟六种交互方式的 UI 控件，用于侧面板。
 * 每个控件触发 onInput 回调，携带对应的 InputEvent。
 *
 * 需求: 6.4, 6.5, 6.6, 6.7
 */

export interface InteractionSimulatorProps {
  onInput: (event: InputEvent) => void;
}

/* ── Helpers ── */

function makeEvent(source: InputSource, type: string, data: Record<string, unknown> = {}): InputEvent {
  return { source, type, data, timestamp: Date.now() };
}

/* ── Inline styles ── */

const S = {
  root: { fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(255, 255, 255, 0.92)', fontSize: 12, display: 'flex', flexDirection: 'column' as const, gap: 12, padding: 10, userSelect: 'none' as const, maxWidth: 260 },
  group: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column' as const, gap: 6, border: '1px solid rgba(100, 200, 255, 0.04)' },
  groupLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(100, 200, 255, 0.4)', textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 2 },
  row: { display: 'flex', flexWrap: 'wrap' as const, gap: 4 },
  btn: { padding: '4px 8px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(100, 200, 255, 0.08)', background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.75)', cursor: 'pointer', whiteSpace: 'nowrap' as const, lineHeight: 1.4, transition: 'background 0.15s, border-color 0.15s' },
  inputRow: { display: 'flex', gap: 4 },
  textInput: { flex: 1, padding: '4px 6px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(100, 200, 255, 0.08)', background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.92)', outline: 'none', transition: 'border-color 0.15s' },
  trackArea: { width: '100%', height: 60, borderRadius: 8, border: '1px solid rgba(100, 200, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255, 255, 255, 0.25)', cursor: 'crosshair', position: 'relative' as const },
};

export function InteractionSimulator({ onInput }: InteractionSimulatorProps) {
  const [voiceText, setVoiceText] = useState('');

  const fire = (source: InputSource, type: string, data: Record<string, unknown> = {}) => {
    onInput(makeEvent(source, type, data));
  };

  const handleVoiceSubmit = () => {
    const text = voiceText.trim();
    if (!text) return;
    fire('voice', 'command', { text });
    setVoiceText('');
  };

  const handleTrackMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    fire('head_tracking', 'move', { x, y });
  };

  return (
    <div style={S.root} data-testid="interaction-simulator">
      {/* ── 1. Side Touchpad — 需求 6.4 ── */}
      <div style={S.group} data-testid="group-side-touchpad">
        <div style={S.groupLabel}>侧边触控 Side Touchpad</div>
        <div style={S.row}>
          <button style={S.btn} data-testid="touchpad-swipe-up" onClick={() => fire('side_touchpad', 'swipe', { direction: 'up' })}><Icon name="arrow-up" size={11} /> 上滑</button>
          <button style={S.btn} data-testid="touchpad-swipe-down" onClick={() => fire('side_touchpad', 'swipe', { direction: 'down' })}><Icon name="arrow-down" size={11} /> 下滑</button>
          <button style={S.btn} data-testid="touchpad-swipe-left" onClick={() => fire('side_touchpad', 'swipe', { direction: 'left' })}><Icon name="arrow-left" size={11} /> 左滑</button>
          <button style={S.btn} data-testid="touchpad-swipe-right" onClick={() => fire('side_touchpad', 'swipe', { direction: 'right' })}><Icon name="arrow-right" size={11} /> 右滑</button>
          <button style={S.btn} data-testid="touchpad-tap" onClick={() => fire('side_touchpad', 'tap', {})}><Icon name="touch" size={11} /> 点击</button>
        </div>
      </div>

      {/* ── 2. Voice — 需求 6.4 ── */}
      <div style={S.group} data-testid="group-voice">
        <div style={S.groupLabel}>语音 Voice</div>
        <div style={S.inputRow}>
          <input
            style={S.textInput}
            data-testid="voice-input"
            placeholder="输入语音指令..."
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleVoiceSubmit(); }}
          />
          <button style={S.btn} data-testid="voice-submit" onClick={handleVoiceSubmit}>发送</button>
        </div>
      </div>

      {/* ── 3. EMG Band — 需求 6.6 ── */}
      <div style={S.group} data-testid="group-emg-band">
        <div style={S.groupLabel}>EMG 手环 EMG Band</div>
        <div style={S.row}>
          <button style={S.btn} data-testid="emg-pinch" onClick={() => fire('emg_band', 'pinch', {})}><Icon name="pinch" size={11} /> 捏合</button>
          <button style={S.btn} data-testid="emg-double-pinch" onClick={() => fire('emg_band', 'double_pinch', {})}><Icon name="pinch" size={11} /> 双击捏合</button>
        </div>
      </div>

      {/* ── 4. Camera Gesture — 需求 6.7 ── */}
      <div style={S.group} data-testid="group-camera-gesture">
        <div style={S.groupLabel}>摄像头手势 Camera Gesture</div>
        <div style={S.row}>
          <button style={S.btn} data-testid="gesture-wave" onClick={() => fire('camera_gesture', 'wave', {})}><Icon name="wave" size={11} /> 挥手</button>
          <button style={S.btn} data-testid="gesture-point" onClick={() => fire('camera_gesture', 'point', {})}><Icon name="point" size={11} /> 指向</button>
          <button style={S.btn} data-testid="gesture-thumbs-up" onClick={() => fire('camera_gesture', 'thumbs_up', {})}><Icon name="thumbsup" size={11} /> 点赞</button>
        </div>
      </div>

      {/* ── 5. Head Tracking — 需求 6.5 ── */}
      <div style={S.group} data-testid="group-head-tracking">
        <div style={S.groupLabel}>头部追踪 Head Tracking</div>
        <div style={S.row}>
          <button style={S.btn} data-testid="head-nod" onClick={() => fire('head_tracking', 'nod', {})}><Icon name="nod" size={11} /> 点头</button>
          <button style={S.btn} data-testid="head-shake" onClick={() => fire('head_tracking', 'shake', {})}><Icon name="shake" size={11} /> 摇头</button>
        </div>
        <div
          style={S.trackArea}
          data-testid="head-track-area"
          onClick={handleTrackMove}
          role="button"
          tabIndex={0}
          aria-label="头部追踪模拟区域"
        >
          点击模拟光标移动
        </div>
      </div>

      {/* ── 6. Physical Button — 需求 6.4 ── */}
      <div style={S.group} data-testid="group-physical-button">
        <div style={S.groupLabel}>物理按键 Physical Button</div>
        <div style={S.row}>
          <button style={S.btn} data-testid="button-press" onClick={() => fire('physical_button', 'press', {})}><Icon name="power" size={11} /> 按下</button>
        </div>
      </div>
    </div>
  );
}
