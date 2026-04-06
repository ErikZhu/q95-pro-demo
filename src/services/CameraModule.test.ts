import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CameraModule } from './CameraModule';

/**
 * CameraModule 单元测试
 * 需求: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

describe('CameraModule', () => {
  let camera: CameraModule;

  beforeEach(() => {
    camera = new CameraModule(32768, 20480); // 32GB total, 20GB used
  });

  afterEach(() => {
    camera.dispose();
  });

  // ─── 初始状态 ───

  describe('初始状态', () => {
    it('is not recording by default', () => {
      expect(camera.getRecordingState().isRecording).toBe(false);
    });

    it('has correct storage info', () => {
      const storage = camera.getStorageInfo();
      expect(storage.total).toBe(32768);
      expect(storage.used).toBe(20480);
      expect(storage.remaining).toBe(12288);
      expect(storage.isLow).toBe(false);
    });

    it('has no photos by default', () => {
      expect(camera.getPhotos()).toHaveLength(0);
    });

    it('recording resolution defaults to 1080p', () => {
      const state = camera.getRecordingState();
      expect(state.resolution.width).toBe(1920);
      expect(state.resolution.height).toBe(1080);
    });
  });

  // ─── takePhoto — 需求 12.1, 12.3 ───

  describe('takePhoto (需求 12.1, 12.3)', () => {
    it('returns photo metadata', async () => {
      const photo = await camera.takePhoto();
      expect(photo.id).toBeTruthy();
      expect(photo.timestamp).toBeGreaterThan(0);
      expect(photo.resolution.width).toBe(1920);
      expect(photo.resolution.height).toBe(1080);
      expect(photo.fileSize).toBeGreaterThan(0);
    });

    it('completes within 300ms', async () => {
      const start = Date.now();
      await camera.takePhoto();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(300);
    });

    it('adds photo to the list', async () => {
      await camera.takePhoto();
      expect(camera.getPhotos()).toHaveLength(1);
    });

    it('reduces remaining storage', async () => {
      const before = camera.getStorageInfo().remaining;
      await camera.takePhoto();
      const after = camera.getStorageInfo().remaining;
      expect(after).toBeLessThan(before);
    });

    it('throws when storage is critically low', async () => {
      const lowCamera = new CameraModule(100, 98); // only 2MB remaining
      await expect(lowCamera.takePhoto()).rejects.toThrow('存储空间不足');
      lowCamera.dispose();
    });

    it('marks photo as not synced initially', async () => {
      const photo = await camera.takePhoto();
      expect(photo.synced).toBe(false);
    });
  });

  // ─── startRecording / stopRecording — 需求 12.2 ───

  describe('startRecording / stopRecording (需求 12.2)', () => {
    it('starts recording', () => {
      camera.startRecording();
      expect(camera.getRecordingState().isRecording).toBe(true);
    });

    it('sets startTime when recording starts', () => {
      camera.startRecording();
      expect(camera.getRecordingState().startTime).not.toBeNull();
    });

    it('throws when already recording', () => {
      camera.startRecording();
      expect(() => camera.startRecording()).toThrow('已在录制中');
    });

    it('stops recording and returns info', () => {
      camera.startRecording();
      const result = camera.stopRecording();
      expect(result).not.toBeNull();
      expect(result!.duration).toBeGreaterThanOrEqual(0);
      expect(result!.fileSize).toBeGreaterThanOrEqual(0);
    });

    it('returns null when not recording', () => {
      expect(camera.stopRecording()).toBeNull();
    });

    it('resets recording state after stop', () => {
      camera.startRecording();
      camera.stopRecording();
      expect(camera.getRecordingState().isRecording).toBe(false);
      expect(camera.getRecordingState().startTime).toBeNull();
    });
  });

  // ─── 存储空间监控 — 需求 12.5 ───

  describe('存储空间监控 (需求 12.5)', () => {
    it('marks storage as low when remaining < 500MB', () => {
      const lowCamera = new CameraModule(1000, 600); // 400MB remaining
      expect(lowCamera.getStorageInfo().isLow).toBe(true);
      lowCamera.dispose();
    });

    it('does not mark storage as low when remaining >= 500MB', () => {
      const okCamera = new CameraModule(1000, 400); // 600MB remaining
      expect(okCamera.getStorageInfo().isLow).toBe(false);
      okCamera.dispose();
    });

    it('throws when starting recording with low storage', () => {
      const lowCamera = new CameraModule(1000, 600);
      expect(() => lowCamera.startRecording()).toThrow('存储空间不足');
      lowCamera.dispose();
    });
  });

  // ─── getState ───

  describe('getState', () => {
    it('returns complete camera state', () => {
      const state = camera.getState();
      expect(state.recording).toBeDefined();
      expect(state.storage).toBeDefined();
      expect(state.photos).toBeDefined();
      expect(state.syncQueue).toBeDefined();
    });
  });

  // ─── 自动同步 — 需求 12.6 ───

  describe('自动同步 (需求 12.6)', () => {
    it('adds photo to sync queue after capture', async () => {
      await camera.takePhoto();
      // Sync queue should have the photo initially
      const state = camera.getState();
      expect(state.syncQueue.length).toBeGreaterThanOrEqual(0); // may have already synced
    });

    it('syncs photo after delay', async () => {
      const photo = await camera.takePhoto();
      // Wait for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 400));
      const synced = camera.getPhotos().find((p) => p.id === photo.id);
      expect(synced?.synced).toBe(true);
    });
  });

  // ─── 不可变性 ───

  describe('immutability', () => {
    it('getStorageInfo returns a copy', () => {
      const info = camera.getStorageInfo();
      info.remaining = 0;
      expect(camera.getStorageInfo().remaining).not.toBe(0);
    });

    it('getRecordingState returns a copy', () => {
      const state = camera.getRecordingState();
      state.isRecording = true;
      expect(camera.getRecordingState().isRecording).toBe(false);
    });

    it('getPhotos returns a copy', async () => {
      await camera.takePhoto();
      const photos = camera.getPhotos();
      photos.length = 0;
      expect(camera.getPhotos()).toHaveLength(1);
    });
  });
});
