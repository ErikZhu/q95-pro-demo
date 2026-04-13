import { useState, useEffect, useMemo } from 'react';

/**
 * MiniPlayer — 音乐迷你播放器（挂在主页底部菜单栏）
 *
 * 显示：专辑缩略图 + 歌名/歌手 + 歌词轮播
 */

export interface MiniPlayerProps {
  trackName: string;
  artist: string;
  albumArt?: string;
  isPlaying: boolean;
  onClick?: () => void;
}

/** 稻香歌词 */
const LYRICS = [
  '对这个世界如果你有太多的抱怨',
  '跌倒了就不敢继续往前走',
  '为什么人要这么的脆弱 堕落',
  '请你打开电视看看',
  '多少人为生命在努力勇敢的走下去',
  '我们是不是该知足',
  '珍惜一切 就算没有拥有',
  '随人群在人海中盲目的跟随',
  '别人说的话 随便听一听 自己做决定',
  '不想拥有太多情绪',
  '一杯红茶 一张报纸',
  '坐在我的安乐椅',
  '所谓的那快乐 赤脚在田里追蜻蜓追到累了',
  '偷摘水果被蜜蜂给叮到怕了',
  '谁在偷笑呢',
  '日子过的像什么 我说像稻香',
  '回家吧 回到最初的美好',
];

const ALBUM_ART = 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=80&h=80&fit=crop&q=80';

const KF = `
@keyframes mini-eq {
  0%, 100% { height: 3px; }
  50%      { height: 10px; }
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
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 12px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    background: 'rgba(15, 12, 30, 0.85)',
    backdropFilter: 'blur(20px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
    borderTop: '1px solid rgba(127, 73, 232, 0.1)',
    cursor: 'pointer',
    zIndex: 50,
    transition: 'opacity 0.3s ease',
  },
  art: {
    width: 32,
    height: 32,
    borderRadius: 6,
    objectFit: 'cover' as const,
    flexShrink: 0,
    border: '1px solid rgba(127, 73, 232, 0.2)',
  },
  info: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
  },
  trackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  trackName: {
    fontSize: 11,
    fontWeight: 600 as const,
    color: 'rgba(255, 255, 255, 0.9)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  artist: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.35)',
    whiteSpace: 'nowrap' as const,
  },
  lyric: {
    fontSize: 10,
    color: 'rgba(127, 73, 232, 0.7)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    transition: 'opacity 0.4s ease',
  },
  eq: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    height: 12,
    flexShrink: 0,
  },
  eqBar: (delay: number): React.CSSProperties => ({
    width: 2,
    borderRadius: 1,
    background: '#7F49E8',
    animation: `mini-eq 0.6s ${delay}s ease-in-out infinite`,
  }),
};

export function MiniPlayer({ trackName, artist, isPlaying, onClick }: MiniPlayerProps) {
  useMemo(() => injectKf(), []);
  const [lyricIdx, setLyricIdx] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setLyricIdx(prev => (prev + 1) % LYRICS.length);
    }, 3500);
    return () => clearInterval(t);
  }, [isPlaying]);

  return (
    <div style={S.root} onClick={onClick} data-testid="mini-player">
      <img src={ALBUM_ART} alt={trackName} style={S.art} />
      <div style={S.info}>
        <div style={S.trackRow}>
          <span style={S.trackName}>{trackName}</span>
          <span style={S.artist}>— {artist}</span>
        </div>
        <div style={S.lyric} key={lyricIdx}>{LYRICS[lyricIdx]}</div>
      </div>
      {isPlaying && (
        <div style={S.eq}>
          <div style={S.eqBar(0)} />
          <div style={S.eqBar(0.15)} />
          <div style={S.eqBar(0.3)} />
        </div>
      )}
    </div>
  );
}
