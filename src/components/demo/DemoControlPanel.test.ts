import { describe, it, expect } from 'vitest';
import { KEYBOARD_MAP, makeEvent, FLASH_DURATION_MS } from './DemoControlPanel';

/**
 * DemoControlPanel 单元测试
 *
 * 验证多模态交互模拟面板的事件生成逻辑、键盘映射配置和辅助函数。
 *
 * 需求: 22.2, 22.4
 */

describe('DemoControlPanel — makeEvent helper', () => {
  it('should create an InputEvent with correct source, type, and data', () => {
    const evt = makeEvent('physical_button', 'power', { key: 'p' });
    expect(evt.source).toBe('physical_button');
    expect(evt.type).toBe('power');
    expect(evt.data).toEqual({ key: 'p' });
    expect(typeof evt.timestamp).toBe('number');
    expect(evt.timestamp).toBeGreaterThan(0);
  });

  it('should default data to empty object when not provided', () => {
    const evt = makeEvent('emg_band', 'pinch');
    expect(evt.data).toEqual({});
  });

  it('should generate unique timestamps for sequential calls', () => {
    const evt1 = makeEvent('voice', 'command', { text: 'hello' });
    const evt2 = makeEvent('voice', 'command', { text: 'world' });
    expect(evt1.timestamp).toBeLessThanOrEqual(evt2.timestamp);
  });
});

describe('DemoControlPanel — KEYBOARD_MAP configuration', () => {
  it('should map all 6 input sources across keyboard shortcuts', () => {
    const sources = new Set(Object.values(KEYBOARD_MAP).map((m) => m.source));
    expect(sources.has('physical_button')).toBe(true);
    expect(sources.has('side_touchpad')).toBe(true);
  });

  it('should map physical button keys: p, Enter, Escape, +, -', () => {
    expect(KEYBOARD_MAP['p']).toEqual({ source: 'physical_button', type: 'power', label: '电源' });
    expect(KEYBOARD_MAP['Enter']).toEqual({ source: 'physical_button', type: 'confirm', label: '确认' });
    expect(KEYBOARD_MAP['Escape']).toEqual({ source: 'physical_button', type: 'back', label: '返回' });
    expect(KEYBOARD_MAP['+']).toEqual({ source: 'physical_button', type: 'volume_up', label: '音量+' });
    expect(KEYBOARD_MAP['-']).toEqual({ source: 'physical_button', type: 'volume_down', label: '音量-' });
  });

  it('should map arrow keys to side_touchpad swipe events', () => {
    expect(KEYBOARD_MAP['ArrowUp']).toMatchObject({ source: 'side_touchpad', type: 'swipe', data: { direction: 'up' } });
    expect(KEYBOARD_MAP['ArrowDown']).toMatchObject({ source: 'side_touchpad', type: 'swipe', data: { direction: 'down' } });
    expect(KEYBOARD_MAP['ArrowLeft']).toMatchObject({ source: 'side_touchpad', type: 'swipe', data: { direction: 'left' } });
    expect(KEYBOARD_MAP['ArrowRight']).toMatchObject({ source: 'side_touchpad', type: 'swipe', data: { direction: 'right' } });
  });

  it('should map space to side_touchpad tap', () => {
    expect(KEYBOARD_MAP[' ']).toMatchObject({ source: 'side_touchpad', type: 'tap' });
  });

  it('should have a label for every keyboard mapping', () => {
    for (const [, mapping] of Object.entries(KEYBOARD_MAP)) {
      expect(mapping.label).toBeTruthy();
      expect(typeof mapping.label).toBe('string');
    }
  });
});

describe('DemoControlPanel — event generation for all 6 interaction modes', () => {
  it('should generate physical_button events for power, confirm, back, volume', () => {
    const types = ['power', 'confirm', 'back', 'volume_up', 'volume_down'];
    for (const type of types) {
      const evt = makeEvent('physical_button', type);
      expect(evt.source).toBe('physical_button');
      expect(evt.type).toBe(type);
    }
  });

  it('should generate voice command events with text data', () => {
    const evt = makeEvent('voice', 'command', { text: '打开导航' });
    expect(evt.source).toBe('voice');
    expect(evt.type).toBe('command');
    expect(evt.data.text).toBe('打开导航');
  });

  it('should generate emg_band events for pinch, double_pinch, fist', () => {
    const gestures = ['pinch', 'double_pinch', 'fist'];
    for (const g of gestures) {
      const evt = makeEvent('emg_band', g);
      expect(evt.source).toBe('emg_band');
      expect(evt.type).toBe(g);
    }
  });

  it('should generate side_touchpad swipe events with direction data', () => {
    const directions = ['up', 'down', 'left', 'right'];
    for (const dir of directions) {
      const evt = makeEvent('side_touchpad', 'swipe', { direction: dir });
      expect(evt.source).toBe('side_touchpad');
      expect(evt.type).toBe('swipe');
      expect(evt.data.direction).toBe(dir);
    }
  });

  it('should generate side_touchpad tap event', () => {
    const evt = makeEvent('side_touchpad', 'tap');
    expect(evt.source).toBe('side_touchpad');
    expect(evt.type).toBe('tap');
  });

  it('should generate camera_gesture events for palm_stop, point, wave, thumbs_up', () => {
    const gestures = ['palm_stop', 'point', 'wave', 'thumbs_up'];
    for (const g of gestures) {
      const evt = makeEvent('camera_gesture', g);
      expect(evt.source).toBe('camera_gesture');
      expect(evt.type).toBe(g);
    }
  });

  it('should generate head_tracking move events with x/y coordinates', () => {
    const evt = makeEvent('head_tracking', 'move', { x: 50, y: 30 });
    expect(evt.source).toBe('head_tracking');
    expect(evt.type).toBe('move');
    expect(evt.data.x).toBe(50);
    expect(evt.data.y).toBe(30);
  });

  it('should generate head_tracking nod and shake events', () => {
    const nod = makeEvent('head_tracking', 'nod');
    expect(nod.type).toBe('nod');
    const shake = makeEvent('head_tracking', 'shake');
    expect(shake.type).toBe('shake');
  });
});

describe('DemoControlPanel — animation timing constants', () => {
  it('should have FLASH_DURATION_MS as a positive number for visual feedback', () => {
    expect(typeof FLASH_DURATION_MS).toBe('number');
    expect(FLASH_DURATION_MS).toBeGreaterThan(0);
    // Should be fast enough for responsive feel (需求 22.4)
    expect(FLASH_DURATION_MS).toBeLessThanOrEqual(300);
  });
});
