import { useState, useEffect, useRef } from 'react';

/**
 * MiniCallBar — 状态栏迷你通话条
 * 替换 AI 球位置，显示电话图标+通话人+计时+挂断+展开
 */

const AVATAR_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&q=80';

export interface MiniCallBarProps {
  callerName: string;
  initialSeconds: number;
  onHangup?: () => void;
  onExpand?: () => void;
}

const S = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 8px',
    borderRadius: 12,
    background: 'rgba(52,199,89,0.15)',
    border: '1px solid rgba(52,199,89,0.3)',
    cursor: 'pointer', height: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  phoneIcon: {
    width: 16, height: 16, color: '#34C759', flexShrink: 0,
  },
  name: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 500 as const },
  timer: { fontSize: 10, color: '#34C759', fontFamily: 'monospace', fontWeight: 600 as const },
  hangup: {
    width: 18, height: 18, borderRadius: '50%',
    background: '#FF3B30', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, padding: 0,
  },
  expand: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer', flexShrink: 0,
  },
};

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function MiniCallBar({ callerName, initialSeconds, onHangup, onExpand }: MiniCallBarProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={S.bar} onClick={onExpand} data-testid="mini-call-bar">
      <img src={AVATAR_URL} alt="caller" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' as const, flexShrink: 0, border: '1.5px solid rgba(52,199,89,0.4)' }} />
      <span style={S.name}>{callerName}</span>
      <span style={S.timer}>{fmt(seconds)}</span>
      <button style={S.hangup as React.CSSProperties} onClick={e => { e.stopPropagation(); onHangup?.(); }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
