import { useState, useEffect, useMemo } from 'react';

/**
 * NotificationStackView — 3D 堆叠式通知卡片列表
 *
 * 卡片堆叠展示，当前卡片最大最前，后面的卡片缩小+下移+模糊
 * 上滑/下滑切换，有三维空间层级感
 */

export interface NotifItem {
  id: string;
  app: string;
  icon: string;       // URL or emoji
  time: string;
  message: string;
  color: string;       // 卡片边框色
}

export interface NotificationStackViewProps {
  items: NotifItem[];
  activeIndex?: number;
  onIndexChange?: (idx: number) => void;
}

const DEMO_ITEMS: NotifItem[] = [
  {
    id: 'wechat-1',
    app: '微信',
    icon: '',
    time: '2min前',
    message: '张伟：周末出门爬山么？',
    color: '#1AAD19',
  },
  {
    id: 'dingtalk-1',
    app: '钉钉',
    icon: '',
    time: '5min前',
    message: '李白：准备下午的会议……',
    color: '#3A7BF7',
  },
  {
    id: 'calendar-1',
    app: '日历',
    icon: '',
    time: '15min前',
    message: '预约牙医 14:30',
    color: '#E8943A',
  },
  {
    id: 'sms-1',
    app: '短信',
    icon: '',
    time: '30min前',
    message: '【顺丰】您的快递已到达驿站',
    color: '#34C759',
  },
  {
    id: 'email-1',
    app: '邮件',
    icon: '',
    time: '1h前',
    message: '产品周报 - 本周进展汇总',
    color: '#5856D6',
  },
];

/* Emoji fallback icons for apps without URL icons */
const EMOJI_ICONS: Record<string, string> = {
  '钉钉': '🔔',
  '日历': '📅',
  '短信': '✉️',
  '邮件': '📧',
  '电话': '📞',
  '系统': '⚙️',
};

/** 微信 SVG 图标 — 两个聊天气泡 */
function WeChatIcon() {
  return (
    <svg viewBox="0 0 48 48" width="30" height="30" fill="none">
      <ellipse cx="20" cy="20" rx="14" ry="12" fill="#2DC100" />
      <circle cx="14" cy="18" r="1.5" fill="#fff" />
      <circle cx="20" cy="18" r="1.5" fill="#fff" />
      <circle cx="26" cy="18" r="1.5" fill="#fff" />
      <ellipse cx="30" cy="28" rx="11" ry="9.5" fill="#51C332" />
      <circle cx="26" cy="27" r="1.2" fill="#fff" />
      <circle cx="31" cy="27" r="1.2" fill="#fff" />
    </svg>
  );
}

function renderAppIcon(app: string) {
  if (app === '微信') return <WeChatIcon />;
  return <span style={{ fontSize: 20, lineHeight: 1 }}>{EMOJI_ICONS[app] || '📱'}</span>;
}

const KF = `
@keyframes notif-slide-in {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
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
  root: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    perspective: '800px',
    perspectiveOrigin: '50% 40%',
  },
  stack: {
    position: 'relative' as const,
    width: '85%', maxWidth: 480,
    height: 280,
  },
  card: (offset: number, color: string, total: number): React.CSSProperties => {
    const isActive = offset === 0;
    const behind = Math.min(Math.abs(offset), 3);
    const scale = 1 - behind * 0.06;
    const translateY = behind * 28;
    const translateZ = -behind * 40;
    const opacity = behind === 0 ? 1 : behind === 1 ? 0.7 : behind === 2 ? 0.4 : 0.2;
    const blur = behind === 0 ? 0 : behind * 1.5;
    return {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      padding: '16px 20px',
      borderRadius: 16,
      background: 'rgba(20, 18, 35, 0.88)',
      backdropFilter: 'blur(24px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
      border: isActive ? `2px solid ${color}` : '1.5px solid rgba(255,255,255,0.06)',
      boxShadow: isActive
        ? `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${color}30, inset 0 1px 0 rgba(255,255,255,0.06)`
        : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
      transform: `translateY(${translateY}px) translateZ(${translateZ}px) scale(${scale})`,
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : undefined,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: total - behind,
      pointerEvents: isActive ? 'auto' as const : 'none' as const,
      display: 'flex', flexDirection: 'column' as const, gap: 10,
    };
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  iconWrap: (color: string): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: '50%',
    border: `2px solid ${color}40`,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  }),
  iconImg: {
    width: 26, height: 26, objectFit: 'contain' as const,
  },
  iconEmoji: {
    fontSize: 20, lineHeight: 1,
  },
  appName: {
    fontSize: 16, fontWeight: 600 as const,
    color: 'rgba(255,255,255,0.92)', flex: 1,
  },
  time: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)',
    flexShrink: 0,
  },
  message: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.5,
  },
  counter: {
    position: 'absolute' as const,
    bottom: -24, left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 10, color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
  },
};

export function NotificationStackView({
  items,
  activeIndex: controlledIdx,
  onIndexChange,
}: NotificationStackViewProps) {
  useMemo(() => injectKf(), []);
  const data = items.length > 0 ? items : DEMO_ITEMS;
  const [localIdx, setLocalIdx] = useState(0);
  const idx = Math.max(0, Math.min((controlledIdx ?? localIdx), data.length - 1));

  useEffect(() => {
    if (controlledIdx !== undefined && controlledIdx >= 0) setLocalIdx(controlledIdx);
  }, [controlledIdx]);

  const go = (dir: number) => {
    const next = Math.max(0, Math.min(data.length - 1, idx + dir));
    setLocalIdx(next);
    onIndexChange?.(next);
  };

  return (
    <div style={S.root} data-testid="notification-stack">
      <div style={S.stack}>
        {data.map((item, i) => {
          const offset = i - idx;
          if (offset < 0 || offset > 3) return null; // only show current + 3 behind
          return (
            <div key={item.id} style={S.card(offset, item.color, data.length)}
              data-testid={`notif-card-${item.id}`}
              onClick={() => { if (offset === 0) go(1); }}>
              <div style={S.header}>
                <div style={S.iconWrap(item.color)}>
                  {renderAppIcon(item.app)}
                </div>
                <span style={S.appName}>{item.app}</span>
                <span style={S.time}>{item.time}</span>
              </div>
              <div style={S.message}>{item.message}</div>
            </div>
          );
        })}
        <div style={S.counter}>{idx + 1} / {data.length}</div>
      </div>
    </div>
  );
}
