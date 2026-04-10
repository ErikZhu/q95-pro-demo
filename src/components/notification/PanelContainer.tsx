import { useState, useEffect } from 'react';
import { NotificationStackView } from './NotificationStackView';
import { ControlCenterView } from './ControlCenterView';

/**
 * PanelContainer — 多面板容器（消息中心 + 控制中心）
 * 顶部定位豆指示器，左滑/右滑切换面板
 */

const PANELS = [
  { id: 'notifications', label: '消息' },
  { id: 'control', label: '控制' },
];

const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  dotBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '8px 0 4px',
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
  panelArea: {
    flex: 1, position: 'relative' as const, overflow: 'hidden',
  },
  panelSlider: (idx: number): React.CSSProperties => ({
    display: 'flex',
    width: `${PANELS.length * 100}%`,
    height: '100%',
    transform: `translateX(-${idx * (100 / PANELS.length)}%)`,
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  panel: {
    width: `${100 / PANELS.length}%`,
    height: '100%',
    flexShrink: 0,
  },
};

export function PanelContainer() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'left') {
        setActiveIdx(prev => (prev + 1) % PANELS.length);
      } else if (detail === 'right') {
        setActiveIdx(prev => (prev - 1 + PANELS.length) % PANELS.length);
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
            <div key={p.id} style={S.dot(i === activeIdx)}
              data-testid={`dot-${p.id}`} />
          ))}
        </div>
      </div>
      <div style={S.panelArea}>
        <div style={S.panelSlider(activeIdx)}>
          <div style={S.panel}>
            <NotificationStackView items={[]} />
          </div>
          <div style={S.panel}>
            <ControlCenterView />
          </div>
        </div>
      </div>
    </div>
  );
}
