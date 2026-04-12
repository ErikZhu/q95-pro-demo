import { useState, useEffect, useMemo } from 'react';

/**
 * AIScanView — AI 实时扫一扫
 * 模拟摄像头取景框 + AI 识别结果叠加
 */

const KF = `
@keyframes scan-line {
  0%   { top: 10%; }
  50%  { top: 85%; }
  100% { top: 10%; }
}
@keyframes scan-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;
let kfDone = false;
function injectKf() {
  if (kfDone || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = KF;
  document.head.appendChild(s);
  kfDone = true;
}

interface ScanResult {
  label: string;
  confidence: number;
  emoji: string;
  desc: string;
}

const SCAN_RESULTS: ScanResult[] = [
  { label: '咖啡杯', confidence: 96, emoji: '☕', desc: '星巴克拿铁 · 约 350ml · 建议温度 65°C' },
  { label: '笔记本电脑', confidence: 94, emoji: '💻', desc: 'MacBook Pro 14" · M3 Pro · 正在运行 VS Code' },
  { label: '植物', confidence: 91, emoji: '🌿', desc: '绿萝 · 需要浇水 · 适合室内养护' },
  { label: '书籍', confidence: 89, emoji: '📖', desc: '《人类简史》· 尤瓦尔·赫拉利 · 豆瓣 9.1' },
];

const S = {
  root: {
    width: '100%', height: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  viewfinder: {
    position: 'absolute' as const,
    inset: '10% 15%',
    border: '2px solid rgba(127,73,232,0.4)',
    borderRadius: 16,
  },
  corner: (pos: string): React.CSSProperties => ({
    position: 'absolute',
    width: 20, height: 20,
    borderColor: '#7F49E8', borderStyle: 'solid', borderWidth: 0,
    ...(pos === 'tl' ? { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: '16px 0 0 0' } : {}),
    ...(pos === 'tr' ? { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, borderRadius: '0 16px 0 0' } : {}),
    ...(pos === 'bl' ? { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: '0 0 0 16px' } : {}),
    ...(pos === 'br' ? { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: '0 0 16px 0' } : {}),
  }),
  scanLine: {
    position: 'absolute' as const,
    left: '15%', right: '15%',
    height: 2,
    background: 'linear-gradient(90deg, transparent, #7F49E8, transparent)',
    boxShadow: '0 0 12px rgba(127,73,232,0.5)',
    animation: 'scan-line 2.5s ease-in-out infinite',
  },
  resultCard: {
    position: 'absolute' as const,
    bottom: '8%', left: '10%', right: '10%',
    padding: '12px 16px',
    borderRadius: 14,
    background: 'rgba(10,8,20,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(127,73,232,0.2)',
    display: 'flex', alignItems: 'center', gap: 12,
    animation: 'scan-fade-in 0.4s ease-out',
    color: 'rgba(255,255,255,0.92)',
  },
  emoji: { fontSize: 32, flexShrink: 0 },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: 600 as const },
  conf: { fontSize: 10, color: '#7F49E8', marginLeft: 6 },
  desc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  hint: {
    position: 'absolute' as const,
    top: '4%', left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 10, color: 'rgba(127,73,232,0.6)',
    letterSpacing: 1,
  },
};

export function AIScanView() {
  useMemo(() => injectKf(), []);
  const [resultIdx, setResultIdx] = useState(0);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    // 模拟扫描：每 3s 切换识别结果
    const t = setInterval(() => {
      setScanning(false);
      setTimeout(() => {
        setResultIdx(i => (i + 1) % SCAN_RESULTS.length);
        setScanning(true);
      }, 200);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const r = SCAN_RESULTS[resultIdx];

  return (
    <div style={S.root} data-testid="ai-scan-view">
      <div style={S.hint as React.CSSProperties}>AI 识别中...</div>
      {/* 取景框 */}
      <div style={S.viewfinder}>
        <div style={S.corner('tl')} />
        <div style={S.corner('tr')} />
        <div style={S.corner('bl')} />
        <div style={S.corner('br')} />
      </div>
      {/* 扫描线 */}
      <div style={S.scanLine} />
      {/* 识别结果 */}
      {scanning && (
        <div style={S.resultCard as React.CSSProperties} key={resultIdx}>
          <span style={S.emoji}>{r.emoji}</span>
          <div style={S.info}>
            <div>
              <span style={S.label}>{r.label}</span>
              <span style={S.conf}>{r.confidence}%</span>
            </div>
            <div style={S.desc}>{r.desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}
