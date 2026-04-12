import { useState, useEffect } from 'react';
import { NotificationStackView } from './NotificationStackView';
import { ControlCenterView } from './ControlCenterView';

/**
 * PanelContainer — 统一玻璃面板，内容在通知/控制中心间切换
 * 顶部定位豆，左滑/右滑切换内容
 */

const PANELS = ['notifications', 'control'] as const;

const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '4px 16px 8px',
    gap: 6,
  },
  dotBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  dotPill: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '5px 16px',
    borderRadius: 20,
    background: 'rgba(15, 12, 28, 0.75)',
    backdropFilter: 'blur(20px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  dot: (active: boolean): React.CSSProperties => ({
    width: active ? 10 : 6,
    height: active ? 10 : 6,
    borderRadius: '50%',
    background: active ? '#7F49E8' : 'rgba(255,255,255,0.25)',
    boxShadow: active ? '0 0 8px rgba(127,73,232,0.5)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  glassCard: {
    width: '100%', maxWidth: 440,
    height: 340,
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  content: (visible: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.35s ease',
    pointerEvents: visible ? 'auto' : 'none',
  }),
};

export function PanelContainer() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'left' || detail === 'right') {
        setActiveIdx(prev => (prev + 1) % PANELS.length);
      }
    };
    window.addEventListener('panel-swipe', handler);
    return () => window.removeEventListener('panel-swipe', handler);
  }, []);

  return (
    <div style={S.root} data-testid="panel-container">
      <div style={S.dotBar}>
        <div style={S.dotPill as React.CSSProperties}>
          {PANELS.map((p, i) => (
            <div key={p} style={S.dot(i === activeIdx)} data-testid={`dot-${p}`} />
          ))}
        </div>
      </div>
      <div style={S.glassCard as React.CSSProperties}>
        <div style={S.content(activeIdx === 0)}>
          <NotificationStackView items={[]} />
        </div>
        <div style={S.content(activeIdx === 1)}>
          <ControlCenterView />
        </div>
      </div>
    </div>
  );
}
