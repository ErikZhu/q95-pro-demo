import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingsPanel, SETTINGS_CATEGORIES } from './SettingsPanel';

/**
 * SettingsPanel 单元测试
 * 需求: 18.1, 18.2, 18.3, 18.4, 18.5
 */

describe('SettingsPanel', () => {
  let sp: SettingsPanel;

  beforeEach(() => {
    sp = new SettingsPanel();
  });

  afterEach(() => {
    sp.dispose();
  });

  // ─── 需求 18.1: 设置分类 ───

  describe('设置分类 (需求 18.1)', () => {
    it('provides six setting categories', () => {
      const cats = sp.getCategories();
      expect(cats).toHaveLength(6);
    });

    it('categories include display, sound, connectivity, interaction, privacy, system', () => {
      const ids = sp.getCategories().map((c) => c.id);
      expect(ids).toContain('display');
      expect(ids).toContain('sound');
      expect(ids).toContain('connectivity');
      expect(ids).toContain('interaction');
      expect(ids).toContain('privacy');
      expect(ids).toContain('system');
    });

    it('each category has label and icon', () => {
      for (const cat of sp.getCategories()) {
        expect(cat.label).toBeTruthy();
        expect(cat.icon).toBeTruthy();
      }
    });

    it('SETTINGS_CATEGORIES constant matches getCategories', () => {
      expect(sp.getCategories()).toEqual(SETTINGS_CATEGORIES);
    });
  });

  // ─── 需求 18.2: 分类列表展示 ───

  describe('分类选择 (需求 18.2)', () => {
    it('starts with no active category', () => {
      expect(sp.getActiveCategory()).toBeNull();
    });

    it('selects a category', () => {
      sp.selectCategory('display');
      expect(sp.getActiveCategory()).toBe('display');
    });

    it('switches between categories', () => {
      sp.selectCategory('display');
      sp.selectCategory('sound');
      expect(sp.getActiveCategory()).toBe('sound');
    });
  });

  // ─── 需求 18.3: 显示亮度、字体大小、通知偏好、交互优先级 ───

  describe('显示设置 (需求 18.3)', () => {
    it('sets brightness within 0-100', () => {
      const result = sp.setBrightness(50);
      expect(result.success).toBe(true);
      expect(sp.getSettings().displayBrightness).toBe(50);
    });

    it('clamps brightness to 0-100', () => {
      sp.setBrightness(150);
      expect(sp.getSettings().displayBrightness).toBe(100);
      sp.setBrightness(-10);
      expect(sp.getSettings().displayBrightness).toBe(0);
    });

    it('sets font size within 10-24', () => {
      const result = sp.setFontSize(18);
      expect(result.success).toBe(true);
      expect(sp.getSettings().fontSize).toBe(18);
    });

    it('clamps font size to 10-24', () => {
      sp.setFontSize(30);
      expect(sp.getSettings().fontSize).toBe(24);
      sp.setFontSize(5);
      expect(sp.getSettings().fontSize).toBe(10);
    });

    it('toggles auto brightness', () => {
      sp.setAutoBrightness(false);
      expect(sp.getSettings().autoBrightness).toBe(false);
      sp.setAutoBrightness(true);
      expect(sp.getSettings().autoBrightness).toBe(true);
    });
  });

  describe('通知偏好 (需求 18.3)', () => {
    it('sets notification preference for an app', () => {
      const result = sp.setNotificationPref('wechat', false);
      expect(result.success).toBe(true);
      expect(sp.getSettings().notificationPrefs['wechat']).toBe(false);
    });
  });

  describe('交互优先级 (需求 18.3)', () => {
    it('sets interaction priority order', () => {
      const newOrder: typeof sp extends SettingsPanel ? Parameters<typeof sp.setInteractionPriority>[0] : never = [
        'voice',
        'physical_button',
        'emg_band',
        'side_touchpad',
        'camera_gesture',
        'head_tracking',
      ];
      const result = sp.setInteractionPriority(newOrder);
      expect(result.success).toBe(true);
      expect(sp.getSettings().interactionPriority[0]).toBe('voice');
    });
  });

  // ─── 需求 18.4: 蓝牙配对设备和 Wi-Fi 连接 ───

  describe('蓝牙设备管理 (需求 18.4)', () => {
    it('lists paired devices', () => {
      const devices = sp.getPairedDevices();
      expect(devices.length).toBeGreaterThan(0);
    });

    it('connects a device', () => {
      const devices = sp.getPairedDevices();
      const disconnected = devices.find((d) => !d.connected);
      if (disconnected) {
        const result = sp.connectDevice(disconnected.id);
        expect(result.success).toBe(true);
        const updated = sp.getPairedDevices().find((d) => d.id === disconnected.id);
        expect(updated?.connected).toBe(true);
      }
    });

    it('disconnects a device', () => {
      const devices = sp.getPairedDevices();
      const connected = devices.find((d) => d.connected);
      if (connected) {
        const result = sp.disconnectDevice(connected.id);
        expect(result.success).toBe(true);
        const updated = sp.getPairedDevices().find((d) => d.id === connected.id);
        expect(updated?.connected).toBe(false);
      }
    });

    it('returns failure for unknown device', () => {
      const result = sp.connectDevice('nonexistent');
      expect(result.success).toBe(false);
    });
  });

  describe('Wi-Fi 管理 (需求 18.4)', () => {
    it('lists wifi networks', () => {
      const networks = sp.getWifiNetworks();
      expect(networks.length).toBeGreaterThan(0);
    });

    it('connects to a wifi network', () => {
      const networks = sp.getWifiNetworks();
      const target = networks.find((n) => !n.connected);
      if (target) {
        const result = sp.connectWifi(target.ssid);
        expect(result.success).toBe(true);
        const updated = sp.getWifiNetworks().find((n) => n.ssid === target.ssid);
        expect(updated?.connected).toBe(true);
      }
    });

    it('connecting to new wifi disconnects current', () => {
      const networks = sp.getWifiNetworks();
      const current = networks.find((n) => n.connected);
      const other = networks.find((n) => !n.connected);
      if (current && other) {
        sp.connectWifi(other.ssid);
        const updatedCurrent = sp.getWifiNetworks().find((n) => n.ssid === current.ssid);
        expect(updatedCurrent?.connected).toBe(false);
      }
    });

    it('disconnects wifi', () => {
      const result = sp.disconnectWifi();
      expect(result.success).toBe(true);
      const connected = sp.getWifiNetworks().find((n) => n.connected);
      expect(connected).toBeUndefined();
    });

    it('returns failure for unknown wifi', () => {
      const result = sp.connectWifi('nonexistent');
      expect(result.success).toBe(false);
    });
  });

  // ─── 需求 18.5: 即时应用更改和视觉反馈 ───

  describe('即时应用更改反馈 (需求 18.5)', () => {
    it('starts with no last change', () => {
      expect(sp.getLastChange()).toBeNull();
    });

    it('records last change after setting modification', () => {
      sp.setBrightness(80);
      const change = sp.getLastChange();
      expect(change).not.toBeNull();
      expect(change!.key).toBe('displayBrightness');
      expect(change!.success).toBe(true);
      expect(change!.newValue).toBe(80);
      expect(change!.timestamp).toBeGreaterThan(0);
    });

    it('change result includes previous value', () => {
      const initial = sp.getSettings().displayBrightness;
      sp.setBrightness(30);
      const change = sp.getLastChange();
      expect(change!.previousValue).toBe(initial);
    });

    it('each modification updates last change', () => {
      sp.setBrightness(50);
      sp.setFontSize(20);
      const change = sp.getLastChange();
      expect(change!.key).toBe('fontSize');
    });
  });

  // ─── 完整状态 ───

  describe('getState', () => {
    it('returns complete panel state', () => {
      const state = sp.getState();
      expect(state.settings).toBeDefined();
      expect(state.categories).toHaveLength(6);
      expect(state.activeCategory).toBeNull();
      expect(state.pairedDevices.length).toBeGreaterThan(0);
      expect(state.wifiNetworks.length).toBeGreaterThan(0);
      expect(state.lastChange).toBeNull();
    });
  });

  // ─── 重置 ───

  describe('resetToDefaults', () => {
    it('resets all settings to defaults', () => {
      sp.setBrightness(10);
      sp.setFontSize(24);
      sp.resetToDefaults();
      expect(sp.getSettings().displayBrightness).toBe(70);
      expect(sp.getSettings().fontSize).toBe(14);
    });
  });

  // ─── 其他 ───

  describe('其他设置', () => {
    it('sets wake word', () => {
      const result = sp.setWakeWord('Hey Q');
      expect(result.success).toBe(true);
      expect(sp.getSettings().wakeWord).toBe('Hey Q');
    });

    it('sets relay allowed types', () => {
      const result = sp.setRelayAllowedTypes(['delivery', 'calendar']);
      expect(result.success).toBe(true);
      expect(sp.getSettings().relayAllowedTypes).toEqual(['delivery', 'calendar']);
    });

    it('accepts custom initial settings', () => {
      const custom = new SettingsPanel({ displayBrightness: 50, fontSize: 20 });
      expect(custom.getSettings().displayBrightness).toBe(50);
      expect(custom.getSettings().fontSize).toBe(20);
      custom.dispose();
    });
  });
});
