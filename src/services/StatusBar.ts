import type { DeviceStatus } from '../types/data';

/**
 * StatusBar 回调接口
 */
export interface StatusBarCallbacks {
  onStatusChange?: (status: DeviceStatus) => void;
  onLowBattery?: (level: number) => void;
  onCriticalBattery?: (level: number) => void;
}

/**
 * StatusBar 服务
 * 管理设备状态栏：电量、蓝牙、Wi-Fi、时间的状态显示与警告逻辑。
 *
 * 需求: 4.1, 4.2, 4.3, 4.4
 */
export class StatusBar {
  private status: DeviceStatus;
  private expanded: boolean;
  private callbacks: StatusBarCallbacks;
  private timeIntervalId: ReturnType<typeof setInterval> | null;

  /** 低电量警告阈值 (需求 4.2) */
  static readonly LOW_BATTERY_THRESHOLD = 20;
  /** 严重低电量阈值 (需求 4.3) */
  static readonly CRITICAL_BATTERY_THRESHOLD = 5;
  /** 连接状态更新最大延迟 (需求 4.4) */
  static readonly CONNECTION_UPDATE_MAX_DELAY_MS = 500;

  constructor(callbacks?: StatusBarCallbacks) {
    this.status = {
      battery: { level: 100, isCharging: false, isLow: false, isCritical: false },
      bluetooth: { connected: false },
      wifi: { connected: false },
      time: StatusBar.formatTime(new Date()),
    };
    this.expanded = false;
    this.callbacks = callbacks ?? {};
    this.timeIntervalId = null;
  }

  /** 启动时间自动更新（每秒刷新） */
  startTimeUpdates(): void {
    if (this.timeIntervalId !== null) return;
    this.timeIntervalId = setInterval(() => {
      this.status.time = StatusBar.formatTime(new Date());
      this.notifyStatusChange();
    }, 1000);
  }

  /** 停止时间自动更新 */
  stopTimeUpdates(): void {
    if (this.timeIntervalId !== null) {
      clearInterval(this.timeIntervalId);
      this.timeIntervalId = null;
    }
  }

  /** 获取当前设备状态 (需求 4.1) */
  getStatus(): DeviceStatus {
    return {
      battery: { ...this.status.battery },
      bluetooth: { ...this.status.bluetooth },
      wifi: { ...this.status.wifi },
      time: this.status.time,
    };
  }

  /**
   * 更新电量状态 (需求 4.1, 4.2, 4.3)
   * - level < 20%: isLow = true（警告色）
   * - level < 5%: isCritical = true（全屏警告）
   */
  updateBattery(level: number, isCharging: boolean): void {
    const clampedLevel = Math.max(0, Math.min(100, Math.round(level)));
    const isLow = clampedLevel < StatusBar.LOW_BATTERY_THRESHOLD;
    const isCritical = clampedLevel < StatusBar.CRITICAL_BATTERY_THRESHOLD;

    this.status.battery = { level: clampedLevel, isCharging, isLow, isCritical };

    if (isCritical) {
      this.callbacks.onCriticalBattery?.(clampedLevel);
    } else if (isLow) {
      this.callbacks.onLowBattery?.(clampedLevel);
    }

    this.notifyStatusChange();
  }

  /**
   * 更新连接状态 (需求 4.4)
   * 连接状态变化在 500ms 内更新。
   * detail: 蓝牙为设备名称，Wi-Fi 为 SSID
   */
  updateConnection(type: 'bluetooth' | 'wifi', connected: boolean, detail?: string): void {
    if (type === 'bluetooth') {
      this.status.bluetooth = { connected, deviceName: detail };
    } else {
      this.status.wifi = { connected, ssid: detail, strength: connected ? 100 : undefined };
    }
    this.notifyStatusChange();
  }

  /**
   * 更新 Wi-Fi 信号强度
   */
  updateWifiStrength(strength: number): void {
    if (this.status.wifi.connected) {
      this.status.wifi = { ...this.status.wifi, strength: Math.max(0, Math.min(100, strength)) };
      this.notifyStatusChange();
    }
  }

  /** 展开详细信息面板 (需求 4.5) */
  expand(): void {
    this.expanded = true;
  }

  /** 收起详细信息面板 */
  collapse(): void {
    this.expanded = false;
  }

  /** 获取展开/收起状态 */
  isExpanded(): boolean {
    return this.expanded;
  }

  /** 设置回调 */
  setCallbacks(callbacks: StatusBarCallbacks): void {
    this.callbacks = callbacks;
  }

  /** 手动设置时间（用于测试或 Demo 场景） */
  setTime(time: string): void {
    this.status.time = time;
    this.notifyStatusChange();
  }

  /** 格式化时间为 HH:MM */
  static formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /** 通知状态变化 */
  private notifyStatusChange(): void {
    this.callbacks.onStatusChange?.(this.getStatus());
  }

  /** 销毁，清理定时器 */
  destroy(): void {
    this.stopTimeUpdates();
  }
}
