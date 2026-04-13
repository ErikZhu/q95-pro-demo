import { useState, useEffect, useRef } from 'react';

/**
 * MiniCallBar — 状态栏迷你通话条
 * 透明毛玻璃背景，头像+通话人+计时+挂断
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
    padding: '3px 8px 3px 3px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer', height: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  name: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 500 as const },
  timer: { fontSize: 10, color: 'rgba(127,73,232,0.9)', fontFamily: 'monospace', fontWeight: 600 as const },
  hangup: {
    width: 20, height: 20, borderRadius: '50%',
    background: '#FF3B30', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, padding: 0,
    boxShadow: '0 0 6px rgba(255,59,48,0.3)',
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
    <div style={S.bar as React.CSSProperties} onClick={onExpand} data-testid="mini-call-bar">
      <img src={AVATAR_URL} alt="caller" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' as const, flexShrink: 0 }} />
      <span style={S.name}>{callerName}</span>
      <span style={S.timer}>{fmt(seconds)}</span>
      <button style={S.hangup as React.CSSProperties} onClick={e => { e.stopPropagation(); onHangup?.(); }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.68 13.31a16 16 0 003.41 2.6l1.1-1.1a2 2 0 012.11-.45 12.84 12.84 0 002.7.42 2 2 0 012 2v3a2 2 0 01-2.18 2A19.79 19.79 0 013.18 5.18 2 2 0 015.18 3h3a2 2 0 012 2 12.84 12.84 0 00.42 2.7 2 2 0 01-.45 2.11l-1.1 1.1"/>
          <line x1="22" y1="2" x2="2" y2="22"/>
        </svg>
      </button>
    </div>
  );
}
