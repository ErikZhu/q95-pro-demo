import { useState, useEffect, useMemo } from 'react';

/**
 * IslandNotification — 灵动岛式全局通知
 * 从顶部弹出，自动收起
 */

export interface IslandNotifProps {
  visible: boolean;
  onDismiss?: () => void;
}

const KF = `
@keyframes island-in {
  from { transform: translateX(-50%) translateY(-100%) scaleX(0.6); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0) scaleX(1); opacity: 1; }
}
@keyframes island-out {
  from { transform: translateX(-50%) translateY(0) scaleX(1); opacity: 1; }
  to   { transform: translateX(-50%) translateY(-100%) scaleX(0.6); opacity: 0; }
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

const S = {
  island: (visible: boolean, expanded: boolean): React.CSSProperties => ({
    position: 'fixed',
    top: 6,
    left: '50%',
    transform: 'translateX(-50%)',
    minWidth: expanded ? 320 : 160,
    padding: expanded ? '10px 16px' : '6px 16px',
    borderRadius: 24,
    background: 'rgba(10, 8, 20, 0.92)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(127,73,232,0.15)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', gap: 10,
    zIndex: 2000,
    animation: visible ? 'island-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'island-out 0.3s ease forwards',
    transition: 'min-width 0.3s ease, padding 0.3s ease',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255,255,255,0.92)',
  }),
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#34C759',
    boxShadow: '0 0 6px #34C75980',
    flexShrink: 0,
  },
  text: { fontSize: 12, fontWeight: 500 as const, flex: 1 },
  sub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  icon: { fontSize: 18, flexShrink: 0 },
};

const NOTIFS = [
  { icon: '💬', app: '微信', text: '张伟：周末出门爬山么？', sub: '刚刚' },
  { icon: '📦', app: '快递', text: '您的顺丰快递已到达驿站', sub: '2分钟前' },
  { icon: '📅', app: '日历', text: '14:30 产品评审会议', sub: '15分钟后' },
];

export function IslandNotification({ visible, onDismiss }: IslandNotifProps) {
  useMemo(() => injectKf(), []);
  const [expanded, setExpanded] = useState(false);
  const [notifIdx, setNotifIdx] = useState(0);

  useEffect(() => {
    if (!visible) { setExpanded(false); return; }
    // 0.8s 后展开
    const t1 = setTimeout(() => setExpanded(true), 800);
    // 5s 后自动收起
    const t2 = setTimeout(() => onDismiss?.(), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, onDismiss]);

  // 循环通知
  useEffect(() => {
    if (!visible || !expanded) return;
    const t = setInterval(() => setNotifIdx(i => (i + 1) % NOTIFS.length), 3000);
    return () => clearInterval(t);
  }, [visible, expanded]);

  if (!visible) return null;
  const n = NOTIFS[notifIdx];

  return (
    <div style={S.island(visible, expanded)} onClick={() => onDismiss?.()}>
      <div style={S.dot} />
      {expanded ? (
        <>
          <span style={S.icon}>{n.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={S.text}>{n.text}</div>
            <div style={S.sub}>{n.app} · {n.sub}</div>
          </div>
        </>
      ) : (
        <div style={S.text}>{n.app}</div>
      )}
    </div>
  );
}
