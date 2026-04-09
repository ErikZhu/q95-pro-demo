import type { InfoCard } from '../../types/data';
import { Icon } from '../icons/Icon';

/**
 * MusicCard — 音乐播放卡片（含快捷播放控制）
 * 需求 20.11: 显示当前曲目、歌手和播放进度，支持快捷播放控制
 */

export interface MusicCardProps {
  card: InfoCard;
  data?: {
    trackName?: string;
    artist?: string;
    progress?: number;
    duration?: number;
    isPlaying?: boolean;
  };
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const S = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  trackInfo: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  trackName: { fontSize: 13, fontWeight: 600 as const, whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const },
  artist: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' },
  progressBar: { height: 3, borderRadius: 2, background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' as const },
  progressFill: (pct: number): React.CSSProperties => ({ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: 'linear-gradient(90deg, rgba(110, 54, 238, 0.8), rgba(180, 130, 255, 0.8))', borderRadius: 2 }),
  timeRow: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255, 255, 255, 0.3)', fontFamily: "'SF Mono', 'Fira Code', monospace" },
  controls: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 },
  controlBtn: { background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, cursor: 'pointer', padding: '2px 6px', transition: 'color 0.15s' },
  playBtn: { background: 'rgba(110, 54, 238, 0.1)', border: 'none', color: 'rgba(110, 54, 238, 0.95)', fontSize: 18, cursor: 'pointer', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(110, 54, 238, 0.1)' },
};

export function MusicCardView({ card, data, onTogglePlay, onNext, onPrev }: MusicCardProps) {
  const progress = data?.progress ?? 0;
  const duration = data?.duration ?? 0;
  const currentTime = duration > 0 ? (progress / 100) * duration : 0;

  return (
    <div style={S.root} data-testid="music-card">
      <div style={S.trackInfo}>
        <div style={S.trackName}><Icon name="note" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{data?.trackName ?? card.title}</div>
        <div style={S.artist}>{data?.artist ?? '未知歌手'}</div>
      </div>
      <div style={S.progressBar}>
        <div style={S.progressFill(progress)} data-testid="music-progress" />
      </div>
      <div style={S.timeRow}>
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
      <div style={S.controls} data-testid="music-controls">
        <button style={S.controlBtn} onClick={onPrev} data-testid="music-prev" aria-label="上一曲"><Icon name="skip-back" size={14} /></button>
        <button style={S.playBtn} onClick={onTogglePlay} data-testid="music-toggle" aria-label={data?.isPlaying ? '暂停' : '播放'}>
          {data?.isPlaying ? <Icon name="pause" size={16} /> : <Icon name="play" size={16} />}
        </button>
        <button style={S.controlBtn} onClick={onNext} data-testid="music-next" aria-label="下一曲"><Icon name="skip-forward" size={14} /></button>
      </div>
    </div>
  );
}
