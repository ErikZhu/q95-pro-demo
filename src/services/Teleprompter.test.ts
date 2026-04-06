import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Teleprompter } from './Teleprompter';

/**
 * Teleprompter 单元测试
 * 需求: 15.1, 15.2, 15.3, 15.4, 15.5
 */

describe('Teleprompter', () => {
  let tp: Teleprompter;

  beforeEach(() => {
    tp = new Teleprompter();
  });

  afterEach(() => {
    tp.dispose();
  });

  // ─── 初始状态 ───

  describe('初始状态', () => {
    it('starts idle with no text', () => {
      expect(tp.getStatus()).toBe('idle');
      expect(tp.hasText()).toBe(false);
      expect(tp.getText()).toBe('');
    });

    it('has default scroll speed', () => {
      expect(tp.getScrollSpeed()).toBe(2);
    });

    it('has default font size', () => {
      expect(tp.getFontSize()).toBe(24);
    });

    it('has default opacity', () => {
      expect(tp.getOpacity()).toBe(0.85);
    });

    it('phone is not connected by default', () => {
      expect(tp.isPhoneConnected()).toBe(false);
    });

    it('accepts constructor options', () => {
      const t = new Teleprompter({ scrollSpeed: 5, fontSize: 32, opacity: 0.7 });
      expect(t.getScrollSpeed()).toBe(5);
      expect(t.getFontSize()).toBe(32);
      expect(t.getOpacity()).toBe(0.7);
      t.dispose();
    });
  });

  // ─── 文本加载 — 需求 15.1 ───

  describe('文本加载 (需求 15.1)', () => {
    it('loads text content', () => {
      tp.loadText('Hello world');
      expect(tp.getText()).toBe('Hello world');
      expect(tp.hasText()).toBe(true);
    });

    it('resets scroll position on load', () => {
      tp.loadText('First text');
      tp.play();
      tp.pause();
      tp.setScrollPosition(100);
      tp.loadText('New text');
      expect(tp.getScrollPosition()).toBe(0);
    });

    it('throws on empty text', () => {
      expect(() => tp.loadText('  ')).toThrow('文本内容不能为空');
    });

    it('resets status to idle on load', () => {
      tp.loadText('Text');
      tp.play();
      tp.loadText('New text');
      expect(tp.getStatus()).toBe('idle');
    });
  });

  // ─── 播放控制 — 需求 15.2, 15.5 ───

  describe('播放控制 (需求 15.2, 15.5)', () => {
    it('plays after loading text', () => {
      tp.loadText('Some text');
      tp.play();
      expect(tp.getStatus()).toBe('playing');
    });

    it('throws when playing without text', () => {
      expect(() => tp.play()).toThrow('请先加载文本');
    });

    it('pauses playback — 需求 15.5', () => {
      tp.loadText('Some text');
      tp.play();
      tp.pause();
      expect(tp.getStatus()).toBe('paused');
    });

    it('pause is no-op when not playing', () => {
      tp.loadText('Some text');
      tp.pause();
      expect(tp.getStatus()).toBe('idle');
    });

    it('stops and resets position', () => {
      tp.loadText('Some text');
      tp.play();
      tp.setScrollPosition(50);
      tp.stop();
      expect(tp.getStatus()).toBe('idle');
      expect(tp.getScrollPosition()).toBe(0);
    });

    it('togglePlayPause toggles between play and pause', () => {
      tp.loadText('Some text');
      tp.togglePlayPause();
      expect(tp.getStatus()).toBe('playing');
      tp.togglePlayPause();
      expect(tp.getStatus()).toBe('paused');
    });

    it('resumes from paused state', () => {
      tp.loadText('Some text');
      tp.play();
      tp.pause();
      tp.play();
      expect(tp.getStatus()).toBe('playing');
    });
  });

  // ─── 滚动速度控制 — 需求 15.2 ───

  describe('滚动速度 (需求 15.2)', () => {
    it('sets scroll speed', () => {
      tp.setScrollSpeed(5);
      expect(tp.getScrollSpeed()).toBe(5);
    });

    it('clamps speed to minimum', () => {
      tp.setScrollSpeed(0.1);
      expect(tp.getScrollSpeed()).toBe(0.5);
    });

    it('clamps speed to maximum', () => {
      tp.setScrollSpeed(20);
      expect(tp.getScrollSpeed()).toBe(10);
    });

    it('increases speed', () => {
      tp.setScrollSpeed(3);
      tp.increaseSpeed(1);
      expect(tp.getScrollSpeed()).toBe(4);
    });

    it('decreases speed', () => {
      tp.setScrollSpeed(3);
      tp.decreaseSpeed(1);
      expect(tp.getScrollSpeed()).toBe(2);
    });

    it('returns speed range', () => {
      const range = tp.getSpeedRange();
      expect(range.min).toBe(0.5);
      expect(range.max).toBe(10);
    });
  });

  // ─── 字体大小 — 需求 15.1 ───

  describe('字体大小 (需求 15.1)', () => {
    it('sets font size', () => {
      tp.setFontSize(36);
      expect(tp.getFontSize()).toBe(36);
    });

    it('clamps to minimum', () => {
      tp.setFontSize(5);
      expect(tp.getFontSize()).toBe(12);
    });

    it('clamps to maximum', () => {
      tp.setFontSize(100);
      expect(tp.getFontSize()).toBe(72);
    });

    it('returns font size range', () => {
      const range = tp.getFontSizeRange();
      expect(range.min).toBe(12);
      expect(range.max).toBe(72);
    });
  });

  // ─── 半透明显示 — 需求 15.3 ───

  describe('透明度 (需求 15.3)', () => {
    it('sets opacity', () => {
      tp.setOpacity(0.5);
      expect(tp.getOpacity()).toBe(0.5);
    });

    it('clamps opacity to 0-1', () => {
      tp.setOpacity(-0.5);
      expect(tp.getOpacity()).toBe(0);
      tp.setOpacity(1.5);
      expect(tp.getOpacity()).toBe(1);
    });
  });

  // ─── 手机导入 — 需求 15.4 ───

  describe('手机导入 (需求 15.4)', () => {
    it('connects phone', () => {
      tp.connectPhone();
      expect(tp.isPhoneConnected()).toBe(true);
    });

    it('disconnects phone', () => {
      tp.connectPhone();
      tp.disconnectPhone();
      expect(tp.isPhoneConnected()).toBe(false);
    });

    it('imports text from phone', () => {
      tp.connectPhone();
      tp.importFromPhone('Imported speech text');
      expect(tp.getText()).toBe('Imported speech text');
    });

    it('throws when importing without phone connection', () => {
      expect(() => tp.importFromPhone('Text')).toThrow('未连接配对手机');
    });

    it('throws when importing empty text', () => {
      tp.connectPhone();
      expect(() => tp.importFromPhone('  ')).toThrow('导入文本不能为空');
    });
  });

  // ─── 滚动位置 ───

  describe('滚动位置', () => {
    it('sets scroll position', () => {
      tp.setScrollPosition(100);
      expect(tp.getScrollPosition()).toBe(100);
    });

    it('clamps position to non-negative', () => {
      tp.setScrollPosition(-10);
      expect(tp.getScrollPosition()).toBe(0);
    });
  });

  // ─── 状态查询 ───

  describe('getState', () => {
    it('returns complete state', () => {
      const state = tp.getState();
      expect(state.status).toBe('idle');
      expect(state.text).toBe('');
      expect(state.scrollPosition).toBe(0);
      expect(state.scrollSpeed).toBe(2);
      expect(state.fontSize).toBe(24);
      expect(state.opacity).toBe(0.85);
      expect(state.phoneConnected).toBe(false);
    });
  });

  // ─── 清理 ───

  describe('dispose', () => {
    it('stops and clears text', () => {
      tp.loadText('Some text');
      tp.play();
      tp.dispose();
      expect(tp.getStatus()).toBe('idle');
      expect(tp.getText()).toBe('');
    });
  });
});
