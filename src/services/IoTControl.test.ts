import { describe, it, expect, beforeEach } from 'vitest';
import { IoTControlService } from './IoTControl';

describe('IoTControlService', () => {
  let svc: IoTControlService;

  beforeEach(() => {
    svc = new IoTControlService();
  });

  describe('queryDeviceStatus (requirement 9.3)', () => {
    it('returns status for an existing device', () => {
      const result = svc.queryDeviceStatus('客厅灯');
      expect(result.success).toBe(true);
      expect(result.data?.device).toBe('客厅灯');
    });

    it('returns failure for unknown device', () => {
      const result = svc.queryDeviceStatus('不存在的设备');
      expect(result.success).toBe(false);
      expect(result.message).toContain('未找到设备');
    });

    it('returns failure for offline device', () => {
      svc.addDevice({
        name: '离线灯',
        type: 'light',
        room: '书房',
        online: false,
        state: {},
      });
      const result = svc.queryDeviceStatus('离线灯');
      expect(result.success).toBe(false);
      expect(result.message).toContain('离线');
    });
  });

  describe('triggerScene (requirement 9.4)', () => {
    it('triggers a predefined scene', () => {
      const result = svc.triggerScene('回家模式');
      expect(result.success).toBe(true);
      expect(result.message).toContain('回家模式');
      expect(result.data?.scene).toBe('回家模式');
    });

    it('returns failure for unknown scene', () => {
      const result = svc.triggerScene('不存在的场景');
      expect(result.success).toBe(false);
      expect(result.message).toContain('未找到场景');
    });
  });

  describe('executeAction (requirement 9.5)', () => {
    it('executes action on an online device', () => {
      const result = svc.executeAction('客厅灯', '关闭');
      expect(result.success).toBe(true);
      expect(result.message).toContain('关闭');
    });

    it('returns failure for unknown device', () => {
      const result = svc.executeAction('不存在', '打开');
      expect(result.success).toBe(false);
    });

    it('returns failure for offline device', () => {
      svc.addDevice({
        name: '离线设备',
        type: 'light',
        room: '厨房',
        online: false,
        state: {},
      });
      const result = svc.executeAction('离线设备', '打开');
      expect(result.success).toBe(false);
      expect(result.message).toContain('离线');
    });
  });

  describe('getDevices', () => {
    it('returns default devices', () => {
      const devices = svc.getDevices();
      expect(devices.length).toBeGreaterThanOrEqual(5);
      expect(devices.map((d) => d.name)).toContain('客厅灯');
    });

    it('includes custom added devices', () => {
      svc.addDevice({
        name: '测试灯',
        type: 'light',
        room: '测试',
        online: true,
        state: {},
      });
      expect(svc.getDevices().map((d) => d.name)).toContain('测试灯');
    });
  });
});
