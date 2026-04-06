import type { Intent, TaskResult, TaskStatus } from '../types/ai';
import type { TaskSummary } from '../types/data';
import type { SmartTaskZoneService } from './SmartTaskZone';

/**
 * Internal task record tracking execution state.
 */
interface TaskRecord {
  taskId: string;
  intent: Intent;
  status: TaskStatus;
  result?: TaskResult;
  createdAt: number;
}

/**
 * Callback interface for TaskCenter events.
 */
export interface TaskCenterCallbacks {
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDeviceUnreachable?: (target: Intent['target'], suggestion: string) => void;
}

/**
 * Simulated device reachability map.
 * In the demo, devices default to reachable; callers can set specific devices offline.
 */
type DeviceTarget = Intent['target'];

let nextId = 1;
function generateTaskId(): string {
  return `task_${Date.now()}_${nextId++}`;
}

/** Alternative suggestions when a device target is unreachable. */
const OFFLINE_SUGGESTIONS: Record<DeviceTarget, string> = {
  local: '请检查眼镜系统状态',
  phone: '请确认手机蓝牙已连接',
  iot: '请检查智能家居网关连接状态',
  vehicle: '请确认车机蓝牙或网络连接',
  watch: '请确认手表蓝牙已连接',
  third_party: '请确认应用已安装并支持语音控制',
};

/**
 * TaskCenter 服务
 *
 * 路由和执行跨设备任务指令，支持复合任务拆解，
 * 设备可达性检查，以及在 Smart_Task_Zone 中实时更新任务状态。
 *
 * 需求: 9.1, 9.2, 9.10, 9.11, 9.12
 */
export class TaskCenterService {
  private tasks: Map<string, TaskRecord> = new Map();
  private deviceReachability: Map<DeviceTarget, boolean> = new Map();
  private callbacks: TaskCenterCallbacks;
  private smartTaskZone: SmartTaskZoneService | null = null;

  constructor(callbacks: TaskCenterCallbacks = {}) {
    this.callbacks = callbacks;
    // All devices default to reachable
    const targets: DeviceTarget[] = ['local', 'phone', 'iot', 'vehicle', 'watch', 'third_party'];
    for (const t of targets) {
      this.deviceReachability.set(t, true);
    }
  }

  /** Link to SmartTaskZone for real-time status updates (需求 9.10) */
  setSmartTaskZone(zone: SmartTaskZoneService): void {
    this.smartTaskZone = zone;
  }

  /**
   * Set simulated device reachability for demo purposes.
   * 需求 9.11: 设备不可达时提示用户
   */
  setDeviceReachable(target: DeviceTarget, reachable: boolean): void {
    this.deviceReachability.set(target, reachable);
  }

  /**
   * Check if a target device is reachable.
   * 需求 9.11
   */
  async checkDeviceReachable(target: DeviceTarget): Promise<boolean> {
    return this.deviceReachability.get(target) ?? false;
  }

  /**
   * Execute a single task from an intent.
   * Routes to the correct target handler based on intent.target.
   *
   * 需求 9.1 (local), 9.2 (phone), 9.10 (status updates)
   */
  async executeTask(intent: Intent): Promise<TaskResult> {
    const taskId = generateTaskId();
    const record: TaskRecord = {
      taskId,
      intent,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.tasks.set(taskId, record);
    this.updateStatus(taskId, 'pending');

    // Check device reachability (需求 9.11)
    const reachable = await this.checkDeviceReachable(intent.target);
    if (!reachable) {
      const suggestion = OFFLINE_SUGGESTIONS[intent.target];
      this.callbacks.onDeviceUnreachable?.(intent.target, suggestion);
      const failResult: TaskResult = {
        taskId,
        success: false,
        message: `设备不可达: ${intent.target}。${suggestion}`,
        data: { suggestion },
      };
      record.status = 'failed';
      record.result = failResult;
      this.updateStatus(taskId, 'failed');
      return failResult;
    }

    // Execute
    this.updateStatus(taskId, 'executing');
    try {
      const result = await this.routeIntent(taskId, intent);
      record.status = result.success ? 'completed' : 'failed';
      record.result = result;
      this.updateStatus(taskId, record.status);
      return result;
    } catch {
      const errorResult: TaskResult = {
        taskId,
        success: false,
        message: `任务执行失败: ${intent.name}`,
      };
      record.status = 'failed';
      record.result = errorResult;
      this.updateStatus(taskId, 'failed');
      return errorResult;
    }
  }

  /**
   * Execute a compound task — decompose multiple intents and execute sequentially.
   * 需求 9.12: 复合指令拆解为子任务依次执行
   */
  async executeCompoundTask(intents: Intent[]): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    for (const intent of intents) {
      const result = await this.executeTask(intent);
      results.push(result);
    }
    return results;
  }

