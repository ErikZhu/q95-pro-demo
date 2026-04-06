/**
 * CameraModule — 拍照与录像服务
 *
 * 拍照（300ms 内完成）、录像状态管理、存储空间监控、自动同步到配对手机。
 * Demo 中使用模拟数据。
 *
 * 需求: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

/** 拍照最大延迟（ms） */
const CAPTURE_DELAY = 150;
/** 存储空间不足阈值（MB） */
const LOW_STORAGE_THRESHOLD = 500;
/** 模拟同步延迟（ms） */
const SYNC_DELAY = 300;

export interface PhotoMetadata {
  id: string;
  timestamp: number;
  resolution: { width: number; height: number };
  fileSize: number; // MB
  synced: boolean;
}

export interface StorageInfo {
  total: number;   // MB
  used: number;    // MB
  remaining: number; // MB
  isLow: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  duration: number; // seconds
  resolution: { width: number; height: number };
}

export interface CameraState {
  recording: RecordingState;
  storage: StorageInfo;
  photos: PhotoMetadata[];
  syncQueue: string[]; // photo/video IDs pending sync
}

export class CameraModule {
  private recording: RecordingState;
  private storage: StorageInfo;
  private photos: PhotoMetadata[] = [];
  private syncQueue: string[] = [];
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private photoCounter = 0;

  constructor(totalStorage = 32768, usedStorage = 20480) {
    this.recording = {
      isRecording: false,
      startTime: null,
      duration: 0,
      resolution: { width: 1920, height: 1080 },
    };

    const remaining = totalStorage - usedStorage;
    this.storage = {
      total: totalStorage,
      used: usedStorage,
      remaining,
      isLow: remaining < LOW_STORAGE_THRESHOLD,
    };
  }

  /**
   * 拍照 — 需求 12.1, 12.3
   * 在 300ms 内完成拍照，返回照片元数据。
   * 支持不低于 1080p 分辨率。
   */
  async takePhoto(): Promise<PhotoMetadata> {
    if (this.storage.remaining < 5) {
      throw new Error('存储空间不足，无法拍照');
    }

    await new Promise((resolve) => setTimeout(resolve, CAPTURE_DELAY));

    this.photoCounter++;
    const fileSize = 3 + Math.random() * 5; // 3-8 MB
    const photo: PhotoMetadata = {
      id: `photo_${Date.now()}_${this.photoCounter}`,
      timestamp: Date.now(),
      resolution: { width: 1920, height: 1080 },
      fileSize: Math.round(fileSize * 100) / 100,
      synced: false,
    };

    this.photos.push(photo);
    this.updateStorage(fileSize);
    this.syncQueue.push(photo.id);

    // 自动同步到配对手机 — 需求 12.6
    this.autoSync(photo.id);

    return photo;
  }

  /**
   * 开始录像 — 需求 12.2, 12.4
   * 立即开始录制并管理录制状态。
   */
  startRecording(): void {
    if (this.recording.isRecording) {
      throw new Error('已在录制中');
    }

    if (this.storage.remaining < LOW_STORAGE_THRESHOLD) {
      throw new Error('存储空间不足，无法开始录制');
    }

    this.recording = {
      isRecording: true,
      startTime: Date.now(),
      duration: 0,
      resolution: { width: 1920, height: 1080 },
    };

    // 模拟录制时长递增
    this.recordingTimer = setInterval(() => {
      if (this.recording.isRecording && this.recording.startTime) {
        this.recording.duration = Math.floor(
          (Date.now() - this.recording.startTime) / 1000,
        );

        // 模拟存储消耗（约 10MB/秒 for 1080p）
        this.updateStorage(0.17); // ~10MB/min per tick at 1s interval

        // 存储不足时自动停止 — 需求 12.5
        if (this.storage.remaining < 50) {
          this.stopRecording();
        }
      }
    }, 1000);
  }

  /**
   * 停止录像 — 需求 12.2
   * 停止录制并返回录制信息。
   */
  stopRecording(): { duration: number; fileSize: number } | null {
    if (!this.recording.isRecording) {
      return null;
    }

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    const duration = this.recording.duration;
    const fileSize = Math.round(duration * 10 * 100) / 100; // ~10MB/s

    const videoId = `video_${Date.now()}`;
    this.syncQueue.push(videoId);
    this.autoSync(videoId);

    this.recording = {
      isRecording: false,
      startTime: null,
      duration: 0,
      resolution: { width: 1920, height: 1080 },
    };

    return { duration, fileSize };
  }

  /** 获取录制状态 — 需求 12.4 */
  getRecordingState(): RecordingState {
    // 实时计算 duration
    if (this.recording.isRecording && this.recording.startTime) {
      return {
        ...this.recording,
        duration: Math.floor((Date.now() - this.recording.startTime) / 1000),
      };
    }
    return { ...this.recording };
  }

  /** 获取存储信息 — 需求 12.4, 12.5 */
  getStorageInfo(): StorageInfo {
    return { ...this.storage };
  }

  /** 获取所有照片 */
  getPhotos(): PhotoMetadata[] {
    return [...this.photos];
  }

  /** 获取完整相机状态 */
  getState(): CameraState {
    return {
      recording: this.getRecordingState(),
      storage: this.getStorageInfo(),
      photos: this.getPhotos(),
      syncQueue: [...this.syncQueue],
    };
  }

  /** 清理资源 */
  dispose(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /** 更新存储空间 */
  private updateStorage(consumedMB: number): void {
    this.storage.used = Math.round((this.storage.used + consumedMB) * 100) / 100;
    this.storage.remaining = Math.round(
      (this.storage.total - this.storage.used) * 100,
    ) / 100;
    this.storage.isLow = this.storage.remaining < LOW_STORAGE_THRESHOLD;
  }

  /**
   * 自动同步到配对手机 — 需求 12.6
   * Demo 中模拟同步过程。
   */
  private autoSync(itemId: string): void {
    setTimeout(() => {
      const idx = this.syncQueue.indexOf(itemId);
      if (idx !== -1) {
        this.syncQueue.splice(idx, 1);
      }
      // 标记照片为已同步
      const photo = this.photos.find((p) => p.id === itemId);
      if (photo) {
        photo.synced = true;
      }
    }, SYNC_DELAY);
  }
}
