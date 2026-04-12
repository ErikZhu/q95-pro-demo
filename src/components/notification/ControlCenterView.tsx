/**
 * ControlCenterView — 控制中心面板
 * 上排：4个小开关（WiFi/蓝牙/勿扰/帮助）在横条玻璃容器
 * 下排：3个大方块（音量/亮度/设置）带弧形进度指示
 */
import { useState } from 'react';

interface SmallToggle { id: string; icon: string; defaultOn: boolean; }
interface BigTile { id: string; icon: string; hasArc: boolean; defaultVal: number; }

const SMALL_TOGGLES: SmallToggle[] = [
  { id: 'wifi', icon: '📶', defaultOn: true },
  { id: 'bt', icon: '᛫', defaultOn: true },
  { id: 'dnd', icon: '🌙', defaultOn: false },
  { id: 'help', icon: '❓', defaultOn: false },
];

const BIG_TILES: BigTile[] = [
  { id: 'volume', icon: '🔊', hasArc: true, defaultVal: 65 },
  { id: 'brightness', icon: '☀️', hasArc: true, defaultVal: 70 },
  { id: 'settings', icon: '⚙️', hasArc: false, defaultVal: 0 },
];

const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    padding: '0 24px', gap: 16,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  topRow: {
    display: 'flex', gap: 6,
    padding: '8px 10px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
  },
  smallBtn: (on: boolean): React.CSSProperties => ({
    width: 52, height: 52,
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: on ? 'rgba(127,73,232,0.2)' : 'rgba(255,255,255,0.05)',
    border: on ? '1px solid rgba(127,73,232,0.4)' : '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    fontSize: 20,
    boxShadow: on ? '0 0 8px rgba(127,73,232,0.2)' : 'none',
  }),
  btIcon: {
    fontSize: 22, fontWeight: 700 as const,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'serif',
  },
  bottomRow: {
    display: 'flex', gap: 12,
  },
  bigTile: {
    width: 100, height: 100,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: 28,
  },
};

/** 弧形进度 SVG */
function ArcProgress({ value, size = 60 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75; // 270 度弧
  const offset = arc - (arc * value) / 100;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(135deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth="3"
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.7)" strokeWidth="3"
        strokeDasharray={`${arc} ${circ}`}
        strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
    </svg>
  );
}

export function ControlCenterView() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SMALL_TOGGLES.map(t => [t.id, t.defaultOn]))
  );
  const [vals, setVals] = useState<Record<string, number>>(
    () => Object.fromEntries(BIG_TILES.map(t => [t.id, t.defaultVal]))
  );

  const cycleBigTile = (id: string) => {
    if (id === 'settings') return;
    setVals(prev => ({ ...prev, [id]: (prev[id] + 20) % 120 }));
  };

  return (
    <div style={S.root} data-testid="control-center">
      {/* 上排：4个小开关 */}
      <div style={S.topRow as React.CSSProperties}>
        {SMALL_TOGGLES.map(t => (
          <div key={t.id} style={S.smallBtn(toggles[t.id])}
            onClick={() => setToggles(prev => ({ ...prev, [t.id]: !prev[t.id] }))}>
            {t.id === 'bt' ? (
              <span style={S.btIcon}>ᛒ</span>
            ) : (
              <span>{t.icon}</span>
            )}
          </div>
        ))}
      </div>

      {/* 下排：3个大方块 */}
      <div style={S.bottomRow}>
        {BIG_TILES.map(t => (
          <div key={t.id} style={S.bigTile as React.CSSProperties}
            onClick={() => cycleBigTile(t.id)}>
            {t.hasArc && <ArcProgress value={Math.min(vals[t.id], 100)} size={70} />}
            <span style={{ position: 'relative', zIndex: 1 }}>{t.icon}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
