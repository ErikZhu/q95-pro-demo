import type {
  InputSource,
  PriorityRule,
  InputEvent,
  ProcessedAction,
} from '../types/interaction';

/**
 * 传感器状态变化回调
 */
export type SensorStatusCallback = (source: InputSource, available: boolean) => void;

/**
 * 默认优先级规则（需求 6.2）
 * 物理按键 > 语音 > EMG > 侧边触控 > 摄像头手势 > 头部追踪
 */
export const DEFAULT_PRIORITY_RULES: PriorityRule[] = [
  { sources: ['physical_button'], priority: 6 },
  { sources: ['voice'], priority: 5 },
  { sources: ['emg_band'], priority: 4 },
  { sources: ['side_touchpad'], priority: 3 },
  { sources: ['camera_gesture'], priority: 2 },
  { sources: ['head_tracking'], priority: 1 },
];

/** 冲突解决时间窗口（ms） */
const CONFLICT_WINDOW_MS = 50;

/** 最大允许响应延迟（需求 6.3） */
export const MAX_RESPONSE_LATENCY_MS = 100;

/**
 * 缓冲区中的待处理事件
 */
interface BufferedEvent {
  event: InputEvent;
  receivedAt: number;
}

/**
 * InteractionManager 服务
 * 统一管理六种交互输入方式，处理优先级冲突和传感器切换。
 *
 * 需求: 6.1, 6.2, 6.3, 6.8
 */
export class InteractionManager {
  /** 已注册的输入源 */
  private registeredInputs: Set<InputSource> = new Set();
  /** 当前可用的输入源（传感器在线） */
  private availableInputs: Set<InputSource> = new Set();
  /** 优先级规则映射：source → priority */
  private priorityMap: Map<InputSource, number> = new Map();
  /** 传感器状态变化回调列表 */
  private sensorCallbacks: SensorStatusCallback[] = [];
  /** 事件缓冲区，用于冲突窗口内的事件收集 */
  private eventBuffer: BufferedEvent[] = [];
  /** 冲突窗口定时器 */
  private conflictTimer: ReturnType<typeof setTimeout> | null = null;
  /** 缓冲区解析回调列表（所有等待者都会收到结果） */
  private bufferResolvers: ((action: ProcessedAction) => void)[] = [];

  constructor() {
    this.setPriorityRules(DEFAULT_PRIORITY_RULES);
  }

  /**
   * 注册输入源（需求 6.1）
   * 注册后默认标记为可用。
   */
  registerInput(source: InputSource): void {
    this.registeredInputs.add(source);
    this.availableInputs.add(source);
  }

  /**
   * 注销输入源
   */
  unregisterInput(source: InputSource): void {
    this.registeredInputs.delete(source);
    this.availableInputs.delete(source);
  }

  /**
   * 设置优先级规则（需求 6.2）
   * 构建 source → priority 的快速查找映射。
   */
  setPriorityRules(rules: PriorityRule[]): void {
    this.priorityMap.clear();
    for (const rule of rules) {
      for (const source of rule.sources) {
        this.priorityMap.set(source, rule.priority);
      }
    }
  }

  /**
   * 获取当前可用的输入方式（需求 6.1）
   */
  getAvailableInputs(): InputSource[] {
    return Array.from(this.availableInputs);
  }

  /**
   * 获取已注册的输入方式
   */
  getRegisteredInputs(): InputSource[] {
    return Array.from(this.registeredInputs);
  }

  /**
   * 获取输入源的优先级
   * 未配置的输入源返回 0。
   */
  getPriority(source: InputSource): number {
    return this.priorityMap.get(source) ?? 0;
  }

  /**
   * 处理输入事件（需求 6.2, 6.3）
   *
   * 同步处理单个事件，立即返回 ProcessedAction。
   * 延迟控制在 <100ms 以内。
   */
  processInput(event: InputEvent): ProcessedAction {
    const startTime = performance.now();

    // 检查输入源是否可用
    if (!this.availableInputs.has(event.source)) {
      const fallback = this.findFallbackSource(event.source);
      if (fallback) {
        return this.buildAction(event, fallback, startTime, true);
      }
      // 无可用替代，仍然处理但标记冲突
      return this.buildAction(event, event.source, startTime, false);
    }

    return this.buildAction(event, event.source, startTime, false);
  }

