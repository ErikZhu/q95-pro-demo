import { useMemo } from 'react';
import type { AIStatus } from '../../types/ai';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

/**
 * AI_Status_Orb — 语音助手状态球组件
 *
 * 通过颜色和动效反映 AI 助手当前状态：
 * - 空闲态 (idle): 静态柔光
 * - 聆听态 (listening): 脉冲呼吸
 * - 思考态 (thinking): 旋转动效
 * - 响应态 (responding): 扩散波纹
 *
 * 需求: 3.1, 3.9
 *
 * Validates: Requirements 3.1, 3.9
 */

export interface AIStatusOrbProps {
  status: AIStatus;
  size?: number;
  orbMenuState?: OrbMenuState;
  activeAppId?: string | null;
  onGazeStart?: () => void;
  onGazeEnd?: () => void;
}

/* ── colour palette per status ── */
const STATUS_COLORS: Record<AIStatus, { core: string; glow: string; ring: string }> = {
  idle: {
    core: 'rgba(100, 200, 255, 0.8)',
    glow: 'rgba(100, 200, 255, 0.3)',
    ring: 'rgba(100, 200, 255, 0.2)',
  },
  listening: {
    core: 'rgba(80, 220, 160, 0.9)',
    glow: 'rgba(80, 220, 160, 0.35)',
    ring: 'rgba(80, 220, 160, 0.25)',
  },
  thinking: {
    core: 'rgba(180, 130, 255, 0.9)',
    glow: 'rgba(180, 130, 255, 0.35)',
    ring: 'rgba(180, 130, 255, 0.25)',
  },
  responding: {
    core: 'rgba(255, 180, 60, 0.9)',
    glow: 'rgba(255, 180, 60, 0.35)',
    ring: 'rgba(255, 180, 60, 0.25)',
  },
};

/* ── CSS keyframes (injected once) ── */
const KEYFRAMES = `
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50%      { transform: scale(1.12); opacity: 1; }
}
@keyframes orb-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes orb-ripple {
  0%   { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2); opacity: 0; }
}
@keyframes orb-hint-glow {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50%      { transform: scale(1.3); opacity: 0.8; }
}
@keyframes orb-menu-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
`;

let stylesInjected = false;
function injectKeyframes() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function AIStatusOrb({ status, size = 40, orbMenuState, activeAppId, onGazeStart, onGazeEnd }: AIStatusOrbProps) {
  // Inject keyframes on first render
  useMemo(() => injectKeyframes(), []);

  const colors = STATUS_COLORS[status];
  const half = size / 2;

  /* ── base orb style ── */
  const orbStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle at 38% 38%, ${colors.core} 0%, ${colors.glow} 70%, transparent 100%)`,
    boxShadow: `0 0 ${half * 0.6}px ${colors.glow}, 0 0 ${half * 1.2}px ${colors.ring}`,
    flexShrink: 0,
  };

  /* ── per-status animation on the orb ── */
  const animatedOrbStyle: React.CSSProperties = { ...orbStyle };

  if (status === 'listening') {
    animatedOrbStyle.animation = 'orb-breathe 2s ease-in-out infinite';
  }

  /* ── thinking: spinning ring around the orb ── */
  const spinRingStyle: React.CSSProperties | null =
    status === 'thinking'
      ? {
          position: 'absolute',
          top: -4,
          left: -4,
          width: size + 8,
          height: size + 8,
          borderRadius: '50%',
          border: `2px solid transparent`,
          borderTopColor: colors.core,
          borderRightColor: colors.glow,
          animation: 'orb-spin 1s linear infinite',
          pointerEvents: 'none',
        }
      : null;

  /* ── responding: expanding ripple rings ── */
  const rippleCount = 2;
  const ripples =
    status === 'responding'
      ? Array.from({ length: rippleCount }, (_, i) => {
          const delay = i * 0.8;
          const rippleStyle: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: '50%',
            border: `2px solid ${colors.ring}`,
            animation: `orb-ripple 1.6s ease-out ${delay}s infinite`,
            pointerEvents: 'none',
          };
          return <div key={i} style={rippleStyle} />;
        })
      : null;

  /* ── orb_hint: pulsing glow ring ── */
  const hintGlow = orbMenuState === 'orb_hint' ? (
    <div
      data-testid="orb-hint-glow"
      style={{
        position: 'absolute',
        top: -6,
        left: -6,
        width: size + 12,
        height: size + 12,
        borderRadius: '50%',
        border: `2px solid ${colors.glow}`,
        animation: 'orb-hint-glow 1.5s ease-in-out infinite',
        pointerEvents: 'none',
      }}
    />
  ) : null;

  /* ── orb_menu_open: expanding ring effect matching AI status color ── */
  const menuRing = orbMenuState === 'orb_menu_open' ? (
    <div
      data-testid="orb-menu-ring"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${colors.core}`,
        animation: 'orb-menu-ring 1.6s ease-out infinite',
        pointerEvents: 'none',
      }}
    />
  ) : null;

  /* ── orb_idle + activeAppId: subtle arc indicator ── */
  const isOrbIdle = !orbMenuState || orbMenuState === 'orb_idle';
  const activeArc = isOrbIdle && activeAppId ? (
    <div
      data-testid="orb-active-arc"
      style={{
        position: 'absolute',
        top: -4,
        left: -4,
        width: size + 8,
        height: size + 8,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderRightColor: `${colors.ring}`,
        opacity: 0.6,
        pointerEvents: 'none',
      }}
    />
  ) : null;

  return (
    <div
      data-testid="ai-status-orb"
      data-status={status}
      role="status"
      aria-label={`AI assistant status: ${status}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
      }}
      onPointerEnter={onGazeStart}
      onPointerLeave={onGazeEnd}
    >
      {/* Core orb */}
      <div style={animatedOrbStyle} />

      {/* Thinking spin ring */}
      {spinRingStyle && <div style={spinRingStyle} />}

      {/* Responding ripples */}
      {ripples}

      {/* Orb Menu: hint glow */}
      {hintGlow}

      {/* Orb Menu: open ring */}
      {menuRing}

      {/* Orb Menu: active app arc indicator */}
      {activeArc}
    </div>
  );
}
