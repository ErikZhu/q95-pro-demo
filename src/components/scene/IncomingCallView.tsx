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
  btnRow: { display: 'flex', gap: 32, alignItems: 'flex-start' },
  btnWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 },
  declineBtn: {
    width: 52, height: 52, borderRadius: '50%',
    background: '#FF3B30', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(255,59,48,0.4)',
  },
  answerBtn: {
    width: 72, height: 52, borderRadius: 26,
    background: '#34C759', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(52,199,89,0.4)',
  },
  hangupBtn: {
    width: 52, height: 52, borderRadius: '50%',
    background: '#FF3B30', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(255,59,48,0.4)',
  },
  btnLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
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
          <div style={S.btnWrap as React.CSSProperties}>
            <button style={S.declineBtn as React.CSSProperties} onClick={() => { setState('ended'); onDecline?.(); }}>
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                {/* 听筒上半部分（耳朵） */}
                <path d="M8 6C8 6 6 6 6 9L6 13C6 14 7 15 8 15" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                {/* 听筒下半部分（嘴） */}
                <path d="M24 17C24 17 26 17 26 20L26 24C26 25 25 26 24 26" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                {/* 斜线穿过 */}
                <line x1="4" y1="4" x2="28" y2="28" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
              </svg>
            </button>
            <span style={S.btnLabel}>拒接</span>
          </div>
          <div style={S.btnWrap as React.CSSProperties}>
            <button style={S.answerBtn as React.CSSProperties} onClick={handleAnswer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" fill="white"/>
              </svg>
            </button>
            <span style={S.btnLabel}>接听</span>
          </div>
        </div>
      )}
      {state === 'active' && (
        <button style={S.hangupBtn as React.CSSProperties} onClick={() => setState('ended')}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M8 6C8 6 6 6 6 9L6 13C6 14 7 15 8 15" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M24 17C24 17 26 17 26 20L26 24C26 25 25 26 24 26" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <line x1="4" y1="4" x2="28" y2="28" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
