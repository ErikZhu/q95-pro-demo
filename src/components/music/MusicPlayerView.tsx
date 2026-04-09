import { useMemo } from 'react';
import type { PlaybackState } from '../../services/MusicPlayer';
import { Icon } from '../icons/Icon';

/**
 * MusicPlayerView — 音乐播放界面组件
 *
 * 显示：
 * - 当前曲目名称、歌手、专辑封面占位 — 需求 13.3
 * - 播放/暂停、上一曲、下一曲按钮 — 需求 13.1
 * - 音量滑块 — 需求 13.1
 * - 播放进度条
 * - 手机同步状态 — 需求 13.4
 *
 * 需求: 13.1, 13.2, 13.3, 13.4, 13.5
 */

export interface MusicPlayerViewProps {
  /** 播放状态 */
  playbackState: PlaybackState;
  /** 播放/暂停回调 */
  onTogglePlay?: () => void;
  /** 上一曲回调 */
  onPrev?: () => void;
  /** 下一曲回调 */
  onNext?: () => void;
  /** 音量变更回调 */
  onVolumeChange?: (volume: number) => void;
  /** 是否已连接手机 */
  phoneSyncConnected?: boolean;
  /** 手机应用名称 */
  phoneSyncApp?: string | null;
}

/** 格式化时间 mm:ss */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const S = {
  container: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(ellipse at 50% 30%, rgba(30, 20, 50, 0.95), rgba(10, 10, 26, 0.98))',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)',
    zIndex: 1400,
    gap: 20,
  },
  albumArt: {
    width: 160,
    height: 160,
    borderRadius: 16,
    background: 'rgba(110, 54, 238, 0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    color: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(110, 54, 238, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 24px rgba(180, 130, 255, 0.06)',
  },
  trackInfo: {
    textAlign: 'center' as const,
    maxWidth: 280,
  },
  trackName: {
    fontSize: 18,
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 4,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  artist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  progressContainer: {
    width: 280,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  progressBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    background: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    background: 'linear-gradient(90deg, rgba(110, 54, 238, 0.8), rgba(180, 130, 255, 0.8))',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  progressTimes: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontVariantNumeric: 'tabular-nums' as const,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    transition: 'color 0.15s, transform 0.15s',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(110, 54, 238, 0.1)',
    border: '1px solid rgba(110, 54, 238, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    color: 'rgba(110, 54, 238, 0.95)',
    boxShadow: '0 0 16px rgba(110, 54, 238, 0.1)',
    transition: 'background 0.15s, box-shadow 0.15s',
  },
  volumeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: 200,
  },
  volumeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    minWidth: 20,
    textAlign: 'center' as const,
  },
  volumeSlider: {
    flex: 1,
    height: 4,
    appearance: 'none' as const,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
    accentColor: 'rgba(110, 54, 238, 0.8)',
  },
  syncBadge: {
    fontSize: 11,
    color: 'rgba(110, 54, 238, 0.7)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  noTrack: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center' as const,
  },
};

export function MusicPlayerView({
  playbackState,
  onTogglePlay,
  onPrev,
  onNext,
  onVolumeChange,
  phoneSyncConnected = false,
  phoneSyncApp,
}: MusicPlayerViewProps) {
  const { status, currentTrack, progress, volume } = playbackState;

  const progressPercent = useMemo(() => {
    if (!currentTrack || currentTrack.duration === 0) return 0;
    return Math.min(100, (progress / currentTrack.duration) * 100);
  }, [currentTrack, progress]);

  const isPlaying = status === 'playing';

  return (
    <div
      data-testid="music-player-view"
      role="region"
      aria-label="音乐播放器"
      style={S.container}
    >
      {/* Album art placeholder */}
      <div style={S.albumArt} data-testid="album-art" aria-hidden="true">
        {currentTrack?.albumArt ? <Icon name="note" size={36} color="rgba(255,255,255,0.3)" /> : <Icon name="music" size={36} color="rgba(255,255,255,0.3)" />}
      </div>

      {/* Track info — 需求 13.3 */}
      {currentTrack ? (
        <div style={S.trackInfo} data-testid="track-info">
          <div style={S.trackName} data-testid="track-name">
            {currentTrack.name}
          </div>
          <div style={S.artist} data-testid="track-artist">
            {currentTrack.artist}
          </div>
        </div>
      ) : (
        <div style={S.noTrack} data-testid="no-track">
          暂无播放曲目
        </div>
      )}

      {/* Progress bar */}
      <div style={S.progressContainer} data-testid="progress-container">
        <div style={S.progressBar}>
          <div
            style={{ ...S.progressFill, width: `${progressPercent}%` }}
            data-testid="progress-fill"
          />
        </div>
        <div style={S.progressTimes}>
          <span data-testid="progress-current">{formatTime(progress)}</span>
          <span data-testid="progress-total">
            {currentTrack ? formatTime(currentTrack.duration) : '00:00'}
          </span>
        </div>
      </div>

      {/* Playback controls — 需求 13.1 */}
      <div style={S.controls} data-testid="playback-controls">
        <button
          style={S.controlBtn}
          onClick={onPrev}
          data-testid="prev-btn"
          aria-label="上一曲"
        >
          <Icon name="skip-back" size={18} />
        </button>
        <button
          style={S.playBtn}
          onClick={onTogglePlay}
          data-testid="play-pause-btn"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Icon name="pause" size={20} /> : <Icon name="play" size={20} />}
        </button>
        <button
          style={S.controlBtn}
          onClick={onNext}
          data-testid="next-btn"
          aria-label="下一曲"
        >
          <Icon name="skip-forward" size={18} />
        </button>
      </div>

      {/* Volume slider — 需求 13.1 */}
      <div style={S.volumeContainer} data-testid="volume-container">
        <span style={S.volumeLabel} aria-hidden="true"><Icon name="volume-down" size={12} /></span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => onVolumeChange?.(Number(e.target.value))}
          style={S.volumeSlider}
          data-testid="volume-slider"
          aria-label="音量"
        />
        <span style={S.volumeLabel} data-testid="volume-value">
          {volume}
        </span>
      </div>

      {/* Phone sync status — 需求 13.4 */}
      {phoneSyncConnected && (
        <div style={S.syncBadge} data-testid="phone-sync-status">
          <span aria-hidden="true"><Icon name="phone" size={12} /></span>
          已连接 {phoneSyncApp ?? '手机'}
        </div>
      )}
    </div>
  );
}
