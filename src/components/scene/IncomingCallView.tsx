import { useState } from 'react';

/**
 * IncomingCallView — 来电界面
 * 显示来电人信息 + 接听/挂断按钮
 * 接听后显示通话中计时
 */

export interface IncomingCallViewProps {
  callerName: string;
  callerNumber: string;
  onAnswer?: () => void;
  onDecline?: () => void;
}

const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    gap: 20, fontFamily: 'system-ui, -apple-system, sans-serif',
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
  btnRow: { display: 'flex', gap: 32 },
  btn: (color: string): React.CSSProperties => ({
    width: 52, height: 52, borderRadius: '50%',
    background: color, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 22,
    boxShadow: `0 0 16px ${color}60`,
    transition: 'transform 0.15s ease',
  }),
  timer: { fontSize: 16, color: 'rgba(127,73,232,0.9)', fontFamily: 'monospace' },
};

export function IncomingCallView({ callerName, callerNumber, onAnswer, onDecline }: IncomingCallViewProps) {
  const [state, setState] = useState<'ringing' | 'active' | 'ended'>('ringing');
  const [seconds, setSeconds] = useState(0);

  const handleAnswer = () => {
    setState('active');
    onAnswer?.();
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    // auto-end after 30s for demo
    setTimeout(() => { clearInterval(t); setState('ended'); }, 30000);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (state === 'ended') {
    return (
      <div style={S.root}>
        <div style={S.avatar}>👤</div>
        <div style={S.name}>通话已结束</div>
        <div style={S.timer}>{fmt(seconds)}</div>
      </div>
    );
  }

  return (
    <div style={S.root} data-testid="incoming-call">
      <div style={S.label}>{state === 'ringing' ? '来电' : '通话中'}</div>
      <div style={S.avatar}>👤</div>
      <div style={S.name}>{callerName}</div>
      <div style={S.number}>{callerNumber}</div>
      {state === 'active' && <div style={S.timer}>{fmt(seconds)}</div>}
      {state === 'ringing' && (
        <div style={S.btnRow}>
          <button style={S.btn('#FF3B30')} onClick={() => { setState('ended'); onDecline?.(); }}>✕</button>
          <button style={S.btn('#34C759')} onClick={handleAnswer}>✓</button>
        </div>
      )}
      {state === 'active' && (
        <button style={S.btn('#FF3B30')} onClick={() => setState('ended')}>✕</button>
      )}
    </div>
  );
}
