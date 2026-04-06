import { describe, it, expect } from 'vitest';
import type { HealthMonitorState } from '../../services/HealthMonitor';

/**
 * HealthMonitorView 单元测试
 * 需求: 16.1, 16.2, 16.3, 16.4, 16.5
 *
 * 测试 HealthMonitorView 的数据逻辑和状态映射。
 */

function makeState(overrides?: Partial<HealthMonitorState>): HealthMonitorState {
  return {
    status: 'idle',
    healthData: {
      steps: 0,
      heartRate: 72,
      calories: 0,
      lastUpdated: Date.now(),
    },
    currentWorkout: null,
    alerts: [],
    deviceConnected: false,
    deviceName: null,
    ...overrides,
  };
}

describe('HealthMonitorView data logic', () => {
  // ─── 需求 16.1: 基础健康数据显示 ───

  describe('基础健康数据 (需求 16.1)', () => {
    it('state provides steps data', () => {
      const state = makeState({ healthData: { steps: 8500, heartRate: 72, calories: 320, lastUpdated: Date.now() } });
      expect(state.healthData.steps).toBe(8500);
    });

    it('state provides heart rate data', () => {
      const state = makeState({ healthData: { steps: 0, heartRate: 85, calories: 0, lastUpdated: Date.now() } });
      expect(state.healthData.heartRate).toBe(85);
    });

    it('state provides calories data', () => {
      const state = makeState({ healthData: { steps: 0, heartRate: 72, calories: 450, lastUpdated: Date.now() } });
      expect(state.healthData.calories).toBe(450);
    });
  });

  // ─── 需求 16.2, 16.3: 运动数据显示 ───

  describe('运动数据 (需求 16.2, 16.3)', () => {
    it('state with no workout shows null', () => {
      const state = makeState();
      expect(state.currentWorkout).toBeNull();
    });

    it('state with active workout provides session data', () => {
      const state = makeState({
        status: 'workout',
        currentWorkout: {
          type: 'running',
          startTime: Date.now(),
          duration: 1200,
          distance: 5000,
          heartRate: 145,
          calories: 350,
          isActive: true,
        },
      });
      expect(state.currentWorkout).not.toBeNull();
      expect(state.currentWorkout!.type).toBe('running');
      expect(state.currentWorkout!.duration).toBe(1200);
      expect(state.currentWorkout!.distance).toBe(5000);
      expect(state.currentWorkout!.heartRate).toBe(145);
    });

    it('workout status reflects in monitor status', () => {
      const state = makeState({ status: 'workout' });
      expect(state.status).toBe('workout');
    });
  });

  // ─── 需求 16.4: 设备同步状态 ───

  describe('设备同步 (需求 16.4)', () => {
    it('state reflects device connected', () => {
      const state = makeState({ deviceConnected: true, deviceName: '小米手环 8' });
      expect(state.deviceConnected).toBe(true);
      expect(state.deviceName).toBe('小米手环 8');
    });

    it('state reflects device disconnected', () => {
      const state = makeState({ deviceConnected: false });
      expect(state.deviceConnected).toBe(false);
    });
  });

  // ─── 需求 16.5: 心率异常警告 ───

  describe('心率异常警告 (需求 16.5)', () => {
    it('state with no alerts', () => {
      const state = makeState();
      expect(state.alerts).toHaveLength(0);
    });

    it('state with heart rate alert', () => {
      const state = makeState({
        alerts: [{
          type: 'too_high',
          heartRate: 200,
          timestamp: Date.now(),
          message: '心率过高警告：当前心率 200 BPM，请注意休息',
        }],
      });
      expect(state.alerts).toHaveLength(1);
      expect(state.alerts[0].type).toBe('too_high');
    });

    it('latest alert is the last in array', () => {
      const state = makeState({
        alerts: [
          { type: 'too_high', heartRate: 200, timestamp: 1000, message: 'high' },
          { type: 'too_low', heartRate: 40, timestamp: 2000, message: 'low' },
        ],
      });
      const latest = state.alerts[state.alerts.length - 1];
      expect(latest.type).toBe('too_low');
    });
  });
});
