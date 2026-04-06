/**
 * SettingsPanel — 系统设置面板服务
 *
 * 设置分类管理（显示、声音、连接、交互、隐私、系统）、
 * 设置项读取与修改、即时应用更改、视觉反馈确认、
 * 蓝牙配对设备和 Wi-Fi 连接管理。
 * Demo 中使用模拟数据。
 *
 * 需求: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import type { UserSettings } from '../types/settings';
import type { InputSource } from '../types/interaction';
import type { RelayInfoType } from '../types/data';

/** 设置分类 — 需求 18.1 */
export type SettingsCategory =
  | 'display'
  | 'sound'
  | 'connectivity'
  | 'interaction'
  | 'privacy'
  | 'system';

/** 分类元数据 */
export interface CategoryInfo {
  id: SettingsCategory;
  label: string;
  icon: string;
}

/** 蓝牙配对设备 — 需求 18.4 */
export interface PairedDevice {
  id: string;
  name: string;
  type: 'phone' | 'watch' | 'earbuds' | 'other';
  connected: boolean;
}

/** Wi-Fi 网络 — 需求 18.4 */
export interface WifiNetwork {
  ssid: string;
  strength: number; // 0-100
  secured: boolean;
  connected: boolean;
}

/** 设置变更反馈 — 需求 18.5 */
export interface SettingsChangeResult {
  key: string;
  success: boolean;
  previousValue: unknown;
  newValue: unknown;
  timestamp: number;
}

/** 所有分类列表 — 需求 18.1 */
export const SETTINGS_CATEGORIES: CategoryInfo[] = [
  { id: 'display', label: '显示', icon: 'brightness' },
  { id: 'sound', label: '声音', icon: 'speaker' },
  { id: 'connectivity', label: '连接', icon: 'signal' },
  { id: 'interaction', label: '交互', icon: 'touch' },
  { id: 'privacy', label: '隐私', icon: 'lock' },
  { id: 'system', label: '系统', icon: 'gear' },
];

/** 默认设置 */
const DEFAULT_SETTINGS: UserSettings = {
  displayBrightness: 70,
  fontSize: 14,
  notificationPrefs: {
    wechat: true,
    sms: true,
    call: true,
    email: true,
    system: true,
  },
  interactionPriority: [
    'physical_button',
    'voice',
    'emg_band',
    'side_touchpad',
    'camera_gesture',
    'head_tracking',
  ],
  relayAllowedTypes: [
    'delivery',
    'calendar',
    'call',
    'flight',
    'ride',
    'movie',
    'wechat',
    'music',
  ],
  autoBrightness: true,
  wakeWord: '你好小Q',
};

export interface SettingsPanelState {
  settings: UserSettings;
  categories: CategoryInfo[];
  activeCategory: SettingsCategory | null;
  pairedDevices: PairedDevice[];
  wifiNetworks: WifiNetwork[];
  lastChange: SettingsChangeResult | null;
}

export class SettingsPanel {
  private settings: UserSettings;
  private activeCategory: SettingsCategory | null = null;
  private pairedDevices: PairedDevice[] = [];
  private wifiNetworks: WifiNetwork[] = [];
  private lastChange: SettingsChangeResult | null = null;

  constructor(initial?: Partial<UserSettings>) {
    this.settings = { ...DEFAULT_SETTINGS, ...initial };
    this.initSimulatedDevices();
  }

  // ─── 分类列表 — 需求 18.1, 18.2 ───

  /** 获取所有设置分类 */
  getCategories(): CategoryInfo[] {
    return SETTINGS_CATEGORIES;
  }

  /** 选择分类 */
  selectCategory(category: SettingsCategory): void {
    this.activeCategory = category;
  }

  /** 获取当前选中分类 */
  getActiveCategory(): SettingsCategory | null {
    return this.activeCategory;
  }

  // ─── 设置读取 ───

  /** 获取完整设置 */
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  // ─── 显示设置 — 需求 18.3 ───

  /** 设置显示亮度 (0-100) */
  setBrightness(level: number): SettingsChangeResult {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return this.applySetting('displayBrightness', clamped);
  }

  /** 设置字体大小 (10-24) */
  setFontSize(size: number): SettingsChangeResult {
    const clamped = Math.max(10, Math.min(24, Math.round(size)));
    return this.applySetting('fontSize', clamped);
  }

  /** 设置自动亮度 */
  setAutoBrightness(enabled: boolean): SettingsChangeResult {
    return this.applySetting('autoBrightness', enabled);
  }

  // ─── 通知偏好 — 需求 18.3 ───

  /** 设置通知偏好 */
  setNotificationPref(app: string, enabled: boolean): SettingsChangeResult {
    const prev = { ...this.settings.notificationPrefs };
    this.settings.notificationPrefs = {
      ...this.settings.notificationPrefs,
      [app]: enabled,
    };
    return this.makeResult(`notificationPrefs.${app}`, prev[app] ?? true, enabled);
  }

