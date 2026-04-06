import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AIAssistant,
  MAX_ACTIVATION_MS,
  CONFIDENCE_THRESHOLD,
  DEFAULT_IDLE_TIMEOUT_MS,
} from './AIAssistant';
import type { AudioStream } from '../types/ai';

function makeAudioStream(overrides: Partial<AudioStream> = {}): AudioStream {
  return {
    transcript: overrides.transcript ?? '打开音乐',
    durationMs: overrides.durationMs ?? 1500,
  };
}

/**
 * Helper: start an async operation and advance fake timers until it resolves.
 * This is needed because the service uses multiple sequential `setTimeout` calls
 * inside async methods, and we need to flush them iteratively.
 */
async function flushTimers(ms: number = 10000): Promise<void> {
  // Advance in small steps to allow microtask queue to process between timeouts
  const step = 100;
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    vi.advanceTimersByTime(step);
    // Flush microtask queue (resolved promises)
    await new Promise((r) => r(undefined));
  }
}

describe('AIAssistant', () => {
  let assistant: AIAssistant;

  beforeEach(() => {
    vi.useFakeTimers();
    assistant = new AIAssistant();
  });

  afterEach(() => {
    assistant.destroy();
    vi.useRealTimers();
  });

  describe('activate (需求 8.1)', () => {
    it('starts in idle status', () => {
      expect(assistant.getStatus()).toBe('idle');
    });

    it('transitions to listening status after activation', async () => {
      const promise = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await promise;
      expect(assistant.getStatus()).toBe('listening');
    });

    it('fires onStatusChange callback on activation', async () => {
      const onStatusChange = vi.fn();
      assistant.setCallbacks({ onStatusChange });
      const promise = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await promise;
      expect(onStatusChange).toHaveBeenCalledWith('listening');
    });

    it('does nothing if already active', async () => {
      const onStatusChange = vi.fn();
      assistant.setCallbacks({ onStatusChange });

      const p1 = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await p1;

      onStatusChange.mockClear();
      const p2 = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await p2;

      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('transitions back to idle', async () => {
      const promise = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await promise;

      assistant.deactivate();
      expect(assistant.getStatus()).toBe('idle');
    });

    it('fires onDeactivated callback with manual reason', async () => {
      const onDeactivated = vi.fn();
      assistant.setCallbacks({ onDeactivated });

      const promise = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await promise;

      assistant.deactivate();
      expect(onDeactivated).toHaveBeenCalledWith('manual');
    });
  });

  describe('idle timeout (需求 8.7)', () => {
    it('auto-deactivates after 5 seconds of no input', async () => {
      const onDeactivated = vi.fn();
      assistant.setCallbacks({ onDeactivated });

      const promise = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await promise;
      expect(assistant.getStatus()).toBe('listening');

      await flushTimers(DEFAULT_IDLE_TIMEOUT_MS);
      expect(assistant.getStatus()).toBe('idle');
      expect(onDeactivated).toHaveBeenCalledWith('timeout');
    });

    it('respects custom idle timeout', async () => {
      const onDeactivated = vi.fn();
      assistant.setCallbacks({ onDeactivated });
      assistant.setIdleTimeout(2000);

      const promise = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await promise;

      // Not yet timed out
      await flushTimers(1500);
      expect(assistant.getStatus()).toBe('listening');

      // Now it should time out
      await flushTimers(600);
      expect(assistant.getStatus()).toBe('idle');
      expect(onDeactivated).toHaveBeenCalledWith('timeout');
    });

    it('returns the configured idle timeout', () => {
      expect(assistant.getIdleTimeout()).toBe(DEFAULT_IDLE_TIMEOUT_MS);
      assistant.setIdleTimeout(3000);
      expect(assistant.getIdleTimeout()).toBe(3000);
    });
  });

  describe('processVoice (需求 8.2, 8.3)', () => {
    it('returns a response for recognized voice input', async () => {
      const audio = makeAudioStream({ transcript: '打开音乐' });
      const promise = assistant.processVoice(audio);
      await flushTimers(5000);
      const response = await promise;

      expect(response.text).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.intent).toBeDefined();
    });

    it('auto-activates if called while idle', async () => {
      expect(assistant.getStatus()).toBe('idle');
      const audio = makeAudioStream({ transcript: '打开灯' });
      const promise = assistant.processVoice(audio);
      await flushTimers(5000);
      const response = await promise;
      expect(response.intent).toBeDefined();
    });

    it('transitions through thinking → responding → listening states', async () => {
      const statuses: string[] = [];
      assistant.setCallbacks({
        onStatusChange: (s) => statuses.push(s),
      });

      const audio = makeAudioStream({ transcript: '打开空调' });
      const promise = assistant.processVoice(audio);
      await flushTimers(5000);
      await promise;

      expect(statuses).toContain('listening');
      expect(statuses).toContain('thinking');
      expect(statuses).toContain('responding');
      expect(assistant.getStatus()).toBe('listening');
    });
  });

  describe('processText (需求 8.2, 8.3)', () => {
    it('returns a response for recognized text input', async () => {
      const promise = assistant.processText('播放周杰伦的歌');
      await flushTimers(5000);
      const response = await promise;

      expect(response.text).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.intent).toBeDefined();
      expect(response.intent!.target).toBe('phone');
    });

    it('auto-activates if called while idle', async () => {
      const promise = assistant.processText('关闭客厅灯');
      await flushTimers(5000);
      const response = await promise;
      expect(response.intent?.target).toBe('iot');
    });
  });

  describe('Intent routing (需求 8.3, 8.5)', () => {
    const testCases: Array<{ text: string; expectedTarget: string }> = [
      { text: '打开亮度', expectedTarget: 'local' },
      { text: '播放音乐', expectedTarget: 'phone' },
      { text: '关闭客厅灯', expectedTarget: 'iot' },
      { text: '打开车窗', expectedTarget: 'vehicle' },
      { text: '今天走了多少步数', expectedTarget: 'watch' },
      { text: '发微信给张三', expectedTarget: 'third_party' },
    ];

    for (const { text, expectedTarget } of testCases) {
      it(`routes "${text}" to ${expectedTarget}`, async () => {
        const promise = assistant.processText(text);
        await flushTimers(5000);
        const response = await promise;
        expect(response.intent?.target).toBe(expectedTarget);
      });
    }
  });

  describe('low confidence confirmation (需求 8.6)', () => {
    it('requests confirmation for unrecognized input', async () => {
      const promise = assistant.processText('xyzzy gibberish');
      await flushTimers(5000);
      const response = await promise;

      expect(response.needsConfirmation).toBe(true);
      expect(response.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    });

    it('does not request confirmation for clear commands', async () => {
      // "打开亮度" matches 2 keywords in local: 打开 + 亮度
      const promise = assistant.processText('打开亮度');
      await flushTimers(5000);
      const response = await promise;

      expect(response.needsConfirmation).toBe(false);
      expect(response.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
    });
  });

  describe('wake word', () => {
    it('has a default wake word', () => {
      expect(assistant.getWakeWord()).toBe('你好小Q');
    });

    it('allows setting a custom wake word', () => {
      assistant.setWakeWord('小助手');
      expect(assistant.getWakeWord()).toBe('小助手');
    });
  });

  describe('destroy', () => {
    it('cleans up timers and resets to idle', async () => {
      const promise = assistant.activate();
      await flushTimers(MAX_ACTIVATION_MS);
      await promise;

      assistant.destroy();
      expect(assistant.getStatus()).toBe('idle');
    });
  });
});