  /**
   * 处理多个同时触发的输入事件（需求 6.2）
   *
   * 当多个输入在冲突窗口内同时触发时，选择优先级最高的输入。
   */
  resolveConflict(events: InputEvent[]): ProcessedAction {
    const startTime = performance.now();

    if (events.length === 0) {
      throw new Error('No events to resolve');
    }

    if (events.length === 1) {
      return this.processInput(events[0]);
    }

    // 按优先级排序，选择最高优先级的事件
    const sorted = [...events]
      .filter((e) => this.availableInputs.has(e.source))
      .sort((a, b) => this.getPriority(b.source) - this.getPriority(a.source));

    // 如果所有输入源都不可用，使用原始列表中优先级最高的
    const winner =
      sorted.length > 0
        ? sorted[0]
        : [...events].sort(
            (a, b) => this.getPriority(b.source) - this.getPriority(a.source),
          )[0];

    return this.buildAction(winner, winner.source, startTime, events.length > 1);
  }

  /**
   * 将事件加入缓冲区，在冲突窗口结束后统一解析（需求 6.2）
   *
   * 返回 Promise，在冲突窗口结束后 resolve 为最终的 ProcessedAction。
   */
  bufferInput(event: InputEvent): Promise<ProcessedAction> {
    return new Promise((resolve) => {
      this.eventBuffer.push({ event, receivedAt: performance.now() });
      this.bufferResolvers.push(resolve);

      // 如果是第一个事件，启动冲突窗口定时器
      if (this.conflictTimer === null) {
        this.conflictTimer = setTimeout(() => {
          this.flushBuffer();
        }, CONFLICT_WINDOW_MS);
      }
    });
  }

  /**
   * 刷新缓冲区，解析冲突
   */
  private flushBuffer(): void {
    const events = this.eventBuffer.map((b) => b.event);
    const resolvers = this.bufferResolvers;
    this.eventBuffer = [];
    this.bufferResolvers = [];
    this.conflictTimer = null;

    if (events.length > 0 && resolvers.length > 0) {
      const action = this.resolveConflict(events);
      for (const resolve of resolvers) {
        resolve(action);
      }
    }
  }

  /**
   * 监听传感器状态变化（需求 6.8）
   */
  onSensorStatusChange(callback: SensorStatusCallback): void {
    this.sensorCallbacks.push(callback);
  }

  /**
   * 移除传感器状态变化监听
   */
  offSensorStatusChange(callback: SensorStatusCallback): void {
    this.sensorCallbacks = this.sensorCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * 更新传感器可用状态（需求 6.8）
   *
   * 当传感器不可用时，自动通知所有监听者。
   */
  setSensorAvailable(source: InputSource, available: boolean): void {
    if (!this.registeredInputs.has(source)) return;

    const wasAvailable = this.availableInputs.has(source);

    if (available) {
      this.availableInputs.add(source);
    } else {
      this.availableInputs.delete(source);
    }

    // 仅在状态实际变化时通知
    if (wasAvailable !== available) {
      for (const cb of this.sensorCallbacks) {
        cb(source, available);
      }
    }
  }

  /**
   * 查找替代输入源（需求 6.8）
   *
   * 当某个传感器不可用时，按优先级从高到低查找可用的替代输入源。
   */
  private findFallbackSource(unavailableSource: InputSource): InputSource | null {
    const available = Array.from(this.availableInputs)
      .filter((s) => s !== unavailableSource)
      .sort((a, b) => this.getPriority(b) - this.getPriority(a));

    return available.length > 0 ? available[0] : null;
  }

  /**
   * 构建 ProcessedAction 结果
   */
  private buildAction(
    event: InputEvent,
    resolvedSource: InputSource,
    startTime: number,
    conflictResolved: boolean,
  ): ProcessedAction {
    const latency = performance.now() - startTime;
    return {
      action: event.type,
      source: resolvedSource,
      latency,
      conflictResolved,
    };
  }

  /**
   * 获取冲突窗口大小（ms）
   */
  static get CONFLICT_WINDOW_MS(): number {
    return CONFLICT_WINDOW_MS;
  }

  /**
   * 销毁，清理定时器
   */
  destroy(): void {
    if (this.conflictTimer !== null) {
      clearTimeout(this.conflictTimer);
      this.conflictTimer = null;
    }
    this.eventBuffer = [];
    this.bufferResolvers = [];
    this.sensorCallbacks = [];
  }
}
