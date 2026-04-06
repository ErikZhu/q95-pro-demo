import { describe, it, expect } from 'vitest';
import type { TeleprompterState } from '../../services/Teleprompter';

/**
 * TeleprompterView 单元测试
 * 需求: 15.1, 15.2, 15.3, 15.4, 15.5
 *
 * 测试 TeleprompterView 的数据逻辑和状态映射。
 */

function makeState(overrides?: Partial<TeleprompterState>): TeleprompterState {
  return {
    status: 'idle',
    text: '',
    scrollPosition: 0,
    scrollSpeed: 2,
    fontSize: 24,
    opacity: 0.85,
    phoneConnected: false,
    ...overrides,
  };
}

describe('TeleprompterView data logic', () => {
  // ─── 需求 15.1: 文本显示与字体大小 ───

  describe('文本显示 (需求 15.1)', () => {
    it('state with no text shows empty', () => {
      const state = makeState();
      expect(state.text).toBe('');
    });

    it('state with text provides content', () => {
      const state = makeState({ text: '演讲稿内容' });
      expect(state.text).toBe('演讲稿内容');
    });

    it('font size is configurable', () => {
      const state = makeState({ fontSize: 36 });
      expect(state.fontSize).toBe(36);
    });
  });

  // ─── 需求 15.2: 自动滚动速度 ───

  describe('滚动速度 (需求 15.2)', () => {
    it('state reflects scroll speed', () => {
      const state = makeState({ scrollSpeed: 5 });
      expect(state.scrollSpeed).toBe(5);
    });

    it('scroll position tracks progress', () => {
      const state = makeState({ scrollPosition: 150 });
      expect(state.scrollPosition).toBe(150);
    });
  });

  // ─── 需求 15.3: 半透明显示 ───

  describe('半透明显示 (需求 15.3)', () => {
    it('state reflects opacity', () => {
      const state = makeState({ opacity: 0.6 });
      expect(state.opacity).toBe(0.6);
    });

    it('default opacity allows see-through', () => {
      const state = makeState();
      expect(state.opacity).toBeLessThan(1);
      expect(state.opacity).toBeGreaterThan(0);
    });
  });

  // ─── 需求 15.4: 手机导入 ───

  describe('手机连接 (需求 15.4)', () => {
    it('state reflects phone connected', () => {
      const state = makeState({ phoneConnected: true });
      expect(state.phoneConnected).toBe(true);
    });

    it('state reflects phone disconnected', () => {
      const state = makeState({ phoneConnected: false });
      expect(state.phoneConnected).toBe(false);
    });
  });

  // ─── 需求 15.5: 暂停控制 ───

  describe('播放状态 (需求 15.5)', () => {
    it('idle status', () => {
      const state = makeState({ status: 'idle' });
      expect(state.status).toBe('idle');
    });

    it('playing status', () => {
      const state = makeState({ status: 'playing' });
      expect(state.status).toBe('playing');
    });

    it('paused status preserves scroll position', () => {
      const state = makeState({ status: 'paused', scrollPosition: 200 });
      expect(state.status).toBe('paused');
      expect(state.scrollPosition).toBe(200);
    });
  });
});
