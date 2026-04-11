/**
 * ControlCenterView — 控制中心面板
 * 快捷开关：WiFi、蓝牙、勿扰、亮度、音量、手电筒
 */
import { useState } from 'react';

interface Toggle { id: string; label: string; emoji: string; defaultOn: boolean; }

const TOGGLES: Toggle[] = [
  { id: 'wifi', label: 'WiFi', emoji: '📶', defaultOn: true },
  { id: 'bt', label: '蓝牙', emoji: '🔵', defaultOn: true },
  { id: 'dnd', label: '勿扰', emoji: '🌙', defaultOn: false },
  { id: 'torch', label: '手电', emoji: '🔦', defaultOn: false },
  { id: 'airdrop', label: '投屏', emoji: '📡', defaultOn: false },
  { id: 'location', label: '定位', emoji: '📍', defaultOn: true },
];

const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    padding: '0 20px', gap: 14,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255,255,255,0.92)',
  },
  title: {
    fontSize: 14, fontWeight: 600 as const,
    color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10, width: '100%', maxWidth: 360,
  },
  tile: (on: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '14px 8px',
    borderRadius: 14,
    background: on ? 'rgba(127, 73, 232, 0.15)' : 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px) saturate(1.3)',
    border: on ? '1.5px solid rgba(127,73,232,0.4)' : '1.5px solid rgba(255,255,255,0.06)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: on ? '0 0 12px rgba(127,73,232,0.15)' : 'none',
  }),
  emoji: { fontSize: 22 },
  label: (on: boolean): React.CSSProperties => ({
    fontSize: 10, fontWeight: 500,
    color: on ? 'rgba(127,73,232,0.9)' : 'rgba(255,255,255,0.45)',
  }),
  slider: {
    width: '100%', maxWidth: 360,
    display: 'flex', flexDirection: 'column' as const, gap: 8,
  },
  sliderRow: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  sliderLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 32, flexShrink: 0,
  },
  sliderTrack: {
    flex: 1, height: 4, borderRadius: 2,
    background: 'rgba(255,255,255,0.08)',
    position: 'relative' as const, overflow: 'hidden',
  },
  sliderFill: (pct: number): React.CSSProperties => ({
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: `${pct}%`, borderRadius: 2,
    background: 'linear-gradient(90deg, rgba(127,73,232,0.6), rgba(127,73,232,0.9))',
    transition: 'width 0.2s ease',
  }),
};

export function ControlCenterView() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(TOGGLES.map(t => [t.id, t.defaultOn]))
  );
  const [brightness, setBrightness] = useState(70);
  const [volume, setVolume] = useState(50);

  return (
    <div style={S.root} data-testid="control-center">
      <div style={S.grid}>
        {TOGGLES.map(t => (
          <div key={t.id} style={S.tile(toggles[t.id])}
            onClick={() => setToggles(prev => ({ ...prev, [t.id]: !prev[t.id] }))}>
            <span style={S.emoji}>{t.emoji}</span>
            <span style={S.label(toggles[t.id])}>{t.label}</span>
          </div>
        ))}
      </div>
      <div style={S.slider}>
        <div style={S.sliderRow}>
          <span style={S.sliderLabel}>☀️</span>
          <div style={S.sliderTrack} onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            setBrightness(Math.round(((e.clientX - r.left) / r.width) * 100));
          }}>
            <div style={S.sliderFill(brightness)} />
          </div>
        </div>
        <div style={S.sliderRow}>
          <span style={S.sliderLabel}>🔊</span>
          <div style={S.sliderTrack} onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            setVolume(Math.round(((e.clientX - r.left) / r.width) * 100));
          }}>
            <div style={S.sliderFill(volume)} />
          </div>
        </div>
      </div>
    </div>
  );
}
