import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CameraView } from './CameraView';
import type { CameraViewProps } from './CameraView';
import type { RecordingState, StorageInfo } from '../../services/CameraModule';

/**
 * CameraView 单元测试
 * 需求: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

function makeRecording(overrides?: Partial<RecordingState>): RecordingState {
  return {
    isRecording: false,
    startTime: null,
    duration: 0,
    resolution: { width: 1920, height: 1080 },
    ...overrides,
  };
}

function makeStorage(overrides?: Partial<StorageInfo>): StorageInfo {
  return {
    total: 32768,
    used: 20480,
    remaining: 12288,
    isLow: false,
    ...overrides,
  };
}

function makeProps(overrides?: Partial<CameraViewProps>): CameraViewProps {
  return {
    recordingState: makeRecording(),
    storageInfo: makeStorage(),
    ...overrides,
  };
}

function render(props: CameraViewProps): string {
  return renderToStaticMarkup(createElement(CameraView, props));
}

describe('CameraView', () => {
  // ─── 基本渲染 ───

  describe('基本渲染', () => {
    it('renders camera view container', () => {
      const html = render(makeProps());
      expect(html).toContain('camera-view');
    });

    it('renders capture button', () => {
      const html = render(makeProps());
      expect(html).toContain('capture-btn');
    });

    it('renders record button', () => {
      const html = render(makeProps());
      expect(html).toContain('record-btn');
    });

    it('renders viewfinder', () => {
      const html = render(makeProps());
      expect(html).toContain('viewfinder');
    });
  });

  // ─── 录制状态指示 — 需求 12.2 ───

  describe('录制状态指示 (需求 12.2)', () => {
    it('shows recording indicator when recording', () => {
      const html = render(makeProps({
        recordingState: makeRecording({ isRecording: true, startTime: Date.now(), duration: 10 }),
      }));
      expect(html).toContain('recording-indicator');
      expect(html).toContain('recording-dot');
    });

    it('does not show recording indicator when not recording', () => {
      const html = render(makeProps());
      expect(html).not.toContain('recording-indicator');
    });

    it('record button shows stop icon when recording', () => {
      const html = render(makeProps({
        recordingState: makeRecording({ isRecording: true, startTime: Date.now(), duration: 5 }),
      }));
      expect(html).toContain('aria-label="停止录像"');
    });

    it('record button shows start icon when not recording', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="开始录像"');
    });
  });

  // ─── 录制时长 — 需求 12.4 ───

  describe('录制时长 (需求 12.4)', () => {
    it('shows formatted duration when recording', () => {
      const html = render(makeProps({
        recordingState: makeRecording({ isRecording: true, startTime: Date.now(), duration: 65 }),
      }));
      expect(html).toContain('recording-duration');
      expect(html).toContain('01:05');
    });

    it('shows hours when duration exceeds 3600s', () => {
      const html = render(makeProps({
        recordingState: makeRecording({ isRecording: true, startTime: Date.now(), duration: 3661 }),
      }));
      expect(html).toContain('1:01:01');
    });
  });

  // ─── 存储空间显示 — 需求 12.4, 12.5 ───

  describe('存储空间显示 (需求 12.4, 12.5)', () => {
    it('shows remaining storage in GB', () => {
      const html = render(makeProps({
        storageInfo: makeStorage({ remaining: 12288 }),
      }));
      expect(html).toContain('12.0 GB');
      expect(html).toContain('可用');
    });

    it('shows remaining storage in MB when < 1GB', () => {
      const html = render(makeProps({
        storageInfo: makeStorage({ remaining: 800 }),
      }));
      expect(html).toContain('800 MB');
    });

    it('shows low storage warning when isLow is true', () => {
      const html = render(makeProps({
        storageInfo: makeStorage({ remaining: 400, isLow: true }),
      }));
      expect(html).toContain('low-storage-warning');
      expect(html).toContain('请清理空间');
    });

    it('does not show low storage warning when storage is ok', () => {
      const html = render(makeProps());
      expect(html).not.toContain('low-storage-warning');
    });

    it('shows warning icon when storage is low', () => {
      const html = render(makeProps({
        storageInfo: makeStorage({ isLow: true }),
      }));
      // Warning icon rendered as SVG via Icon component
      expect(html).toContain('<svg');
    });
  });

  // ─── 分辨率显示 — 需求 12.3 ───

  describe('分辨率显示 (需求 12.3)', () => {
    it('shows resolution label', () => {
      const html = render(makeProps());
      expect(html).toContain('resolution-label');
      expect(html).toContain('1920');
      expect(html).toContain('1080');
    });
  });

  // ─── 同步状态 — 需求 12.6 ───

  describe('同步状态 (需求 12.6)', () => {
    it('shows sync status when items pending', () => {
      const html = render(makeProps({ syncPending: 3 }));
      expect(html).toContain('sync-status');
      expect(html).toContain('同步中');
      expect(html).toContain('(3)');
    });

    it('does not show sync status when no items pending', () => {
      const html = render(makeProps({ syncPending: 0 }));
      expect(html).not.toContain('sync-status');
    });
  });

  // ─── 无障碍 ───

  describe('无障碍', () => {
    it('has region role', () => {
      const html = render(makeProps());
      expect(html).toContain('role="region"');
    });

    it('has aria-label', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="相机"');
    });

    it('capture button has aria-label', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="拍照"');
    });

    it('low storage warning has alert role', () => {
      const html = render(makeProps({
        storageInfo: makeStorage({ isLow: true }),
      }));
      expect(html).toContain('role="alert"');
    });
  });
});
