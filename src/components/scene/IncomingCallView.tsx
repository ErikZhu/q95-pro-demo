import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * IncomingCallView — 来电界面
 * ringing → active → ended
 * active 状态可收起到状态栏
 */

export interface IncomingCallViewProps {
  callerName: string;
  callerNumber: string;
  onAnswer?: () => void;
  onDecline?: () => void;
  onMinimize?: (seconds: number) => void;
}

const AVATAR_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&q=80';

const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    gap: 20, fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  avatar: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(127,73,232,0.2)',
    border: '2px solid rgba(127,73,232,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28,
  },
  name: { fontSize: 20, fontWeight: 600 as const, color: 'rgba(255,255,255,0.92)' },
  number: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: -12 },
  label: { fontSize: 11, color: 'rgba(127,73,232,0.7)', letterSpacing: 1 },
  btnRow: { display: 'flex', gap: 32, alignItems: 'flex-start' },
  btnWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 },
  declineBtn: {
    width: 52, height: 52, borderRadius: '50%',
    background: '#FF3B30', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 0 16px rgba(255,59,48,0.4)',
  },
  answerBtn: {
    width: 72, height: 52, borderRadius: 26,
    background: '#34C759', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 0 16px rgba(52,199,89,0.4)',
  },
  hangupBtn: {
    width: 52, height: 52, borderRadius: '50%',
    background: '#FF3B30', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 0 16px rgba(255,59,48,0.4)',
  },
  btnLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  timer: { fontSize: 16, color: 'rgba(127,73,232,0.9)', fontFamily: 'monospace' },
  minimizeBtn: {
    position: 'absolute' as const, top: 12, right: 12,
    width: 28, height: 28, borderRadius: 8,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14,
  },
  activeRow: {
    display: 'flex', alignItems: 'center', gap: 24,
  },
};

const PhoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const DeclineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 003.41 2.6l1.1-1.1a2 2 0 012.11-.45 12.84 12.84 0 002.7.42 2 2 0 012 2v3a2 2 0 01-2.18 2A19.79 19.79 0 013.18 5.18 2 2 0 015.18 3h3a2 2 0 012 2 12.84 12.84 0 00.42 2.7 2 2 0 01-.45 2.11l-1.1 1.1"/>
    <line x1="22" y1="2" x2="2" y2="22"/>
  </svg>
);

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function IncomingCallView({ callerName, callerNumber, onDecline, onMinimize }: IncomingCallViewProps) {
  const [state, setState] = useState<'ringing' | 'active' | 'ended'>('ringing');
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleAnswer = useCallback(() => {
    setState('active');
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  }, []);

  const handleEnd = useCallback(() => {
    stopTimer();
    setState('ended');
  }, [stopTimer]);

  const handleMinimize = useCallback(() => {
    onMinimize?.(seconds);
  }, [onMinimize, seconds]);

  useEffect(() => { return () => stopTimer(); }, [stopTimer]);

  if (state === 'ended') {
    return (
      <div style={S.root}>
        <img src={AVATAR_URL} alt="caller" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(127,73,232,0.4)" }} />
        <div style={S.name}>通话已结束</div>
        <div style={S.timer}>{fmt(seconds)}</div>
      </div>
    );
  }

  return (
    <div style={{ ...S.root, position: 'relative' as const }} data-testid="incoming-call">
      <div style={S.label}>{state === 'ringing' ? '来电' : '通话中'}</div>
      <img src={AVATAR_URL} alt="caller" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(127,73,232,0.4)" }} />
      <div style={S.name}>{callerName}</div>
      <div style={S.number}>{callerNumber}</div>
      {state === 'active' && <div style={S.timer}>{fmt(seconds)}</div>}
      {state === 'ringing' && (
        <div style={S.btnRow}>
          <div style={S.btnWrap as React.CSSProperties}>
            <button style={S.declineBtn as React.CSSProperties} onClick={() => { handleEnd(); onDecline?.(); }}>
              <DeclineIcon />
            </button>
            <span style={S.btnLabel}>拒接</span>
          </div>
          <div style={S.btnWrap as React.CSSProperties}>
            <button style={S.answerBtn as React.CSSProperties} onClick={handleAnswer}>
              <PhoneIcon />
            </button>
            <span style={S.btnLabel}>接听</span>
          </div>
        </div>
      )}
      {state === 'active' && (
        <div style={S.activeRow}>
          <button style={S.hangupBtn as React.CSSProperties} onClick={handleEnd}>
            <DeclineIcon />
          </button>
        </div>
      )}
      {state === 'active' && (
        <button style={S.minimizeBtn as React.CSSProperties} onClick={handleMinimize} title="收起到状态栏">
          ⌄
        </button>
      )}
    </div>
  );
}
