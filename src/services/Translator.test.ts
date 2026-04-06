import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Translator, SUPPORTED_LANGUAGES } from './Translator';

/**
 * Translator 单元测试
 * 需求: 14.1, 14.2, 14.3, 14.4, 14.5
 */

describe('Translator', () => {
  let translator: Translator;

  beforeEach(() => {
    translator = new Translator();
  });

  afterEach(() => {
    translator.dispose();
  });

  // ─── 初始状态 ───

  describe('初始状态', () => {
    it('starts inactive', () => {
      expect(translator.isActive()).toBe(false);
    });

    it('defaults to en → zh-CN', () => {
      expect(translator.getSourceLanguage()).toBe('en');
      expect(translator.getTargetLanguage()).toBe('zh-CN');
    });

    it('defaults to voice input mode', () => {
      expect(translator.getInputMode()).toBe('voice');
    });

    it('defaults to online', () => {
      expect(translator.isOnline()).toBe(true);
    });

    it('has no results initially', () => {
      expect(translator.getResults()).toHaveLength(0);
      expect(translator.getLatestResult()).toBeNull();
    });

    it('accepts constructor options', () => {
      const t = new Translator({
        sourceLang: 'ja',
        targetLang: 'ko',
        inputMode: 'camera_ocr',
      });
      expect(t.getSourceLanguage()).toBe('ja');
      expect(t.getTargetLanguage()).toBe('ko');
      expect(t.getInputMode()).toBe('camera_ocr');
      t.dispose();
    });
  });

  // ─── 翻译模式控制 ───

  describe('activate/deactivate', () => {
    it('activates translator', () => {
      translator.activate();
      expect(translator.isActive()).toBe(true);
    });

    it('deactivates translator', () => {
      translator.activate();
      translator.deactivate();
      expect(translator.isActive()).toBe(false);
    });
  });

  // ─── 翻译处理 — 需求 14.1 ───

  describe('translate (需求 14.1)', () => {
    it('translates text within 1 second', async () => {
      translator.activate();
      const result = await translator.translate('Hello world');
      expect(result.latencyMs).toBeLessThanOrEqual(1000);
      expect(result.translatedText).toContain('Hello world');
    });

    it('returns correct source and target languages', async () => {
      translator.activate();
      const result = await translator.translate('Hello');
      expect(result.sourceLang).toBe('en');
      expect(result.targetLang).toBe('zh-CN');
    });

    it('records input mode', async () => {
      translator.activate();
      const result = await translator.translate('Hello', 'camera_ocr');
      expect(result.inputMode).toBe('camera_ocr');
    });

    it('throws when not active', async () => {
      await expect(translator.translate('Hello')).rejects.toThrow('翻译模式未激活');
    });

    it('throws on empty text', async () => {
      translator.activate();
      await expect(translator.translate('  ')).rejects.toThrow('输入文本不能为空');
    });

    it('stores results in history', async () => {
      translator.activate();
      await translator.translate('Hello');
      await translator.translate('World');
      expect(translator.getResults()).toHaveLength(2);
    });

    it('getLatestResult returns last translation', async () => {
      translator.activate();
      await translator.translate('First');
      await translator.translate('Second');
      const latest = translator.getLatestResult();
      expect(latest?.sourceText).toBe('Second');
    });
  });

  // ─── 多语言支持 — 需求 14.2 ───

  describe('语言支持 (需求 14.2)', () => {
    it('supports at least 10 languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    });

    it('sets source language', () => {
      translator.setSourceLanguage('ja');
      expect(translator.getSourceLanguage()).toBe('ja');
    });

    it('sets target language', () => {
      translator.setTargetLanguage('fr');
      expect(translator.getTargetLanguage()).toBe('fr');
    });

    it('swaps languages', () => {
      translator.setSourceLanguage('en');
      translator.setTargetLanguage('ja');
      translator.swapLanguages();
      expect(translator.getSourceLanguage()).toBe('ja');
      expect(translator.getTargetLanguage()).toBe('en');
    });

    it('getSupportedLanguages returns a copy', () => {
      const langs = translator.getSupportedLanguages();
      langs.length = 0;
      expect(translator.getSupportedLanguages().length).toBeGreaterThanOrEqual(10);
    });

    it('translates to different target languages', async () => {
      translator.activate();
      translator.setTargetLanguage('ja');
      const result = await translator.translate('Hello');
      expect(result.translatedText).toContain('日本語');
      expect(result.targetLang).toBe('ja');
    });
  });

  // ─── 输入方式 — 需求 14.3 ───

  describe('输入方式 (需求 14.3)', () => {
    it('switches to camera_ocr mode', () => {
      translator.setInputMode('camera_ocr');
      expect(translator.getInputMode()).toBe('camera_ocr');
    });

    it('switches to voice mode', () => {
      translator.setInputMode('camera_ocr');
      translator.setInputMode('voice');
      expect(translator.getInputMode()).toBe('voice');
    });

    it('uses default input mode when translating', async () => {
      translator.activate();
      translator.setInputMode('camera_ocr');
      const result = await translator.translate('Some text');
      expect(result.inputMode).toBe('camera_ocr');
    });
  });

  // ─── 离线模式 — 需求 14.5 ───

  describe('离线模式 (需求 14.5)', () => {
    it('switches to offline mode', () => {
      translator.setOnlineStatus(false);
      expect(translator.isOnline()).toBe(false);
    });

    it('translates in offline mode within 1 second', async () => {
      translator.activate();
      translator.setOnlineStatus(false);
      const result = await translator.translate('Hello');
      expect(result.latencyMs).toBeLessThanOrEqual(1000);
      expect(result.isOffline).toBe(true);
    });

    it('marks online translations as not offline', async () => {
      translator.activate();
      const result = await translator.translate('Hello');
      expect(result.isOffline).toBe(false);
    });
  });

  // ─── 状态查询 ───

  describe('getState', () => {
    it('returns complete state', () => {
      const state = translator.getState();
      expect(state.isActive).toBe(false);
      expect(state.sourceLang).toBe('en');
      expect(state.targetLang).toBe('zh-CN');
      expect(state.inputMode).toBe('voice');
      expect(state.isOnline).toBe(true);
      expect(state.results).toHaveLength(0);
      expect(state.isTranslating).toBe(false);
    });
  });

  // ─── 清理 ───

  describe('clearResults', () => {
    it('clears translation history', async () => {
      translator.activate();
      await translator.translate('Hello');
      translator.clearResults();
      expect(translator.getResults()).toHaveLength(0);
    });
  });

  describe('dispose', () => {
    it('deactivates and clears results', async () => {
      translator.activate();
      await translator.translate('Hello');
      translator.dispose();
      expect(translator.isActive()).toBe(false);
      expect(translator.getResults()).toHaveLength(0);
    });
  });
});
