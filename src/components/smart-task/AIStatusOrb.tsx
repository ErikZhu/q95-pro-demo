import { useMemo } from 'react';
import type { AIStatus } from '../../types/ai';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

export interface AIStatusOrbProps {
  status: AIStatus;
  size?: number;
  orbMenuState?: OrbMenuState;
  activeAppId?: string | null;
  onGazeStart?: () => void;
  onGazeEnd?: () => void;
}

/* ── Gradient palettes per status — inspired by glassmorphism + aurora glow ── */
const STATUS_THEME: Record<AIStatus, {
  grad1: string; grad2: string; grad3: string;
  glow: string; glowStrong: string; ring: string;
}> = {
  idle: {
    grad1: '#4facfe', grad2: '#00f2fe', grad3: '#43e97b',
    glow: 'rgba(79, 172, 254, 0.4)', glowStrong: 'rgba(0, 242, 254, 0.6)',
    ring: 'rgba(67, 233, 123, 0.3)',
  },
  listening: {
    grad1: '#43e97b', grad2: '#38f9d7', grad3: '#4facfe',
    glow: 'rgba(56, 249, 215, 0.5)', glowStrong: 'rgba(67, 233, 123, 0.7)',
    ring: 'rgba(56, 249, 215, 0.35)',
  },
  thinking: {
    grad1: '#a18cd1', grad2: '#fbc2eb', grad3: '#667eea',
    glow: 'rgba(161, 140, 209, 0.5)', glowStrong: 'rgba(251, 194, 235, 0.6)',
    ring: 'rgba(102, 126, 234, 0.35)',
  },
  responding: {
    grad1: '#f093fb', grad2: '#f5576c', grad3: '#fda085',
    glow: 'rgba(240, 147, 251, 0.5)', glowStrong: 'rgba(245, 87, 108, 0.6)',
    ring: 'rgba(253, 160, 133, 0.35)',
  },
};

const KEYFRAMES = `
@keyframes orb2-rotate {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes orb2-breathe {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50%      { transform: scale(1.15); filter: brightness(1.3); }
}
@keyframes orb2-pulse-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes orb2-spin-border {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes orb2-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes orb2-hint {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%      { opacity: 0.8; transform: scale(1.25); }
}
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
  injected = true;
}

export function AIStatusOrb({ status, size = 40, orbMenuState, activeAppId, onGazeStart, onGazeEnd }: AIStatusOrbProps) {
  useMemo(() => inject(), []);
  const t = STATUS_THEME[status];
  const r = size / 2;

  /* ── Outer container ── */
  const wrap: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size + 12,
    height: size + 12,
  };

  /* ── Glass backdrop ring ── */
  const glassRing: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: `conic-gradient(from 0deg, ${t.grad1}33, ${t.grad2}33, ${t.grad3}33, ${t.grad1}33)`,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: `1px solid ${t.glow}`,
    animation: status === 'thinking' ? 'orb2-spin-border 2s linear infinite' : undefined,
  };

  /* ── Core orb with conic gradient ── */
  const core: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: '50%',
    background: `conic-gradient(from 45deg, ${t.grad1}, ${t.grad2}, ${t.grad3}, ${t.grad1})`,
    boxShadow: [
      `0 0 ${r * 0.8}px ${t.glow}`,
      `0 0 ${r * 1.6}px ${t.ring}`,
      `inset 0 0 ${r * 0.4}px rgba(255,255,255,0.25)`,
    ].join(', '),
    animation: status === 'listening'
      ? 'orb2-breathe 2s ease-in-out infinite'
      : status === 'thinking'
        ? 'orb2-rotate 3s linear infinite'
        : undefined,
  };

  /* ── Inner highlight (glass refraction) ── */
  const highlight: React.CSSProperties = {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '45%',
    height: '35%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.05) 100%)',
    pointerEvents: 'none',
  };

  /* ── Responding: pulse rings ── */
  const pulses = status === 'responding' ? [0, 0.6, 1.2].map((delay, i) => (
    <div key={i} style={{
      position: 'absolute',
      top: 6, left: 6,
      width: size, height: size,
      borderRadius: '50%',
      border: `1.5px solid ${t.glowStrong}`,
      animation: `orb2-pulse-ring 1.8s ease-out ${delay}s infinite`,
      pointerEvents: 'none',
    }} />
  )) : null;

  /* ── Hint glow for orb_hint state ── */
  const hint = orbMenuState === 'orb_hint' ? (
    <div data-testid="orb-hint-glow" style={{
      position: 'absolute', inset: -4,
      borderRadius: '50%',
      border: `2px solid ${t.glowStrong}`,
      animation: 'orb2-hint 1.5s ease-in-out infinite',
      pointerEvents: 'none',
    }} />
  ) : null;

  /* ── Menu open: expanding ring ── */
  const menuRing = orbMenuState === 'orb_menu_open' ? (
    <div data-testid="orb-menu-ring" style={{
      position: 'absolute', top: 6, left: 6,
      width: size, height: size,
      borderRadius: '50%',
      border: `2px solid ${t.grad2}`,
      animation: 'orb2-pulse-ring 1.6s ease-out infinite',
      pointerEvents: 'none',
    }} />
  ) : null;

  /* ── Active app arc ── */
  const isIdle = !orbMenuState || orbMenuState === 'orb_idle';
  const arc = isIdle && activeAppId ? (
    <div data-testid="orb-active-arc" style={{
      position: 'absolute', inset: -2,
      borderRadius: '50%',
      border: '2px solid transparent',
      borderRightColor: t.grad2,
      opacity: 0.5,
      pointerEvents: 'none',
    }} />
  ) : null;

  return (
    <div
      data-testid="ai-status-orb"
      data-status={status}
      role="status"
      aria-label={`AI assistant status: ${status}`}
      style={wrap}
      onPointerEnter={onGazeStart}
      onPointerLeave={onGazeEnd}
    >
      <div style={glassRing} />
      <div style={core}>
        <div style={highlight} />
      </div>
      {pulses}
      {hint}
      {menuRing}
      {arc}
    </div>
  );
}
