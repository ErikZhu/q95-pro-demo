import { describe, it, expect } from 'vitest';
import { KEYBOARD_MAP, makeEvent, FLASH_DURATION_MS } from './DemoControlPanel';
import type { InputSource } from '../../types/interaction';

/**
 * Demo 集成测试
 * 任务 18.4
 *
 * 测试场景切换流程完整性和多模态交互模拟的响应
 * 需求: 22.1, 22.4
 */

const ALL_SOURCES: InputSource[] = [
  'physical_button', 'voice', 'emg_band', 'side_touchpad', 'camera_gesture', 'head_tracking',
];

describe('Demo 场景切换流程 (需求 22.1)', () => {
  const SCENE_KEYS = ['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  it('所有场景切换键都有键盘映射', () => {
    for (const key of SCENE_KEYS) {
      expect(KEYBOARD_MAP[key]).toBeDefined();
    }
  });

  it('Escape 映射到返回操作', () => {
    expect(KEYBOARD_MAP['Escape'].type).toBe('back');
    expect(KEYBOARD_MAP['Escape'].source).toBe('physical_button');
  });

  it('Enter 映射到确认操作', () => {
    expect(KEYBOARD_MAP['Enter'].type).toBe('confirm');
    expect(KEYBOARD_MAP['Enter'].source).toBe('physical_button');
  });

  it('方向键映射到侧边触控滑动', () => {
    expect(KEYBOARD_MAP['ArrowUp'].source).toBe('side_touchpad');
    expect(KEYBOARD_MAP['ArrowUp'].type).toBe('swipe');
    expect(KEYBOARD_MAP['ArrowDown'].source).toBe('side_touchpad');
    expect(KEYBOARD_MAP['ArrowLeft'].source).toBe('side_touchpad');
    expect(KEYBOARD_MAP['ArrowRight'].source).toBe('side_touchpad');
  });

  it('方向键包含正确的方向数据', () => {
    expect(KEYBOARD_MAP['ArrowUp'].data?.direction).toBe('up');
    expect(KEYBOARD_MAP['ArrowDown'].data?.direction).toBe('down');
    expect(KEYBOARD_MAP['ArrowLeft'].data?.direction).toBe('left');
    expect(KEYBOARD_MAP['ArrowRight'].data?.direction).toBe('right');
  });
});

describe('多模态交互模拟响应 (需求 22.4)', () => {
  it('makeEvent 为所有 6 种输入源生成有效事件', () => {
    for (const source of ALL_SOURCES) {
      const evt = makeEvent(source, 'test');
      expect(evt.source).toBe(source);
      expect(evt.type).toBe('test');
      expect(evt.timestamp).toBeGreaterThan(0);
    }
  });

  it('makeEvent 生成的事件包含正确的数据', () => {
    const evt = makeEvent('side_touchpad', 'swipe', { direction: 'up' });
    expect(evt.data).toEqual({ direction: 'up' });
  });

  it('makeEvent 默认 data 为空对象', () => {
    const evt = makeEvent('voice', 'command');
    expect(evt.data).toEqual({});
  });

  it('FLASH_DURATION_MS 在合理范围内 (≤300ms)', () => {
    expect(FLASH_DURATION_MS).toBeGreaterThan(0);
    expect(FLASH_DURATION_MS).toBeLessThanOrEqual(300);
  });

  it('键盘映射覆盖物理按键和侧边触控', () => {
    const sources = new Set(Object.values(KEYBOARD_MAP).map((m) => m.source));
    expect(sources.has('physical_button')).toBe(true);
    expect(sources.has('side_touchpad')).toBe(true);
  });

  it('每个键盘映射都有标签', () => {
    for (const [key, mapping] of Object.entries(KEYBOARD_MAP)) {
      expect(mapping.label, `键 "${key}" 应有标签`).toBeTruthy();
    }
  });

  it('物理按键映射完整 (power, confirm, back, volume)', () => {
    const physicalTypes = Object.values(KEYBOARD_MAP)
      .filter((m) => m.source === 'physical_button')
      .map((m) => m.type);
    expect(physicalTypes).toContain('power');
    expect(physicalTypes).toContain('confirm');
    expect(physicalTypes).toContain('back');
    expect(physicalTypes).toContain('volume_up');
    expect(physicalTypes).toContain('volume_down');
  });

  it('侧边触控映射完整 (4 方向 swipe + tap)', () => {
    const touchTypes = Object.values(KEYBOARD_MAP)
      .filter((m) => m.source === 'side_touchpad')
      .map((m) => m.type);
    expect(touchTypes.filter((t) => t === 'swipe')).toHaveLength(4);
    expect(touchTypes).toContain('tap');
  });
});
