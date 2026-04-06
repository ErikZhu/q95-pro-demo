import type { TaskResult } from '../types/ai';

/**
 * Simulated IoT device for demo purposes.
 */
export interface IoTDevice {
  name: string;
  type: 'light' | 'ac' | 'curtain' | 'speaker' | 'lock' | 'camera';
  room: string;
  online: boolean;
  state: Record<string, unknown>;
}

/**
 * Simulated scene automation.
 */
export interface IoTScene {
  name: string;
  actions: Array<{ deviceName: string; action: string; params?: Record<string, unknown> }>;
}

/**
 * IoT_Control 服务
 *
 * 模拟智能家居设备状态查询、场景自动化和设备动作执行。
 * 需求: 9.3, 9.4, 9.5
 */
export class IoTControlService {
  private devices: Map<string, IoTDevice> = new Map();
  private scenes: Map<string, IoTScene> = new Map();

  constructor() {
    this.initDefaultDevices();
    this.initDefaultScenes();
  }

  /** 查询设备状态 (需求 9.3) */
  queryDeviceStatus(deviceName: string): TaskResult {
    const device = this.devices.get(deviceName);
    if (!device) {
      return {
        taskId: '',
        success: false,
        message: `未找到设备: ${deviceName}`,
      };
    }
    if (!device.online) {
      return {
        taskId: '',
        success: false,
        message: `设备离线: ${deviceName}`,
        data: { device: deviceName, online: false },
      };
    }
    return {
      taskId: '',
      success: true,
      message: `${deviceName} 状态查询成功`,
      data: { device: deviceName, ...device.state },
    };
  }

  /** 触发场景自动化 (需求 9.4) */
  triggerScene(sceneName: string): TaskResult {
    const scene = this.scenes.get(sceneName);
    if (!scene) {
      return {
        taskId: '',
        success: false,
        message: `未找到场景: ${sceneName}`,
      };
    }
    const results: string[] = [];
    for (const action of scene.actions) {
      const r = this.executeAction(action.deviceName, action.action);
      results.push(r.message);
    }
    return {
      taskId: '',
      success: true,
      message: `场景「${sceneName}」已触发`,
      data: { scene: sceneName, results },
    };
  }

  /** 执行单个设备动作 (需求 9.5) */
  executeAction(deviceName: string, action: string): TaskResult {
    const device = this.devices.get(deviceName);
    if (!device) {
      return {
        taskId: '',
        success: false,
        message: `未找到设备: ${deviceName}`,
      };
    }
    if (!device.online) {
      return {
        taskId: '',
        success: false,
        message: `设备离线，无法执行: ${deviceName}`,
      };
    }
    // Simulate action by updating state
    device.state.lastAction = action;
    device.state.lastActionTime = Date.now();
    return {
      taskId: '',
      success: true,
      message: `${deviceName} 已执行: ${action}`,
      data: { device: deviceName, action },
    };
  }

  /** 获取所有模拟设备列表 */
  getDevices(): IoTDevice[] {
    return Array.from(this.devices.values());
  }

  /** 添加设备 (for testing) */
  addDevice(device: IoTDevice): void {
    this.devices.set(device.name, device);
  }

  /** 添加场景 (for testing) */
  addScene(scene: IoTScene): void {
    this.scenes.set(scene.name, scene);
  }

  private initDefaultDevices(): void {
    const defaults: IoTDevice[] = [
      { name: '客厅灯', type: 'light', room: '客厅', online: true, state: { brightness: 80, on: true } },
      { name: '卧室空调', type: 'ac', room: '卧室', online: true, state: { temperature: 26, mode: '制冷', on: true } },
      { name: '客厅窗帘', type: 'curtain', room: '客厅', online: true, state: { openPercent: 50 } },
      { name: '智能音箱', type: 'speaker', room: '客厅', online: true, state: { volume: 30, playing: false } },
      { name: '门锁', type: 'lock', room: '入口', online: true, state: { locked: true } },
    ];
    for (const d of defaults) {
      this.devices.set(d.name, d);
    }
  }

  private initDefaultScenes(): void {
    this.scenes.set('回家模式', {
      name: '回家模式',
      actions: [
        { deviceName: '客厅灯', action: '打开' },
        { deviceName: '卧室空调', action: '打开' },
        { deviceName: '客厅窗帘', action: '打开' },
      ],
    });
    this.scenes.set('离家模式', {
      name: '离家模式',
      actions: [
        { deviceName: '客厅灯', action: '关闭' },
        { deviceName: '卧室空调', action: '关闭' },
        { deviceName: '门锁', action: '上锁' },
      ],
    });
  }
}
