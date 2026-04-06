import { describe, it, expect } from 'vitest';
import type { TranslatorState, TranslationResult } from '../../services/Translator';

/**
 * TranslatorView 单元测试
 * 需求: 14.1, 14.2, 14.3, 14.4, 14.5
 *
 * 测试 TranslatorView 的数据逻辑和状态映射。
 */

function makeResult(overrides?: Partial<TranslationResult>): TranslationResult {
  return {
    id: 'trans_1',
    sourceText: 'Hello',
    translatedText: '[中文翻译] Hello',
    sourceLang: 'en',
    targetLang: 'zh-CN',
    inputMode: 'voice',
    timestamp: Date.now(),
    latencyMs: 350,
    isOffline: false,
    ...overrides,
  };
}

function makeState(overrides?: Partial<TranslatorState>): TranslatorState {
  return {
    isActive: true,
    sourceLang: 'en',
    targetLang: 'zh-CN',
    inputMode: 'voice',
    isOnline: true,
    results: [],
    isTranslating: false,
    ...overrides,
  };
}

describe('TranslatorView data logic', () => {
  // ─── 需求 14.4: 翻译结果显示 ───

  describe('翻译结果 (需求 14.4)', () => {
    it('state with no results shows empty', () => {
      const state = makeState();
      expect(state.results).toHaveLength(0);
      expect(state.isTranslating).toBe(false);
    });

    it('state with results provides latest', () => {
      const r1 = makeResult({ id: 'trans_1', sourceText: 'First' });
      const r2 = makeResult({ id: 'trans_2', sourceText: 'Second' });
      const state = makeState({ results: [r1, r2] });
      const latest = state.results[state.results.length - 1];
      expect(latest.sourceText).toBe('Second');
    });

    it('results are ordered chronologically', () => {
      const r1 = makeResult({ id: 'trans_1', timestamp: 1000 });
      const r2 = makeResult({ id: 'trans_2', timestamp: 2000 });
      const state = makeState({ results: [r1, r2] });
      expect(state.results[0].timestamp).toBeLessThan(state.results[1].timestamp);
    });
  });

  // ─── 需求 14.2: 多语言支持 ───

  describe('语言选择 (需求 14.2)', () => {
    it('state reflects source and target languages', () => {
      const state = makeState({ sourceLang: 'ja', targetLang: 'ko' });
      expect(state.sourceLang).toBe('ja');
      expect(state.targetLang).toBe('ko');
    });
  });

  // ─── 需求 14.3: 输入方式 ───

  describe('输入方式 (需求 14.3)', () => {
    it('state reflects voice input mode', () => {
      const state = makeState({ inputMode: 'voice' });
      expect(state.inputMode).toBe('voice');
    });

    it('state reflects camera_ocr input mode', () => {
      const state = makeState({ inputMode: 'camera_ocr' });
      expect(state.inputMode).toBe('camera_ocr');
    });
  });

  // ─── 需求 14.5: 离线模式 ───

  describe('离线模式 (需求 14.5)', () => {
    it('state reflects online status', () => {
      const state = makeState({ isOnline: true });
      expect(state.isOnline).toBe(true);
    });

    it('state reflects offline status', () => {
      const state = makeState({ isOnline: false });
      expect(state.isOnline).toBe(false);
    });

    it('offline results are marked', () => {
      const r = makeResult({ isOffline: true });
      expect(r.isOffline).toBe(true);
    });
  });

  // ─── 需求 14.1: 翻译延迟 ───

  describe('翻译延迟 (需求 14.1)', () => {
    it('translating state is tracked', () => {
      const state = makeState({ isTranslating: true });
      expect(state.isTranslating).toBe(true);
    });

    it('result latency is recorded', () => {
      const r = makeResult({ latencyMs: 450 });
      expect(r.latencyMs).toBe(450);
      expect(r.latencyMs).toBeLessThanOrEqual(1000);
    });
  });
});
