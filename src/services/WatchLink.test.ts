import { describe, it, expect, beforeEach } from 'vitest';
import { WatchLinkService } from './WatchLink';

describe('WatchLinkService', () => {
  let svc: WatchLinkService;

  beforeEach(() => {
    svc = new WatchLinkService();
  });

  describe('queryWatchData (requirement 9.9)', () => {
    it('returns step count', () => {
      const result = svc.queryWatchData('今天走了多少步');
      expect(result.success).toBe(true);
      expect(result.data?.steps).toBeDefined();
    });

    it('returns heart rate', () => {
      const result = svc.queryWatchData('当前心率');
      expect(result.success).toBe(true);
      expect(result.data?.heartRate).toBeDefined();
    });

    it('returns calories', () => {
      const result = svc.queryWatchData('消耗了多少卡路里');
      expect(result.success).toBe(true);
      expect(result.data?.calories).toBeDefined();
    });

    it('returns exercise minutes', () => {
      const result = svc.queryWatchData('今天运动了多少时间');
      expect(result.success).toBe(true);
      expect(result.data?.exerciseMinutes).toBeDefined();
    });

    it('returns battery level', () => {
      const result = svc.queryWatchData('手表电量');
      expect(result.success).toBe(true);
      expect(result.data?.batteryLevel).toBeDefined();
    });

    it('returns general data for unrecognized query', () => {
      const result = svc.queryWatchData('手表状态');
      expect(result.success).toBe(true);
      expect(result.data?.steps).toBeDefined();
      expect(result.data?.heartRate).toBeDefined();
    });

    it('fails when disconnected', () => {
      svc.setConnected(false);
      const result = svc.queryWatchData('步数');
      expect(result.success).toBe(false);
      expect(result.message).toContain('未连接');
    });
  });

  describe('executeWatchAction (requirement 9.9)', () => {
    it('starts exercise recording', () => {
      const result = svc.executeWatchAction('开始运动记录');
      expect(result.success).toBe(true);
      expect(result.data?.isRecording).toBe(true);
      expect(svc.getWatchStatus().isRecording).toBe(true);
    });

    it('stops exercise recording', () => {
      svc.executeWatchAction('开始运动记录');
      const result = svc.executeWatchAction('停止运动记录');
      expect(result.success).toBe(true);
      expect(result.data?.isRecording).toBe(false);
    });

    it('handles generic action', () => {
      const result = svc.executeWatchAction('设置闹钟');
      expect(result.success).toBe(true);
    });

    it('fails when disconnected', () => {
      svc.setConnected(false);
      const result = svc.executeWatchAction('开始运动');
      expect(result.success).toBe(false);
    });
  });

  describe('getWatchStatus', () => {
    it('returns a copy of watch status', () => {
      const status = svc.getWatchStatus();
      expect(status.model).toBeDefined();
      expect(status.steps).toBeGreaterThan(0);
    });
  });
});
