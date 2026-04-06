/**
 * MusicPlayer — 音乐播放控制服务
 *
 * 播放控制（播放/暂停/上一曲/下一曲/音量调节）、侧边触控双击切换、
 * 来电自动暂停与通话结束恢复、配对手机音乐应用联动。
 * Demo 中使用模拟数据。
 *
 * 需求: 13.1, 13.2, 13.3, 13.4, 13.5
 */

/** 默认音量 (0-100) */
const DEFAULT_VOLUME = 50;
/** 进度更新间隔（ms） */
const PROGRESS_INTERVAL = 1000;

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration: number; // seconds
}

export type PlaybackStatus = 'playing' | 'paused' | 'stopped';
export type PauseReason = 'user' | 'incoming_call' | 'phone_sync';

export interface PlaybackState {
  status: PlaybackStatus;
  currentTrack: Track | null;
  progress: number; // seconds elapsed
  volume: number; // 0-100
  pauseReason: PauseReason | null;
}

export interface PhoneSyncState {
  connected: boolean;
  appName: string | null;
}

export class MusicPlayer {
  private status: PlaybackStatus = 'stopped';
  private playlist: Track[] = [];
  private currentIndex = -1;
  private progress = 0;
  private volume: number = DEFAULT_VOLUME;
  private pauseReason: PauseReason | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private phoneSyncState: PhoneSyncState = { connected: false, appName: null };

  constructor(playlist?: Track[]) {
    if (playlist && playlist.length > 0) {
      this.playlist = [...playlist];
      this.currentIndex = 0;
    }
  }

  // ─── 基本播放控制 — 需求 13.1 ───

  /** 播放当前曲目 */
  play(): void {
    if (this.playlist.length === 0) return;
    if (this.currentIndex < 0) this.currentIndex = 0;

    this.status = 'playing';
    this.pauseReason = null;
    this.startProgressTimer();
  }

  /** 暂停播放 */
  pause(reason: PauseReason = 'user'): void {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.pauseReason = reason;
    this.stopProgressTimer();
  }

  /** 下一曲 */
  next(): void {
    if (this.playlist.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.progress = 0;
    if (this.status === 'playing') {
      this.restartProgressTimer();
    }
  }

  /** 上一曲 */
  prev(): void {
    if (this.playlist.length === 0) return;
    // If more than 3 seconds into the track, restart current track
    if (this.progress > 3) {
      this.progress = 0;
      return;
    }
    this.currentIndex =
      (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.progress = 0;
    if (this.status === 'playing') {
      this.restartProgressTimer();
    }
  }

  /** 设置音量 (0-100) — 需求 13.1 */
  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(100, Math.round(level)));
  }

  // ─── 侧边触控双击切换 — 需求 13.2 ───

  /** 切换播放/暂停状态（侧边触控双击） */
  togglePlayPause(): void {
    if (this.status === 'playing') {
      this.pause('user');
    } else {
      this.play();
    }
  }

  // ─── 当前曲目信息 — 需求 13.3 ───

  /** 获取当前曲目（用于 Launcher 显示） */
  getCurrentTrack(): Track | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.playlist.length) {
      return null;
    }
    return { ...this.playlist[this.currentIndex] };
  }

  // ─── 配对手机音乐应用联动 — 需求 13.4 ───

  /** 连接配对手机音乐应用 */
  connectPhoneApp(appName: string): void {
    this.phoneSyncState = { connected: true, appName };
  }

  /** 断开配对手机音乐应用 */
  disconnectPhoneApp(): void {
    this.phoneSyncState = { connected: false, appName: null };
  }

  /** 从手机同步播放状态 */
  syncFromPhone(track: Track, progress: number, isPlaying: boolean): void {
    if (!this.phoneSyncState.connected) return;

    // Add track to playlist if not present
    const existingIdx = this.playlist.findIndex((t) => t.id === track.id);
    if (existingIdx >= 0) {
      this.currentIndex = existingIdx;
    } else {
      this.playlist.push(track);
      this.currentIndex = this.playlist.length - 1;
    }

    this.progress = progress;

    if (isPlaying && this.status !== 'playing') {
      this.status = 'playing';
      this.pauseReason = null;
      this.startProgressTimer();
    } else if (!isPlaying && this.status === 'playing') {
      this.status = 'paused';
      this.pauseReason = 'phone_sync';
      this.stopProgressTimer();
    }
  }

  /** 获取手机同步状态 */
  getPhoneSyncState(): PhoneSyncState {
    return { ...this.phoneSyncState };
  }

  // ─── 来电自动暂停 — 需求 13.5 ───

  /** 来电时自动暂停 */
  onIncomingCall(): void {
    if (this.status === 'playing') {
      this.pause('incoming_call');
    }
  }

  /** 通话结束后恢复播放 */
  onCallEnded(): void {
    if (this.status === 'paused' && this.pauseReason === 'incoming_call') {
      this.play();
    }
  }

  // ─── 播放列表管理 ───

  /** 设置播放列表 */
  setPlaylist(tracks: Track[]): void {
    this.playlist = [...tracks];
    this.currentIndex = tracks.length > 0 ? 0 : -1;
    this.progress = 0;
    if (this.status === 'playing') {
      this.status = 'stopped';
      this.stopProgressTimer();
    }
  }

  /** 获取播放列表 */
  getPlaylist(): Track[] {
    return [...this.playlist];
  }

  // ─── 状态查询 ───

  /** 获取完整播放状态 */
  getPlaybackState(): PlaybackState {
    return {
      status: this.status,
      currentTrack: this.getCurrentTrack(),
      progress: this.progress,
      volume: this.volume,
      pauseReason: this.pauseReason,
    };
  }

  /** 清理资源 */
  dispose(): void {
    this.stopProgressTimer();
  }

  // ─── 内部方法 ───

  private startProgressTimer(): void {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      if (this.status === 'playing') {
        const track = this.getCurrentTrack();
        if (track && this.progress >= track.duration) {
          // Auto-advance to next track
          this.next();
        } else {
          this.progress++;
        }
      }
    }, PROGRESS_INTERVAL);
  }

  private stopProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private restartProgressTimer(): void {
    if (this.status === 'playing') {
      this.startProgressTimer();
    }
  }
}
