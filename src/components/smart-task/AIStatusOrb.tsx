import { useMemo } from 'react';
import type { AIStatus } from '../../types/ai';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';
import orbIdleGif from '../../assets/orb-idle.gif';

export interface AIStatusOrbProps {
  status: AIStatus;
  size?: number;
  orbMenuState?: OrbMenuState;
  activeAppId?: string | null;
  onGazeStart?: () => void;
  onGazeEnd?: () => void;
}

/* ── Single-ball color configs ── */
const T: Record<AIStatus, { bg: string; shadow: string; anim: string }> = {
  idle: {
    bg: '',  // uses GIF
    shadow: '0 0 6px rgba(0,200,255,0.3), 0 0 18px rgba(0,120,220,0.15)',
    anim: '',
  },
  listening: {
    bg: 'radial-gradient(circle at 35% 30%, #1a5c3a 0%, #0c3520 45%, #061d10 100%)',
    shadow: '0 0 8px rgba(56,249,215,0.5), 0 0 22px rgba(67,233,123,0.3), 0 0 45px rgba(56,249,215,0.12)',
    anim: 'orb-breathe 2s ease-in-out infinite',
  },
  thinking: {
    bg: 'radial-gradient(circle at 35% 30%, #3a2a5c 0%, #1f1040 45%, #0e0820 100%)',
    shadow: '0 0 8px rgba(161,140,209,0.5), 0 0 22px rgba(251,194,235,0.3), 0 0 45px rgba(102,126,234,0.12)',
    anim: 'orb-spin 2.5s linear infinite',
  },
  responding: {
    bg: 'radial-gradient(circle at 35% 30%, #5c2a3a 0%, #401020 45%, #200810 100%)',
    shadow: '0 0 8px rgba(240,147,251,0.5), 0 0 22px rgba(245,87,108,0.3), 0 0 45px rgba(253,160,133,0.12)',
    anim: 'orb-pulse 1.2s ease-in-out infinite',
  },
};

const KF = `
@keyframes orb-idle {
  0%, 100% { box-shadow: 0 0 4px rgba(0,200,255,0.6), 0 0 12px rgba(0,160,240,0.4), 0 0 30px rgba(0,120,220,0.2), 0 0 60px rgba(0,80,180,0.1); }
  50%      { box-shadow: 0 0 6px rgba(0,220,255,0.7), 0 0 16px rgba(0,180,250,0.5), 0 0 38px rgba(0,140,230,0.25), 0 0 70px rgba(0,100,200,0.12); }
}
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}
@keyframes orb-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes orb-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50%      { transform: scale(1.08); opacity: 1; }
}
@keyframes orb-ripple-out {
  0%   { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2.4); opacity: 0; }
}
@keyframes orb-hint-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%      { opacity: 0.7; transform: scale(1.2); }
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

export function AIStatusOrb({ status, size = 40, orbMenuState, activeAppId, onGazeStart, onGazeEnd }: AIStatusOrbProps) {
  useMemo(() => injectCSS(), []);
  const c = T[status];

  const orb: React.CSSProperties = status === 'idle' ? {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundImage: `url(${orbIdleGif})`,
    backgroundSize: '140%',
    backgroundPosition: 'center',
    boxShadow: c.shadow,
    transition: 'box-shadow 0.6s ease',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  } : {
    width: size,
    height: size,
    borderRadius: '50%',
    background: c.bg,
    boxShadow: c.shadow,
    animation: c.anim,
    transition: 'background 0.6s ease, box-shadow 0.6s ease',
    flexShrink: 0,
    position: 'relative',
  };

  /* responding ripples */
  const ripples = status === 'responding' ? [0, 0.5, 1].map((d, i) => (
    <div key={i} style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      border: '1.5px solid rgba(245,87,108,0.3)',
      animation: `orb-ripple-out 1.8s ease-out ${d}s infinite`,
      pointerEvents: 'none',
    }} />
  )) : null;

  /* thinking: border accent */
  const thinkBorder = status === 'thinking' ? (
    <div style={{
      position: 'absolute', inset: -3, borderRadius: '50%',
      border: '1.5px solid transparent',
      borderTopColor: 'rgba(161,140,209,0.6)',
      borderRightColor: 'rgba(251,194,235,0.3)',
      animation: 'orb-spin 1.5s linear infinite',
      pointerEvents: 'none',
    }} />
  ) : null;

  /* orb_hint glow */
  const hint = orbMenuState === 'orb_hint' ? (
    <div data-testid="orb-hint-glow" style={{
      position: 'absolute', inset: -5, borderRadius: '50%',
      border: '1.5px solid rgba(0,180,255,0.4)',
      animation: 'orb-hint-pulse 1.5s ease-in-out infinite',
      pointerEvents: 'none',
    }} />
  ) : null;

  /* menu open ring */
  const menuRing = orbMenuState === 'orb_menu_open' ? (
    <div data-testid="orb-menu-ring" style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      border: '1.5px solid rgba(0,180,255,0.4)',
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
      borderRightColor: 'rgba(0,180,255,0.35)',
      pointerEvents: 'none',
    }} />
  ) : null;

  return (
    <div
      data-testid="ai-status-orb"
      data-status={status}
      role="status"
      aria-label={`AI assistant status: ${status}`}
      style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}
      onPointerEnter={onGazeStart}
      onPointerLeave={onGazeEnd}
    >
      <div style={orb} />
      {thinkBorder}
      {ripples}
      {hint}
      {menuRing}
      {arc}
    </div>
  );
}
