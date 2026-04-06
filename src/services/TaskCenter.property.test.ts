import { describe, it, expect, beforeEach } from 'vitest';
import { TaskCenterService } from './TaskCenter';
import type { Intent } from '../types/ai';

/**
 * 任务中心属性测试
 * 任务 11.4
 *
 * 属性 11: 复合任务拆解完整性 — 复合指令拆解后的子任务数量与原始指令中的动作数量一致
 * 属性 12: 设备不可达处理 — 目标设备离线时始终返回失败结果和替代建议
 */

function makeIntent(name: string, target: Intent['target'] = 'local'): Intent {
  return { name, target, params: {} };
}

describe('TaskCenter 属性测试', () => {
  let svc: TaskCenterService;

  beforeEach(() => {
    svc = new TaskCenterService();
  });

  // ── 属性 11: 复合任务拆解完整性 (需求 9.12) ──
  describe('属性 11: 复合任务拆解完整性', () => {
    it('单个 intent 返回 1 个结果', async () => {
      const results = await svc.executeCompoundTask([makeIntent('a', 'local')]);
      expect(results).toHaveLength(1);
    });

    it('N 个 intent 返回 N 个结果', async () => {
      for (const n of [2, 3, 5, 10]) {
        const intents = Array.from({ length: n }, (_, i) => makeIntent(`task_${i}`, 'local'));
        const results = await svc.executeCompoundTask(intents);
        expect(results).toHaveLength(n);
      }
    });

    it('混合目标的复合任务结果数量一致', async () => {
      const targets: Intent['target'][] = ['local', 'phone', 'iot', 'vehicle', 'watch', 'third_party'];
      const intents = targets.map((t, i) => makeIntent(`task_${i}`, t));
      const results = await svc.executeCompoundTask(intents);
      expect(results).toHaveLength(targets.length);
    });

    it('空 intent 数组返回空结果', async () => {
      const results = await svc.executeCompoundTask([]);
      expect(results).toEqual([]);
    });

    it('每个结果都有唯一的 taskId', async () => {
      const intents = Array.from({ length: 5 }, (_, i) => makeIntent(`t${i}`, 'local'));
      const results = await svc.executeCompoundTask(intents);
      const ids = results.map((r) => r.taskId);
      expect(new Set(ids).size).toBe(5);
    });

    it('部分失败不影响结果数量', async () => {
      svc.setDeviceReachable('iot', false);
      const intents = [
        makeIntent('a', 'local'),
        makeIntent('b', 'iot'),
        makeIntent('c', 'phone'),
      ];
      const results = await svc.executeCompoundTask(intents);
      expect(results).toHaveLength(3);
    });
  });

  // ── 属性 12: 设备不可达处理 (需求 9.11) ──
  describe('属性 12: 设备不可达处理', () => {
    const targets: Intent['target'][] = ['phone', 'iot', 'vehicle', 'watch', 'third_party'];

    for (const target of targets) {
      it(`${target} 离线时返回失败和替代建议`, async () => {
        svc.setDeviceReachable(target, false);
        const result = await svc.executeTask(makeIntent(`test_${target}`, target));
        expect(result.success).toBe(false);
        expect(result.message).toContain('设备不可达');
        expect(result.data?.suggestion).toBeDefined();
      });
    }

    it('local 设备始终可达', async () => {
      // local 不应该被设为不可达（它是本地设备）
      const result = await svc.executeTask(makeIntent('test', 'local'));
      expect(result.success).toBe(true);
    });

    it('设备恢复在线后任务成功', async () => {
      svc.setDeviceReachable('iot', false);
      const fail = await svc.executeTask(makeIntent('light', 'iot'));
      expect(fail.success).toBe(false);

      svc.setDeviceReachable('iot', true);
      const ok = await svc.executeTask(makeIntent('light', 'iot'));
      expect(ok.success).toBe(true);
    });

    it('失败任务状态为 failed', async () => {
      svc.setDeviceReachable('vehicle', false);
      const result = await svc.executeTask(makeIntent('open', 'vehicle'));
      expect(svc.getTaskStatus(result.taskId)).toBe('failed');
    });

    it('复合任务中不可达设备的子任务失败，其他继续', async () => {
      svc.setDeviceReachable('iot', false);
      svc.setDeviceReachable('vehicle', false);
      const intents = [
        makeIntent('a', 'local'),
        makeIntent('b', 'iot'),
        makeIntent('c', 'phone'),
        makeIntent('d', 'vehicle'),
      ];
      const results = await svc.executeCompoundTask(intents);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(results[3].success).toBe(false);
    });
  });
});
