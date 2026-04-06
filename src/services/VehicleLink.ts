import type { TaskResult } from '../types/ai';

/**
 * Simulated vehicle info for demo purposes.
 */
export interface VehicleInfo {
  model: string;
  plateNumber: string;
  batteryLevel: number;
  range: number; // km
  location: string;
  locked: boolean;
  acOn: boolean;
  windowOpen: boolean;
}

/**
 * Vehicle_Link 服务
 *
 * 模拟车辆状态查询、车机协同和车辆控制。
 * 需求: 9.6, 9.7, 9.8
 */
export class VehicleLinkService {
  private vehicle: VehicleInfo;
  private connected: boolean = true;

  constructor() {
    this.vehicle = {
      model: 'Q95 智能汽车',
      plateNumber: '京A·88888',
      batteryLevel: 78,
      range: 320,
      location: '公司地下停车场 B2-056',
      locked: true,
      acOn: false,
      windowOpen: false,
    };
  }

  /** 查询车辆状态 (需求 9.6) */
  queryVehicleStatus(query: string): TaskResult {
    if (!this.connected) {
      return {
        taskId: '',
        success: false,
        message: '车机连接断开，请检查网络',
      };
    }
    const q = query.toLowerCase();
    let message: string;
    let data: Record<string, unknown>;

    if (q.includes('电量') || q.includes('续航')) {
      message = `当前电量 ${this.vehicle.batteryLevel}%，续航约 ${this.vehicle.range}km`;
      data = { batteryLevel: this.vehicle.batteryLevel, range: this.vehicle.range };
    } else if (q.includes('停') || q.includes('位置') || q.includes('在哪')) {
      message = `车辆停在: ${this.vehicle.location}`;
      data = { location: this.vehicle.location };
    } else if (q.includes('锁') || q.includes('门')) {
      message = this.vehicle.locked ? '车辆已锁定' : '车辆未锁定';
      data = { locked: this.vehicle.locked };
    } else {
      message = `${this.vehicle.model} (${this.vehicle.plateNumber})，电量 ${this.vehicle.batteryLevel}%，续航 ${this.vehicle.range}km`;
      data = { ...this.vehicle };
    }

    return { taskId: '', success: true, message, data };
  }

  /** 车机协同操作 (需求 9.7) */
  sendToVehicle(data: string): TaskResult {
    if (!this.connected) {
      return {
        taskId: '',
        success: false,
        message: '车机连接断开，无法发送',
      };
    }
    return {
      taskId: '',
      success: true,
      message: `已发送到车机: ${data}`,
      data: { sent: data, timestamp: Date.now() },
    };
  }

  /** 执行车辆控制动作 (需求 9.8) */
  executeVehicleAction(action: string): TaskResult {
    if (!this.connected) {
      return {
        taskId: '',
        success: false,
        message: '车机连接断开，无法执行操作',
      };
    }
    const a = action.toLowerCase();
    if (a.includes('车窗') || a.includes('窗')) {
      this.vehicle.windowOpen = a.includes('打开') || a.includes('开');
      return {
        taskId: '',
        success: true,
        message: this.vehicle.windowOpen ? '车窗已打开' : '车窗已关闭',
        data: { windowOpen: this.vehicle.windowOpen },
      };
    }
    if (a.includes('空调') || a.includes('预热')) {
      this.vehicle.acOn = true;
      return {
        taskId: '',
        success: true,
        message: '车辆空调已开启',
        data: { acOn: true },
      };
    }
    if (a.includes('锁') && (a.includes('解') || a.includes('开'))) {
      this.vehicle.locked = false;
      return {
        taskId: '',
        success: true,
        message: '车辆已解锁',
        data: { locked: false },
      };
    }
    if (a.includes('锁')) {
      this.vehicle.locked = true;
      return {
        taskId: '',
        success: true,
        message: '车辆已锁定',
        data: { locked: true },
      };
    }
    // Generic action
    return {
      taskId: '',
      success: true,
      message: `车辆动作已执行: ${action}`,
      data: { action },
    };
  }

  /** 获取模拟车辆信息 */
  getVehicleInfo(): VehicleInfo {
    return { ...this.vehicle };
  }

  /** 设置连接状态 (for testing) */
  setConnected(connected: boolean): void {
    this.connected = connected;
  }
}
