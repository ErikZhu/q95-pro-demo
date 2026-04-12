/**
 * ControlCenterView — 控制中心面板
 * 上排：4个小开关在横条玻璃容器（WiFi/蓝牙/勿扰/帮助）
 * 下排：3个大方块（音量/亮度/设置）带弧形进度
 * 总宽度统一 = 3 * 100 + 2 * 12 = 324px
 */
import { useState } from 'react';

/* ── 内联 SVG 图标 ── */
const IC = {
  wifi: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 18.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill={c}/>
      <path d="M8.5 15.5a5 5 0 017 0" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 12a9.5 9.5 0 0114 0" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M1.5 8.5a14 14 0 0121 0" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  bluetooth: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7 7l10 10-5 5V2l5 5L7 17" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  moon: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  help: (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2"/>
      <path d="M9.5 9a3 3 0 015.13 2.13c0 2-3 2.5-3 2.5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.5" fill={c} stroke={c} strokeWidth="1"/>
    </svg>
  ),
  volume: (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z" fill={c}/>
      <path d="M15.5 8.5a5 5 0 010 7" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M18.5 5.5a9 9 0 010 13" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  brightness: (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="2"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  settings: (c: string) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={c} strokeWidth="2"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.77 1.02 1.51 1.08H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={c} strokeWidth="1.5"/>
    </svg>
  ),
};

const TOTAL_W = 280; // 3*84 + 2*14

const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '30px 24px 0', gap: 12,
  },
  topRow: {
    width: TOTAL_W,
    display: 'flex', gap: 6,
    padding: '8px 10px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
  },
  smallBtn: (on: boolean): React.CSSProperties => ({
    flex: 1,
    aspectRatio: '1',
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: on ? 'rgba(127,73,232,0.2)' : 'rgba(255,255,255,0.05)',
    border: on ? '1px solid rgba(127,73,232,0.4)' : '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: on ? '0 0 8px rgba(127,73,232,0.2)' : 'none',
  }),
  bottomRow: {
    width: TOTAL_W,
    display: 'flex', gap: 14,
  },
  bigTile: {
    flex: 1,
    aspectRatio: '1',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative' as const,
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
};

function ArcProgress({ value, size = 60 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const offset = arc - (arc * Math.min(value, 100)) / 100;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(135deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease' }}/>
    </svg>
  );
}

const SMALLS = [
  { id: 'wifi', render: IC.wifi, defaultOn: true },
  { id: 'bt', render: IC.bluetooth, defaultOn: true },
  { id: 'dnd', render: IC.moon, defaultOn: false },
  { id: 'help', render: IC.help, defaultOn: false },
];

const BIGS = [
  { id: 'volume', render: IC.volume, hasArc: true, defaultVal: 65 },
  { id: 'brightness', render: IC.brightness, hasArc: true, defaultVal: 70 },
  { id: 'settings', render: IC.settings, hasArc: false, defaultVal: 0 },
];

export function ControlCenterView() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SMALLS.map(t => [t.id, t.defaultOn]))
  );
  const [vals, setVals] = useState<Record<string, number>>(
    () => Object.fromEntries(BIGS.map(t => [t.id, t.defaultVal]))
  );

  return (
    <div style={S.root} data-testid="control-center">
      <div style={S.topRow as React.CSSProperties}>
        {SMALLS.map(t => (
          <div key={t.id} style={S.smallBtn(toggles[t.id])}
            onClick={() => setToggles(prev => ({ ...prev, [t.id]: !prev[t.id] }))}>
            {t.render(toggles[t.id] ? 'rgba(200,170,255,0.95)' : 'rgba(255,255,255,0.7)')}
          </div>
        ))}
      </div>
      <div style={S.bottomRow}>
        {BIGS.map(t => (
          <div key={t.id} style={S.bigTile as React.CSSProperties}
            onClick={() => t.hasArc && setVals(prev => ({ ...prev, [t.id]: (prev[t.id] + 20) % 120 }))}>
            {t.hasArc && <ArcProgress value={vals[t.id]} size={70} />}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {t.render('rgba(255,255,255,0.85)')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
