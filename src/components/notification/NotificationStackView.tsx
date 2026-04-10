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

/** 微信 SVG 图标 — 高清版：灰色圆环 + 绿色/白色聊天气泡 + 3D 渐变 */
function WeChatIcon() {
  return (
    <svg viewBox="0 0 100 100" width="42" height="42">
      <defs>
        <radialGradient id="wc-green" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#5FE36A" />
          <stop offset="100%" stopColor="#2DC100" />
        </radialGradient>
        <radialGradient id="wc-white" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E8EDE8" />
          <stop offset="100%" stopColor="#B0BFB0" />
        </radialGradient>
      </defs>
      {/* 外圈灰色描边 */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(160,160,160,0.5)" strokeWidth="3" />
      {/* 黑色背景 */}
      <circle cx="50" cy="50" r="44" fill="#0a0a0a" />
      {/* 绿色大气泡 */}
      <ellipse cx="42" cy="42" rx="22" ry="19" fill="url(#wc-green)" />
      <ellipse cx="33" cy="52" rx="4" ry="5" fill="url(#wc-green)" />
      {/* 绿色气泡眼睛 */}
      <circle cx="35" cy="40" r="2.5" fill="#1a6e10" />
      <circle cx="49" cy="40" r="2.5" fill="#1a6e10" />
      {/* 白色小气泡 */}
      <ellipse cx="60" cy="58" rx="17" ry="14.5" fill="url(#wc-white)" />
      <ellipse cx="68" cy="66" rx="3.5" ry="4" fill="url(#wc-white)" />
      {/* 白色气泡眼睛 */}
      <circle cx="54" cy="56" r="2" fill="#5a6a5a" />
      <circle cx="65" cy="56" r="2" fill="#5a6a5a" />
    </svg>
  );
}

function renderAppIcon(app: string) {
  if (app === '微信') return <WeChatIcon />;
  return <span style={{ fontSize: 22, lineHeight: 1 }}>{EMOJI_ICONS[app] || '📱'}</span>;
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
    const scale = 1 - behind * 0.05;
    const translateY = behind * 36;
    const translateZ = -behind * 30;
    const opacity = behind === 0 ? 1 : behind === 1 ? 0.85 : behind === 2 ? 0.65 : 0.45;
    const bgAlpha = behind === 0 ? 0.82 : behind === 1 ? 0.55 : behind === 2 ? 0.4 : 0.3;
    return {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      padding: '16px 20px',
      borderRadius: 16,
      background: `rgba(20, 18, 35, ${bgAlpha})`,
      backdropFilter: 'blur(20px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
      border: isActive ? `2px solid ${color}` : `1.5px solid ${color}25`,
      boxShadow: isActive
        ? `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${color}30, inset 0 1px 0 rgba(255,255,255,0.06)`
        : `0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)`,
      transform: `translateY(${translateY}px) translateZ(${translateZ}px) scale(${scale})`,
      opacity,
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
}: NotificationStackViewProps) {
  useMemo(() => injectKf(), []);
  const source = items.length > 0 ? items : DEMO_ITEMS;

  // 维护卡片顺序（循环堆叠）
  const [order, setOrder] = useState<number[]>(() => source.map((_, i) => i));
  const [animatingOut, setAnimatingOut] = useState<number | null>(null);

  // 下滑：顶部卡片飞到最后
  const swipeNext = () => {
    if (animatingOut !== null) return;
    const topIdx = order[0];
    setAnimatingOut(topIdx);
    // 动画结束后移到最后
    setTimeout(() => {
      setOrder(prev => [...prev.slice(1), prev[0]]);
      setAnimatingOut(null);
    }, 400);
  };

  // 上滑：最后一张飞到顶部
  const swipePrev = () => {
    if (animatingOut !== null) return;
    setOrder(prev => [prev[prev.length - 1], ...prev.slice(0, -1)]);
  };

  // 暴露给外部控制
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail === 'next') swipeNext();
      else if (e.detail === 'prev') swipePrev();
    };
    window.addEventListener('notif-swipe' as any, handler);
    return () => window.removeEventListener('notif-swipe' as any, handler);
  }, [order, animatingOut]);

  const topDataIdx = order[0];

  return (
    <div style={S.root} data-testid="notification-stack">
      <div style={S.stack} onClick={swipeNext}>
        {order.slice(0, 4).map((dataIdx, stackPos) => {
          const item = source[dataIdx];
          if (!item) return null;
          const isFlying = dataIdx === animatingOut;
          const pos = isFlying ? -1 : stackPos; // -1 = flying out
          return (
            <div
              key={item.id}
              style={isFlying ? {
                ...S.card(0, item.color, source.length),
                transform: 'translateY(140px) translateZ(-120px) scale(0.85)',
                opacity: 0,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: source.length + 1,
              } : S.card(pos, item.color, source.length)}
              data-testid={`notif-card-${item.id}`}
            >
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
        <div style={S.counter}>
          {source[topDataIdx]?.app} · {order.indexOf(topDataIdx) + 1}/{source.length}
        </div>
      </div>
    </div>
  );
}
