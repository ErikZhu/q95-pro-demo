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
    grad1: '#0a1628', grad2: '#0d2847', grad3: '#0a1e3d',
    glow: 'rgba(0, 180, 255, 0.35)', glowStrong: 'rgba(0, 220, 255, 0.55)',
    ring: 'rgba(0, 140, 255, 0.2)',
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
@keyframes orb2-idle-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(0,180,255,0.3), 0 0 20px rgba(0,120,255,0.15), 0 0 35px rgba(0,200,255,0.08), inset 0 0 8px rgba(0,180,255,0.15); }
  50%      { box-shadow: 0 0 12px rgba(0,200,255,0.45), 0 0 28px rgba(0,150,255,0.25), 0 0 45px rgba(0,220,255,0.12), inset 0 0 10px rgba(0,200,255,0.2); }
}
@keyframes orb2-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes orb2-hint {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%      { opacity: 0.8; transform: scale(1.25); }
}
@keyframes orb2-neon-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
    background: status === 'idle'
      ? `conic-gradient(from 0deg, rgba(0,180,255,0.15), rgba(0,60,120,0.05), rgba(0,220,255,0.2), rgba(0,80,160,0.05), rgba(0,180,255,0.15))`
      : `conic-gradient(from 0deg, ${t.grad1}33, ${t.grad2}33, ${t.grad3}33, ${t.grad1}33)`,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: status === 'idle'
      ? '1px solid rgba(0, 200, 255, 0.25)'
      : `1px solid ${t.glow}`,
    animation: status === 'thinking'
      ? 'orb2-spin-border 2s linear infinite'
      : status === 'idle'
        ? 'orb2-neon-spin 8s linear infinite'
        : undefined,
  };

  /* ── Core orb with conic gradient ── */
  const core: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: '50%',
    background: status === 'idle'
      ? `radial-gradient(circle at 40% 35%, #0d3060 0%, #091a30 50%, #050e1a 100%)`
      : `conic-gradient(from 45deg, ${t.grad1}, ${t.grad2}, ${t.grad3}, ${t.grad1})`,
    boxShadow: status === 'idle'
      ? [
          `0 0 ${r * 0.6}px rgba(0, 180, 255, 0.3)`,
          `0 0 ${r * 1.4}px rgba(0, 120, 255, 0.15)`,
          `0 0 ${r * 2.2}px rgba(0, 200, 255, 0.08)`,
          `inset 0 0 ${r * 0.5}px rgba(0, 180, 255, 0.15)`,
          `inset 0 -${r * 0.2}px ${r * 0.4}px rgba(0, 220, 255, 0.1)`,
        ].join(', ')
      : [
          `0 0 ${r * 0.8}px ${t.glow}`,
          `0 0 ${r * 1.6}px ${t.ring}`,
          `inset 0 0 ${r * 0.4}px rgba(255,255,255,0.25)`,
        ].join(', '),
    animation: status === 'listening'
      ? 'orb2-breathe 2s ease-in-out infinite'
      : status === 'thinking'
        ? 'orb2-rotate 3s linear infinite'
        : status === 'idle'
          ? 'orb2-idle-glow 4s ease-in-out infinite'
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
    background: status === 'idle'
      ? 'linear-gradient(135deg, rgba(0,180,255,0.25) 0%, rgba(0,100,200,0.05) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.05) 100%)',
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
