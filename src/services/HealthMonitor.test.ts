import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HealthMonitor } from './HealthMonitor';

/**
 * HealthMonitor 单元测试
 * 需求: 16.1, 16.2, 16.3, 16.4, 16.5
 */

describe('HealthMonitor', () => {
  let hm: HealthMonitor;

  beforeEach(() => {
    hm = new HealthMonitor();
  });

  afterEach(() => {
    hm.dispose();
  });

  // ─── 初始状态 ───

  describe('初始状态', () => {
    it('starts idle with default health data', () => {
      expect(hm.getStatus()).toBe('idle');
      const data = hm.getHealthData();
      expect(data.steps).toBe(0);
      expect(data.heartRate).toBe(72);
      expect(data.calories).toBe(0);
    });

    it('no device connected by default', () => {
      expect(hm.isDeviceConnected()).toBe(false);
      expect(hm.getDeviceName()).toBeNull();
    });

    it('no workout active by default', () => {
      expect(hm.getCurrentWorkout()).toBeNull();
    });

    it('no alerts by default', () => {
      expect(hm.getAlerts()).toHaveLength(0);
    });

    it('accepts initial data', () => {
      const m = new HealthMonitor({ steps: 5000, heartRate: 80, calories: 200 });
      const data = m.getHealthData();
      expect(data.steps).toBe(5000);
      expect(data.heartRate).toBe(80);
      expect(data.calories).toBe(200);
      m.dispose();
    });
  });

  // ─── 基础健康数据 — 需求 16.1 ───

  describe('基础健康数据 (需求 16.1)', () => {
    it('updates steps', () => {
      hm.updateSteps(8000);
      expect(hm.getHealthData().steps).toBe(8000);
    });

    it('adds steps incrementally', () => {
      hm.updateSteps(1000);
      hm.addSteps(500);
      expect(hm.getHealthData().steps).toBe(1500);
    });

    it('clamps steps to non-negative', () => {
      hm.updateSteps(-100);
      expect(hm.getHealthData().steps).toBe(0);
    });

    it('updates heart rate', () => {
      hm.updateHeartRate(85);
      expect(hm.getHealthData().heartRate).toBe(85);
    });

    it('updates calories', () => {
      hm.updateCalories(350);
      expect(hm.getHealthData().calories).toBe(350);
    });

    it('adds calories incrementally', () => {
      hm.updateCalories(100);
      hm.addCalories(50);
      expect(hm.getHealthData().calories).toBe(150);
    });
  });

  // ─── 运动类型识别 — 需求 16.2 ───

  describe('运动类型识别 (需求 16.2)', () => {
    it('detects cycling at high speed', () => {
      expect(hm.detectExerciseType({ speed: 20, cadence: 80 })).toBe('cycling');
    });

    it('detects running at moderate speed', () => {
      expect(hm.detectExerciseType({ speed: 10, cadence: 160 })).toBe('running');
    });

    it('detects walking at low speed with cadence', () => {
      expect(hm.detectExerciseType({ speed: 4, cadence: 100 })).toBe('walking');
    });

    it('detects hiking with altitude change', () => {
      expect(hm.detectExerciseType({ speed: 4, cadence: 30, altitude: 10 })).toBe('hiking');
    });

    it('returns unknown for stationary', () => {
      expect(hm.detectExerciseType({ speed: 0, cadence: 0 })).toBe('unknown');
    });
  });

  // ─── 运动记录 — 需求 16.2, 16.3 ───

  describe('运动记录 (需求 16.2, 16.3)', () => {
    it('starts a workout session', () => {
      hm.startWorkout('running');
      const workout = hm.getCurrentWorkout();
      expect(workout).not.toBeNull();
      expect(workout!.type).toBe('running');
      expect(workout!.isActive).toBe(true);
      expect(hm.getStatus()).toBe('workout');
    });

    it('throws when starting workout while one is active', () => {
      hm.startWorkout('running');
      expect(() => hm.startWorkout('cycling')).toThrow('已有运动正在记录中');
    });

    it('stops a workout and returns session', () => {
      hm.startWorkout('walking');
      const session = hm.stopWorkout();
      expect(session).not.toBeNull();
      expect(session!.isActive).toBe(false);
      expect(hm.getStatus()).toBe('monitoring');
    });

    it('returns null when stopping with no active workout', () => {
      expect(hm.stopWorkout()).toBeNull();
    });

    it('updates workout distance', () => {
      hm.startWorkout('running');
      hm.updateWorkoutDistance(2500);
      expect(hm.getCurrentWorkout()!.distance).toBe(2500);
    });

    it('updates workout type', () => {
      hm.startWorkout();
      hm.updateWorkoutType('cycling');
      expect(hm.getCurrentWorkout()!.type).toBe('cycling');
    });

    it('defaults to unknown exercise type', () => {
      hm.startWorkout();
      expect(hm.getCurrentWorkout()!.type).toBe('unknown');
    });
  });

  // ─── 心率异常检测 — 需求 16.5 ───

  describe('心率异常检测 (需求 16.5)', () => {
    it('generates alert for high heart rate', () => {
      hm.updateHeartRate(200);
      const alerts = hm.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('too_high');
      expect(alerts[0].heartRate).toBe(200);
    });

    it('generates alert for low heart rate', () => {
      hm.updateHeartRate(40);
      const alerts = hm.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('too_low');
      expect(alerts[0].heartRate).toBe(40);
    });

    it('no alert for normal heart rate', () => {
      hm.updateHeartRate(75);
      expect(hm.getAlerts()).toHaveLength(0);
    });

    it('returns latest alert', () => {
      hm.updateHeartRate(200);
      hm.updateHeartRate(30);
      const latest = hm.getLatestAlert();
      expect(latest).not.toBeNull();
      expect(latest!.type).toBe('too_low');
    });

    it('clears alerts', () => {
      hm.updateHeartRate(200);
      hm.clearAlerts();
      expect(hm.getAlerts()).toHaveLength(0);
    });

    it('returns heart rate range', () => {
      const range = hm.getHeartRateRange();
      expect(range.low).toBe(50);
      expect(range.high).toBe(180);
    });
  });

  // ─── 设备同步 — 需求 16.4 ───

  describe('设备同步 (需求 16.4)', () => {
    it('connects device', () => {
      hm.connectDevice('小米手环 8');
      expect(hm.isDeviceConnected()).toBe(true);
      expect(hm.getDeviceName()).toBe('小米手环 8');
      expect(hm.getStatus()).toBe('monitoring');
    });

    it('disconnects device', () => {
      hm.connectDevice('手环');
      hm.disconnectDevice();
      expect(hm.isDeviceConnected()).toBe(false);
      expect(hm.getDeviceName()).toBeNull();
    });

    it('syncs data from device', () => {
      hm.connectDevice('手环');
      hm.syncFromDevice({ steps: 12000, heartRate: 90, calories: 500 });
      const data = hm.getHealthData();
      expect(data.steps).toBe(12000);
      expect(data.heartRate).toBe(90);
      expect(data.calories).toBe(500);
    });

    it('throws when syncing without device', () => {
      expect(() => hm.syncFromDevice({ steps: 100 })).toThrow('未连接配对设备');
    });

    it('sync triggers heart rate anomaly check', () => {
      hm.connectDevice('手环');
      hm.syncFromDevice({ heartRate: 200 });
      expect(hm.getAlerts()).toHaveLength(1);
    });
  });

  // ─── 状态查询 ───

  describe('getState', () => {
    it('returns complete state', () => {
      const state = hm.getState();
      expect(state.status).toBe('idle');
      expect(state.healthData.steps).toBe(0);
      expect(state.currentWorkout).toBeNull();
      expect(state.alerts).toHaveLength(0);
      expect(state.deviceConnected).toBe(false);
      expect(state.deviceName).toBeNull();
    });
  });

  // ─── 清理 ───

  describe('dispose', () => {
    it('cleans up resources', () => {
      hm.startWorkout('running');
      hm.updateHeartRate(200);
      hm.dispose();
      expect(hm.getStatus()).toBe('idle');
      expect(hm.getCurrentWorkout()).toBeNull();
      expect(hm.getAlerts()).toHaveLength(0);
    });
  });
});
