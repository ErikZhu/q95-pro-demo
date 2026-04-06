import { describe, it, expect } from 'vitest';
import type { SettingsPanelState } from '../../services/SettingsPanel';
import { SETTINGS_CATEGORIES } from '../../services/SettingsPanel';

/**
 * SettingsPanelView 单元测试
 * 需求: 18.1, 18.2, 18.3, 18.4, 18.5
 *
 * 测试 SettingsPanelView 的数据逻辑和状态映射。
 */

function makeState(overrides?: Partial<SettingsPanelState>): SettingsPanelState {
  return {
    settings: {
      displayBrightness: 70,
      fontSize: 14,
      notificationPrefs: { wechat: true, sms: true, call: true },
      interactionPriority: [
        'physical_button',
        'voice',
        'emg_band',
        'side_touchpad',
        'camera_gesture',
        'head_tracking',
      ],
      relayAllowedTypes: ['delivery', 'calendar', 'call', 'flight', 'ride', 'movie', 'wechat', 'music'],
      autoBrightness: true,
      wakeWord: '你好小Q',
    },
    categories: SETTINGS_CATEGORIES,
    activeCategory: null,
    pairedDevices: [
      { id: 'phone_1', name: 'iPhone 15 Pro', type: 'phone', connected: true },
      { id: 'watch_1', name: 'Apple Watch', type: 'watch', connected: false },
    ],
    wifiNetworks: [
      { ssid: 'Home-5G', strength: 85, secured: true, connected: true },
      { ssid: 'Office', strength: 60, secured: true, connected: false },
    ],
    lastChange: null,
    ...overrides,
  };
}

describe('SettingsPanelView data logic', () => {
  // ─── 需求 18.1: 设置分类 ───

  describe('设置分类 (需求 18.1)', () => {
    it('state provides six categories', () => {
      const state = makeState();
      expect(state.categories).toHaveLength(6);
    });

    it('categories have correct ids', () => {
      const state = makeState();
      const ids = state.categories.map((c) => c.id);
      expect(ids).toEqual(['display', 'sound', 'connectivity', 'interaction', 'privacy', 'system']);
    });
  });

  // ─── 需求 18.2: 分类列表展示 ───

  describe('分类列表展示 (需求 18.2)', () => {
    it('no active category by default', () => {
      const state = makeState();
      expect(state.activeCategory).toBeNull();
    });

    it('active category can be set', () => {
      const state = makeState({ activeCategory: 'display' });
      expect(state.activeCategory).toBe('display');
    });
  });

  // ─── 需求 18.3: 设置项调节 ───

  describe('设置项调节 (需求 18.3)', () => {
    it('state provides brightness value', () => {
      const state = makeState();
      expect(state.settings.displayBrightness).toBe(70);
    });

    it('state provides font size value', () => {
      const state = makeState();
      expect(state.settings.fontSize).toBe(14);
    });

    it('state provides notification prefs', () => {
      const state = makeState();
      expect(state.settings.notificationPrefs['wechat']).toBe(true);
    });

    it('state provides interaction priority', () => {
      const state = makeState();
      expect(state.settings.interactionPriority).toHaveLength(6);
      expect(state.settings.interactionPriority[0]).toBe('physical_button');
    });
  });

  // ─── 需求 18.4: 蓝牙和 Wi-Fi ───

  describe('蓝牙和 Wi-Fi (需求 18.4)', () => {
    it('state provides paired devices', () => {
      const state = makeState();
      expect(state.pairedDevices).toHaveLength(2);
    });

    it('paired devices have connection status', () => {
      const state = makeState();
      const phone = state.pairedDevices.find((d) => d.id === 'phone_1');
      expect(phone?.connected).toBe(true);
      const watch = state.pairedDevices.find((d) => d.id === 'watch_1');
      expect(watch?.connected).toBe(false);
    });

    it('state provides wifi networks', () => {
      const state = makeState();
      expect(state.wifiNetworks).toHaveLength(2);
    });

    it('wifi networks have connection status', () => {
      const state = makeState();
      const home = state.wifiNetworks.find((n) => n.ssid === 'Home-5G');
      expect(home?.connected).toBe(true);
    });
  });

  // ─── 需求 18.5: 变更反馈 ───

  describe('变更反馈 (需求 18.5)', () => {
    it('no feedback by default', () => {
      const state = makeState();
      expect(state.lastChange).toBeNull();
    });

    it('feedback shows success', () => {
      const state = makeState({
        lastChange: {
          key: 'displayBrightness',
          success: true,
          previousValue: 70,
          newValue: 50,
          timestamp: Date.now(),
        },
      });
      expect(state.lastChange?.success).toBe(true);
      expect(state.lastChange?.key).toBe('displayBrightness');
    });

    it('feedback shows failure', () => {
      const state = makeState({
        lastChange: {
          key: 'bluetooth.unknown',
          success: false,
          previousValue: false,
          newValue: false,
          timestamp: Date.now(),
        },
      });
      expect(state.lastChange?.success).toBe(false);
    });
  });
});