  // ─── 交互方式优先级 — 需求 18.3 ───

  /** 设置交互方式优先级顺序 */
  setInteractionPriority(priority: InputSource[]): SettingsChangeResult {
    const prev = [...this.settings.interactionPriority];
    this.settings.interactionPriority = [...priority];
    return this.makeResult('interactionPriority', prev, priority);
  }

  // ─── 连接管理 — 需求 18.4 ───

  /** 获取蓝牙配对设备列表 */
  getPairedDevices(): PairedDevice[] {
    return [...this.pairedDevices];
  }

  /** 连接蓝牙设备 */
  connectDevice(deviceId: string): SettingsChangeResult {
    const device = this.pairedDevices.find((d) => d.id === deviceId);
    if (!device) {
      return this.makeResult(`bluetooth.${deviceId}`, false, false, false);
    }
    device.connected = true;
    return this.makeResult(`bluetooth.${deviceId}`, false, true);
  }

  /** 断开蓝牙设备 */
  disconnectDevice(deviceId: string): SettingsChangeResult {
    const device = this.pairedDevices.find((d) => d.id === deviceId);
    if (!device) {
      return this.makeResult(`bluetooth.${deviceId}`, true, true, false);
    }
    device.connected = false;
    return this.makeResult(`bluetooth.${deviceId}`, true, false);
  }

  /** 获取 Wi-Fi 网络列表 */
  getWifiNetworks(): WifiNetwork[] {
    return [...this.wifiNetworks];
  }

  /** 连接 Wi-Fi 网络 */
  connectWifi(ssid: string): SettingsChangeResult {
    // Disconnect current
    for (const net of this.wifiNetworks) {
      net.connected = false;
    }
    const network = this.wifiNetworks.find((n) => n.ssid === ssid);
    if (!network) {
      return this.makeResult(`wifi.${ssid}`, false, false, false);
    }
    network.connected = true;
    return this.makeResult(`wifi.${ssid}`, false, true);
  }

  /** 断开 Wi-Fi */
  disconnectWifi(): SettingsChangeResult {
    const current = this.wifiNetworks.find((n) => n.connected);
    const prevSsid = current?.ssid ?? null;
    for (const net of this.wifiNetworks) {
      net.connected = false;
    }
    return this.makeResult('wifi', prevSsid, null);
  }

  // ─── 声音设置 ───

  /** 设置唤醒词 */
  setWakeWord(word: string): SettingsChangeResult {
    return this.applySetting('wakeWord', word);
  }

  // ─── 隐私设置 ───

  /** 设置允许流转的信息类型 */
  setRelayAllowedTypes(types: RelayInfoType[]): SettingsChangeResult {
    const prev = [...this.settings.relayAllowedTypes];
    this.settings.relayAllowedTypes = [...types];
    return this.makeResult('relayAllowedTypes', prev, types);
  }

  // ─── 反馈 — 需求 18.5 ───

  /** 获取最近一次变更反馈 */
  getLastChange(): SettingsChangeResult | null {
    return this.lastChange;
  }

  // ─── 完整状态 ───

  /** 获取完整面板状态 */
  getState(): SettingsPanelState {
    return {
      settings: this.getSettings(),
      categories: this.getCategories(),
      activeCategory: this.activeCategory,
      pairedDevices: this.getPairedDevices(),
      wifiNetworks: this.getWifiNetworks(),
      lastChange: this.lastChange,
    };
  }

  /** 重置为默认设置 */
  resetToDefaults(): SettingsChangeResult {
    const prev = { ...this.settings };
    this.settings = { ...DEFAULT_SETTINGS };
    return this.makeResult('all', prev, DEFAULT_SETTINGS);
  }

  /** 清理资源 */
  dispose(): void {
    this.activeCategory = null;
    this.lastChange = null;
  }

  // ─── 内部方法 ───

  private applySetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ): SettingsChangeResult {
    const prev = this.settings[key];
    this.settings[key] = value;
    return this.makeResult(key, prev, value);
  }

  private makeResult(
    key: string,
    previousValue: unknown,
    newValue: unknown,
    success = true,
  ): SettingsChangeResult {
    const result: SettingsChangeResult = {
      key,
      success,
      previousValue,
      newValue,
      timestamp: Date.now(),
    };
    this.lastChange = result;
    return result;
  }

  private initSimulatedDevices(): void {
    this.pairedDevices = [
      { id: 'phone_1', name: 'iPhone 15 Pro', type: 'phone', connected: true },
      { id: 'watch_1', name: 'Apple Watch Ultra', type: 'watch', connected: true },
      { id: 'earbuds_1', name: 'AirPods Pro', type: 'earbuds', connected: false },
    ];
    this.wifiNetworks = [
      { ssid: 'Home-5G', strength: 85, secured: true, connected: true },
      { ssid: 'Office-WiFi', strength: 60, secured: true, connected: false },
      { ssid: 'CoffeeShop', strength: 40, secured: false, connected: false },
    ];
  }
}
