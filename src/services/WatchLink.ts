import type { TaskResult } from '../types/ai';

/**
 * Simulated watch status for demo purposes.
 */
export interface WatchStatus {
  model: string;
  batteryLevel: number;
  connected: boolean;
  steps: number;
  heartRate: number;
  calories: number;
  exerciseMinutes: number;
  isRecording: boolean;
}

/**
 * Watch_Link 服务
 *
 * 模拟手表数据查询和动作执行。
 * 需求: 9.9
 */
export class WatchLinkService {
  private watch: WatchStatus;

  constructor() {
    this.watch = {
      model: 'Q95 智能手表',
      batteryLevel: 65,
      connected: true,
      steps: 8432,
      heartRate: 72,
      calories: 320,
      exerciseMinutes: 45,
      isRecording: false,
    };
  }

  /** 查询手表数据 (需求 9.9) */
  queryWatchData(query: string): TaskResult {
    if (!this.watch.connected) {
      return {
        taskId: '',
        success: false,
        message: '手表未连接，请检查蓝牙',
      };
    }
    const q = query.toLowerCase();
    let message: string;
    let data: Record<string, unknown>;

    if (q.includes('步') || q.includes('走')) {
      message = `今天已走 ${this.watch.steps} 步`;
      data = { steps: this.watch.steps };
    } else if (q.includes('心率') || q.includes('心跳')) {
      message = `当前心率 ${this.watch.heartRate} bpm`;
      data = { heartRate: this.watch.heartRate };
    } else if (q.includes('卡路里') || q.includes('热量')) {
      message = `今天已消耗 ${this.watch.calories} 千卡`;
      data = { calories: this.watch.calories };
    } else if (q.includes('运动') && q.includes('时')) {
      message = `今天运动 ${this.watch.exerciseMinutes} 分钟`;
      data = { exerciseMinutes: this.watch.exerciseMinutes };
    } else if (q.includes('电量')) {
      message = `手表电量 ${this.watch.batteryLevel}%`;
      data = { batteryLevel: this.watch.batteryLevel };
    } else {
      message = `步数 ${this.watch.steps}，心率 ${this.watch.heartRate}bpm，消耗 ${this.watch.calories}千卡`;
      data = {
        steps: this.watch.steps,
        heartRate: this.watch.heartRate,
        calories: this.watch.calories,
      };
    }

    return { taskId: '', success: true, message, data };
  }

  /** 执行手表动作 (需求 9.9) */
  executeWatchAction(action: string): TaskResult {
    if (!this.watch.connected) {
      return {
        taskId: '',
        success: false,
        message: '手表未连接，无法执行操作',
      };
    }
    const a = action.toLowerCase();
    if (a.includes('运动') && (a.includes('停止') || a.includes('结束'))) {
      this.watch.isRecording = false;
      return {
        taskId: '',
        success: true,
        message: '运动记录已停止',
        data: { isRecording: false },
      };
    }
    if (a.includes('运动') && (a.includes('开始') || a.includes('记录'))) {
      this.watch.isRecording = true;
      return {
        taskId: '',
        success: true,
        message: '已开始运动记录',
        data: { isRecording: true },
      };
    }
    // Generic action
    return {
      taskId: '',
      success: true,
      message: `手表动作已执行: ${action}`,
      data: { action },
    };
  }

  /** 获取模拟手表状态 */
  getWatchStatus(): WatchStatus {
    return { ...this.watch };
  }

  /** 设置连接状态 (for testing) */
  setConnected(connected: boolean): void {
    this.watch.connected = connected;
  }
}
