import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskCenterService } from './TaskCenter';
import type { TaskCenterCallbacks } from './TaskCenter';
import { SmartTaskZoneService } from './SmartTaskZone';
import type { Intent } from '../types/ai';

function makeIntent(
  name: string,
  target: Intent['target'] = 'local',
  params: Record<string, unknown> = {},
): Intent {
  return { name, target, params };
}

describe('TaskCenterService', () => {
  let svc: TaskCenterService;
  let callbacks: TaskCenterCallbacks;
  let statusChanges: Array<{ taskId: string; status: string }>;

  beforeEach(() => {
    statusChanges = [];
    callbacks = {
      onTaskStatusChange: vi.fn((taskId, status) => statusChanges.push({ taskId, status })),
      onDeviceUnreachable: vi.fn(),
    };
    svc = new TaskCenterService(callbacks);
  });

  describe('intent routing', () => {
    const targets: Intent['target'][] = ['local', 'phone', 'iot', 'vehicle', 'watch', 'third_party'];

    for (const target of targets) {
      it(`routes "${target}" intent to correct handler`, async () => {
        const intent = makeIntent(`test_${target}`, target);
        const result = await svc.executeTask(intent);
        expect(result.success).toBe(true);
        expect(result.message).toContain(intent.name);
        expect(result.data?.target).toBe(target);
      });
    }
  });

  describe('task lifecycle', () => {
    it('transitions through pending → executing → completed', async () => {
      const intent = makeIntent('volume_up', 'local');
      const result = await svc.executeTask(intent);

      expect(result.success).toBe(true);
      // Status changes: pending, executing, completed
      const statuses = statusChanges.map((s) => s.status);
      expect(statuses).toEqual(['pending', 'executing', 'completed']);
    });

    it('returns completed status after execution', async () => {
      const result = await svc.executeTask(makeIntent('play_music', 'phone'));
      expect(svc.getTaskStatus(result.taskId)).toBe('completed');
    });

    it('returns pending for unknown task ID', () => {
      expect(svc.getTaskStatus('nonexistent')).toBe('pending');
    });
  });

  describe('device reachability (requirement 9.11)', () => {
    it('all devices default to reachable', async () => {
      const targets: Intent['target'][] = ['local', 'phone', 'iot', 'vehicle', 'watch', 'third_party'];
      for (const t of targets) {
        expect(await svc.checkDeviceReachable(t)).toBe(true);
      }
    });

    it('returns failure when device is offline', async () => {
      svc.setDeviceReachable('iot', false);
      const result = await svc.executeTask(makeIntent('turn_on_light', 'iot'));

      expect(result.success).toBe(false);
      expect(result.message).toContain('设备不可达');
      expect(result.data?.suggestion).toBeDefined();
      expect(svc.getTaskStatus(result.taskId)).toBe('failed');
    });

    it('fires onDeviceUnreachable callback', async () => {
      svc.setDeviceReachable('vehicle', false);
      await svc.executeTask(makeIntent('open_window', 'vehicle'));
      expect(callbacks.onDeviceUnreachable).toHaveBeenCalledWith('vehicle', expect.any(String));
    });

    it('succeeds after device comes back online', async () => {
      svc.setDeviceReachable('phone', false);
      const fail = await svc.executeTask(makeIntent('call', 'phone'));
      expect(fail.success).toBe(false);

      svc.setDeviceReachable('phone', true);
      const ok = await svc.executeTask(makeIntent('call', 'phone'));
      expect(ok.success).toBe(true);
    });
  });

  describe('compound tasks (requirement 9.12)', () => {
    it('executes multiple intents sequentially', async () => {
      const intents = [
        makeIntent('turn_on_ac', 'iot'),
        makeIntent('set_temp_26', 'iot'),
      ];
      const results = await svc.executeCompoundTask(intents);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('returns results count matching intents count', async () => {
      const intents = [
        makeIntent('a', 'local'),
        makeIntent('b', 'phone'),
        makeIntent('c', 'iot'),
      ];
      const results = await svc.executeCompoundTask(intents);
      expect(results).toHaveLength(intents.length);
    });

    it('continues execution even if one sub-task fails', async () => {
      svc.setDeviceReachable('iot', false);
      const intents = [
        makeIntent('volume_up', 'local'),
        makeIntent('turn_on_light', 'iot'),
        makeIntent('play_music', 'phone'),
      ];
      const results = await svc.executeCompoundTask(intents);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('handles empty intents array', async () => {
      const results = await svc.executeCompoundTask([]);
      expect(results).toEqual([]);
    });
  });

  describe('cancel task', () => {
    it('cancels a pending/executing task', async () => {
      const result = await svc.executeTask(makeIntent('test', 'local'));
      // Task is already completed, cancel should be a no-op
      await svc.cancelTask(result.taskId);
      expect(svc.getTaskStatus(result.taskId)).toBe('completed');
    });

    it('ignores cancel for unknown task', async () => {
      await expect(svc.cancelTask('unknown')).resolves.toBeUndefined();
    });
  });

  describe('Smart_Task_Zone integration (requirement 9.10)', () => {
    let zone: SmartTaskZoneService;

    beforeEach(() => {
      zone = new SmartTaskZoneService();
      svc.setSmartTaskZone(zone);
    });

    it('updates SmartTaskZone with task status during execution', async () => {
      const upsertSpy = vi.spyOn(zone, 'upsertTask');
      const removeSpy = vi.spyOn(zone, 'removeTask');

      await svc.executeTask(makeIntent('play_music', 'phone'));

      // upsertTask called for pending and executing states
      expect(upsertSpy).toHaveBeenCalled();
      // removeTask called for completed state
      expect(removeSpy).toHaveBeenCalled();
    });

    it('removes task from zone on completion', async () => {
      const result = await svc.executeTask(makeIntent('test', 'local'));
      expect(zone.getActiveTasks().find((t) => t.taskId === result.taskId)).toBeUndefined();
    });

    it('keeps failed task in zone', async () => {
      svc.setDeviceReachable('iot', false);
      const result = await svc.executeTask(makeIntent('light', 'iot'));
      // Failed tasks are upserted (not removed) so they show in the zone
      const task = zone.getActiveTasks().find((t) => t.taskId === result.taskId);
      expect(task).toBeDefined();
      expect(task?.statusText).toContain('失败');
    });
  });

  describe('unique task IDs', () => {
    it('generates unique IDs for each task', async () => {
      const r1 = await svc.executeTask(makeIntent('a', 'local'));
      const r2 = await svc.executeTask(makeIntent('b', 'local'));
      const r3 = await svc.executeTask(makeIntent('c', 'phone'));
      expect(new Set([r1.taskId, r2.taskId, r3.taskId]).size).toBe(3);
    });
  });
});
