import { describe, it, expect, beforeEach } from 'vitest';
import { VehicleLinkService } from './VehicleLink';

describe('VehicleLinkService', () => {
  let svc: VehicleLinkService;

  beforeEach(() => {
    svc = new VehicleLinkService();
  });

  describe('queryVehicleStatus (requirement 9.6)', () => {
    it('returns battery and range info', () => {
      const result = svc.queryVehicleStatus('车还有多少电量');
      expect(result.success).toBe(true);
      expect(result.data?.batteryLevel).toBeDefined();
      expect(result.data?.range).toBeDefined();
    });

    it('returns location info', () => {
      const result = svc.queryVehicleStatus('车停在哪里');
      expect(result.success).toBe(true);
      expect(result.data?.location).toBeDefined();
    });

    it('returns lock status', () => {
      const result = svc.queryVehicleStatus('车门锁了吗');
      expect(result.success).toBe(true);
      expect(result.data?.locked).toBeDefined();
    });

    it('returns general info for unrecognized query', () => {
      const result = svc.queryVehicleStatus('车辆信息');
      expect(result.success).toBe(true);
    });

    it('fails when disconnected', () => {
      svc.setConnected(false);
      const result = svc.queryVehicleStatus('电量');
      expect(result.success).toBe(false);
      expect(result.message).toContain('连接断开');
    });
  });

  describe('sendToVehicle (requirement 9.7)', () => {
    it('sends data to vehicle', () => {
      const result = svc.sendToVehicle('把导航发送到车机');
      expect(result.success).toBe(true);
      expect(result.data?.sent).toBe('把导航发送到车机');
    });

    it('fails when disconnected', () => {
      svc.setConnected(false);
      const result = svc.sendToVehicle('导航');
      expect(result.success).toBe(false);
    });
  });

  describe('executeVehicleAction (requirement 9.8)', () => {
    it('opens window', () => {
      const result = svc.executeVehicleAction('打开车窗');
      expect(result.success).toBe(true);
      expect(result.data?.windowOpen).toBe(true);
      expect(svc.getVehicleInfo().windowOpen).toBe(true);
    });

    it('turns on AC', () => {
      const result = svc.executeVehicleAction('预热空调');
      expect(result.success).toBe(true);
      expect(result.data?.acOn).toBe(true);
    });

    it('unlocks vehicle', () => {
      const result = svc.executeVehicleAction('解锁车门');
      expect(result.success).toBe(true);
      expect(result.data?.locked).toBe(false);
    });

    it('locks vehicle', () => {
      svc.executeVehicleAction('解锁');
      const result = svc.executeVehicleAction('锁车');
      expect(result.success).toBe(true);
      expect(result.data?.locked).toBe(true);
    });

    it('handles generic action', () => {
      const result = svc.executeVehicleAction('鸣笛');
      expect(result.success).toBe(true);
    });

    it('fails when disconnected', () => {
      svc.setConnected(false);
      const result = svc.executeVehicleAction('打开车窗');
      expect(result.success).toBe(false);
    });
  });

  describe('getVehicleInfo', () => {
    it('returns a copy of vehicle info', () => {
      const info = svc.getVehicleInfo();
      expect(info.model).toBeDefined();
      expect(info.batteryLevel).toBeGreaterThan(0);
    });
  });
});