  /** Get the status of a task by ID. */
  getTaskStatus(taskId: string): TaskStatus {
    const record = this.tasks.get(taskId);
    if (!record) return 'pending';
    return record.status;
  }

  /** Cancel a running task. */
  async cancelTask(taskId: string): Promise<void> {
    const record = this.tasks.get(taskId);
    if (!record) return;
    if (record.status === 'completed' || record.status === 'failed' || record.status === 'cancelled') {
      return;
    }
    record.status = 'cancelled';
    this.updateStatus(taskId, 'cancelled');
  }

  /** Get all task records (for testing/debugging). */
  getAllTasks(): Map<string, TaskRecord> {
    return new Map(this.tasks);
  }

  // --- Private routing logic ---

  /**
   * Route an intent to the appropriate simulated handler.
   * 需求 9.1, 9.2
   */
  private async routeIntent(taskId: string, intent: Intent): Promise<TaskResult> {
    switch (intent.target) {
      case 'local':
        return this.handleLocal(taskId, intent);
      case 'phone':
        return this.handlePhone(taskId, intent);
      case 'iot':
        return this.handleIoT(taskId, intent);
      case 'vehicle':
        return this.handleVehicle(taskId, intent);
      case 'watch':
        return this.handleWatch(taskId, intent);
      case 'third_party':
        return this.handleThirdParty(taskId, intent);
      default:
        return { taskId, success: false, message: `未知目标: ${intent.target}` };
    }
  }

  /** 需求 9.1: 眼镜本机控制 */
  private async handleLocal(taskId: string, intent: Intent): Promise<TaskResult> {
    return {
      taskId,
      success: true,
      message: `本机指令已执行: ${intent.name}`,
      data: { target: 'local', ...intent.params },
    };
  }

  /** 需求 9.2: 手机控制 */
  private async handlePhone(taskId: string, intent: Intent): Promise<TaskResult> {
    return {
      taskId,
      success: true,
      message: `手机指令已执行: ${intent.name}`,
      data: { target: 'phone', ...intent.params },
    };
  }

  /** IoT 设备控制 */
  private async handleIoT(taskId: string, intent: Intent): Promise<TaskResult> {
    return {
      taskId,
      success: true,
      message: `IoT 指令已执行: ${intent.name}`,
      data: { target: 'iot', ...intent.params },
    };
  }

  /** 车机控制 */
  private async handleVehicle(taskId: string, intent: Intent): Promise<TaskResult> {
    return {
      taskId,
      success: true,
      message: `车机指令已执行: ${intent.name}`,
      data: { target: 'vehicle', ...intent.params },
    };
  }

  /** 手表控制 */
  private async handleWatch(taskId: string, intent: Intent): Promise<TaskResult> {
    return {
      taskId,
      success: true,
      message: `手表指令已执行: ${intent.name}`,
      data: { target: 'watch', ...intent.params },
    };
  }

  /** 三方应用控制 */
  private async handleThirdParty(taskId: string, intent: Intent): Promise<TaskResult> {
    return {
      taskId,
      success: true,
      message: `三方应用指令已执行: ${intent.name}`,
      data: { target: 'third_party', ...intent.params },
    };
  }

  // --- Smart_Task_Zone integration ---

  /**
   * Update task status in Smart_Task_Zone for real-time display.
   * 需求 9.10
   */
  private updateStatus(taskId: string, status: TaskStatus): void {
    const record = this.tasks.get(taskId);
    if (!record) return;

    this.callbacks.onTaskStatusChange?.(taskId, status);

    if (!this.smartTaskZone) return;

    const statusTextMap: Record<TaskStatus, string> = {
      pending: '等待执行...',
      executing: `正在执行: ${record.intent.name}`,
      completed: `已完成: ${record.intent.name}`,
      failed: `失败: ${record.intent.name}`,
      cancelled: `已取消: ${record.intent.name}`,
    };

    const summary: TaskSummary = {
      taskId,
      source: record.intent.target,
      title: record.intent.name,
      statusText: statusTextMap[status],
      priority: status === 'executing' ? 10 : status === 'failed' ? 5 : 1,
      timestamp: Date.now(),
    };

    if (status === 'completed' || status === 'cancelled') {
      this.smartTaskZone.removeTask(taskId);
    } else {
      this.smartTaskZone.upsertTask(summary);
    }
  }
}
