import { useMemo } from 'react';
import type { AIStatus } from '../../types/ai';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';
import orbGif from '../../assets/orb-idle.gif';

export interface AIStatusOrbProps {
  status: AIStatus;
  size?: number;
  orbMenuState?: OrbMenuState;
  activeAppId?: string | null;
  onGazeStart?: () => void;
  onGazeEnd?: () => void;
  onClick?: () => void;
}

/* Status differentiation via CSS filter + animation on the same GIF
 * 所有状态基于 GIF 原色做微调，避免色相跳跃过大 */
const STATUS_STYLE: Record<AIStatus, { filter: string; anim: string }> = {
  idle:       { filter: 'none',                                                    anim: '' },
  listening:  { filter: 'saturate(1.15) brightness(1.1)',                          anim: 'orb-breathe 1.8s ease-in-out infinite' },
  thinking:   { filter: 'saturate(0.8) brightness(0.9) hue-rotate(10deg)',         anim: 'orb-think 1.2s ease-in-out infinite' },
  responding: { filter: 'saturate(1.3) brightness(1.15) hue-rotate(-10deg)',       anim: 'orb-respond 0.8s ease-in-out infinite' },
};

const KF = `
@keyframes orb-breathe {
  0%, 100% { transform: translate(-50%,-50%) scale(1); }
  50%      { transform: translate(-50%,-50%) scale(1.08); }
}
@keyframes orb-think {
  0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.85; }
  50%      { transform: translate(-50%,-50%) scale(0.95); opacity: 1; }
}
@keyframes orb-respond {
  0%, 100% { transform: translate(-50%,-50%) scale(1); }
  50%      { transform: translate(-50%,-50%) scale(1.12); }
}
@keyframes orb-hint-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%      { opacity: 0.7; transform: scale(1.2); }
}
@keyframes orb-ripple-out {
  0%   { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2.4); opacity: 0; }
}
`;

let done = false;
function injectCSS() {
  if (done || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = KF;
  document.head.appendChild(s);
  done = true;
}

export function AIStatusOrb({ status, size = 40, orbMenuState, activeAppId, onGazeStart, onGazeEnd, onClick }: AIStatusOrbProps) {
  useMemo(() => injectCSS(), []);
  const st = STATUS_STYLE[status];

  const container: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
  };

  const img: React.CSSProperties = {
    width: '220%',
    height: '220%',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    objectFit: 'cover',
    pointerEvents: 'none',
    filter: st.filter,
    animation: st.anim || undefined,
    transition: 'filter 0.6s ease',
  };

  /* orb_hint glow */
  const hint = orbMenuState === 'orb_hint' ? (
    <div data-testid="orb-hint-glow" style={{
      position: 'absolute', inset: -5, borderRadius: '50%',
      border: '1.5px solid rgba(110,54,238,0.4)',
      animation: 'orb-hint-pulse 1.5s ease-in-out infinite',
      pointerEvents: 'none',
    }} />
  ) : null;

  /* menu open ring */
  const menuRing = orbMenuState === 'orb_menu_open' ? (
    <div data-testid="orb-menu-ring" style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      border: '1.5px solid rgba(110,54,238,0.4)',
      animation: 'orb-ripple-out 1.6s ease-out infinite',
      pointerEvents: 'none',
    }} />
  ) : null;

  /* active app arc */
  const isIdle = !orbMenuState || orbMenuState === 'orb_idle';
  const arc = isIdle && activeAppId ? (
    <div data-testid="orb-active-arc" style={{
      position: 'absolute', inset: -2, borderRadius: '50%',
      border: '1.5px solid transparent',
      borderRightColor: 'rgba(110,54,238,0.35)',
      pointerEvents: 'none',
    }} />
  ) : null;

  return (
    <div
      data-testid="ai-status-orb"
      data-status={status}
      role="status"
      aria-label={`AI assistant status: ${status}`}
      style={{ position: 'relative', display: 'inline-flex', width: size, height: size, cursor: 'pointer' }}
      onPointerEnter={onGazeStart}
      onPointerLeave={onGazeEnd}
      onClick={onClick}
    >
      <div style={container}>
        <img src={orbGif} alt="" style={img} />
      </div>
      {hint}
      {menuRing}
      {arc}
    </div>
  );
}
