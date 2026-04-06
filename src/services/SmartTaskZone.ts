import type { AIStatus } from '../types/ai';
import type { TaskSummary, GazeEvent } from '../types/data';

/**
 * SmartTaskZone 内部状态类型
 * compact: 紧凑模式 — 仅显示 AI_Status_Orb + 任务摘要
 * confirm_prompt: 确认提示 — 注视 >1s 后显示"是否展开？"
 * expanded: 展开模式 — 半透明浮层显示任务详情
 */
export type SmartTaskZoneState = 'compact' | 'confirm_prompt' | 'expanded';

export type ConfirmGestureType = 'nod' | 'emg_pinch';
export type DismissGestureType = 'head_shake' | 'side_swipe' | 'gaze_away';

export interface SmartTaskZoneCallbacks {
  onStateChange?: (from: SmartTaskZoneState, to: SmartTaskZoneState) => void;
  onConfirmPrompt?: () => void;
  onExpanded?: (latencyMs: number) => void;
  onCollapsed?: (reason: DismissGestureType | 'timeout') => void;
  onTasksChanged?: (tasks: TaskSummary[]) => void;
}

/**
 * SmartTaskZone 服务
 *
 * 管理智能任务区的状态机、注视检测、确认/收回手势处理。
 *
 * 状态机:
 *   [*] → Compact
 *   Compact → ConfirmPrompt : 注视 >1秒
 *   ConfirmPrompt → Expanded : 点头/EMG捏合确认 (300ms 内)
 *   ConfirmPrompt → Compact : 3秒无确认
 *   Expanded → Compact : 视线移开 >3秒
 *   Expanded → Compact : 摇头/侧滑手势
 *
 * 需求: 3.4, 3.5, 3.6, 3.7, 3.8
 */
export class SmartTaskZoneService {
  private state: SmartTaskZoneState = 'compact';
  private aiStatus: AIStatus = 'idle';
  private tasks: Map<string, TaskSummary> = new Map();
  private callbacks: SmartTaskZoneCallbacks;

  // Orb Menu 互斥锁：当 Orb Menu 展开时阻止 compact → confirm_prompt 转换
  private orbMenuLocked: boolean = false;

  // Timer IDs for gaze detection and auto-collapse
  private gazeTimer: ReturnType<typeof setTimeout> | null = null;
  private confirmTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private gazeAwayTimer: ReturnType<typeof setTimeout> | null = null;

  // Timestamp tracking for latency measurement
  private confirmGestureTimestamp: number | null = null;

  // Configurable thresholds (ms)
  private readonly GAZE_TRIGGER_MS = 1000;       // 需求 3.4: >1秒注视触发确认
  private readonly CONFIRM_TIMEOUT_MS = 3000;     // 3秒无确认 → 收回
  /** 需求 3.5/3.6: 300ms 内展开 — used for documentation/testing reference */
  readonly EXPAND_MAX_LATENCY_MS = 300;
  private readonly GAZE_AWAY_COLLAPSE_MS = 3000;  // 需求 3.8: 视线移开 >3秒收回


  constructor(callbacks: SmartTaskZoneCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /** 获取当前外部可见模式 (compact | expanded) */
  getMode(): 'compact' | 'expanded' {
    return this.state === 'expanded' ? 'expanded' : 'compact';
  }

  /** 获取内部状态机状态 */
  getState(): SmartTaskZoneState {
    return this.state;
  }

  /** 更新 AI 状态 */
  setAIStatus(status: AIStatus): void {
    this.aiStatus = status;
  }

  /** 获取当前 AI 状态 */
  getAIStatus(): AIStatus {
    return this.aiStatus;
  }

  /** 设置 Orb Menu 互斥锁（需求 6.3, 6.4） */
  setOrbMenuLock(locked: boolean): void {
    this.orbMenuLocked = locked;
  }

  /** 查询 Orb Menu 互斥锁状态（需求 6.2） */
  isOrbMenuLocked(): boolean {
    return this.orbMenuLocked;
  }

  /** 添加或更新任务 */
  upsertTask(task: TaskSummary): void {
    this.tasks.set(task.taskId, task);
    this.callbacks.onTasksChanged?.(this.getActiveTasks());
  }

  /** 移除任务 */
  removeTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.callbacks.onTasksChanged?.(this.getActiveTasks());
  }

  /** 获取所有活跃任务（按优先级降序） */
  getActiveTasks(): TaskSummary[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 处理注视事件
   *
   * 需求 3.4: 注视 Smart_Task_Zone >1秒 → 显示确认提示
   * 需求 3.8: 展开模式下视线移开 >3秒 → 收回
   */
  onGazeEvent(event: GazeEvent): void {
    const isGazingAtZone = event.target === 'smart_task_zone' && event.isGazing;

    if (this.state === 'compact') {
      if (isGazingAtZone) {
        if (this.orbMenuLocked) return;
        this.startGazeTimer();
      } else {
        this.clearGazeTimer();
      }
    } else if (this.state === 'confirm_prompt') {
      // If user looks away during confirm prompt, the confirm timeout handles collapse
      if (!isGazingAtZone) {
        // No special action — confirmTimeoutTimer will handle it
      }
    } else if (this.state === 'expanded') {
      if (!isGazingAtZone) {
        this.startGazeAwayTimer();
      } else {
        this.clearGazeAwayTimer();
      }
    }
  }

  /**
   * 处理确认手势
   *
   * 需求 3.5: 点头确认 → 300ms 内展开
   * 需求 3.6: EMG 捏合确认 → 300ms 内展开
   */
  onConfirmGesture(_type: ConfirmGestureType): void {
    if (this.state !== 'confirm_prompt') return;

    this.confirmGestureTimestamp = Date.now();
    this.clearConfirmTimeoutTimer();
    this.transitionTo('expanded');

    // Report latency
    const latency = Date.now() - this.confirmGestureTimestamp;
    this.callbacks.onExpanded?.(latency);
  }

  /**
   * 处理收回手势
   *
   * 需求 3.8: 摇头/侧滑 → 收回为紧凑模式
   */
  onDismissGesture(type: DismissGestureType): void {
    if (type === 'gaze_away') {
      // gaze_away is handled by the gaze away timer, not directly
      // But allow explicit dismiss via gaze_away gesture as well
      if (this.state === 'expanded') {
        this.clearGazeAwayTimer();
        this.transitionTo('compact');
        this.callbacks.onCollapsed?.(type);
      }
      return;
    }

    // head_shake and side_swipe: immediate collapse from expanded
    if (this.state === 'expanded') {
      this.clearGazeAwayTimer();
      this.transitionTo('compact');
      this.callbacks.onCollapsed?.(type);
    }
  }

  /** Clean up all timers */
  dispose(): void {
    this.clearGazeTimer();
    this.clearConfirmTimeoutTimer();
    this.clearGazeAwayTimer();
  }

  // --- Private state machine helpers ---

  private transitionTo(newState: SmartTaskZoneState): void {
    if (this.state === newState) return;
    const from = this.state;
    this.state = newState;
    this.callbacks.onStateChange?.(from, newState);
  }

  /**
   * Start gaze timer: after GAZE_TRIGGER_MS, transition to confirm_prompt
   * 需求 3.4
   */
  private startGazeTimer(): void {
    if (this.gazeTimer !== null) return; // already running
    this.gazeTimer = setTimeout(() => {
      this.gazeTimer = null;
      if (this.state === 'compact') {
        this.transitionTo('confirm_prompt');
        this.callbacks.onConfirmPrompt?.();
        this.startConfirmTimeoutTimer();
      }
    }, this.GAZE_TRIGGER_MS);
  }

  private clearGazeTimer(): void {
    if (this.gazeTimer !== null) {
      clearTimeout(this.gazeTimer);
      this.gazeTimer = null;
    }
  }

  /**
   * Start confirm timeout: if no confirmation within CONFIRM_TIMEOUT_MS, collapse
   */
  private startConfirmTimeoutTimer(): void {
    this.clearConfirmTimeoutTimer();
    this.confirmTimeoutTimer = setTimeout(() => {
      this.confirmTimeoutTimer = null;
      if (this.state === 'confirm_prompt') {
        this.transitionTo('compact');
        this.callbacks.onCollapsed?.('timeout');
      }
    }, this.CONFIRM_TIMEOUT_MS);
  }

  private clearConfirmTimeoutTimer(): void {
    if (this.confirmTimeoutTimer !== null) {
      clearTimeout(this.confirmTimeoutTimer);
      this.confirmTimeoutTimer = null;
    }
  }

  /**
   * Start gaze-away timer: if gaze stays away for GAZE_AWAY_COLLAPSE_MS, collapse
   * 需求 3.8
   */
  private startGazeAwayTimer(): void {
    if (this.gazeAwayTimer !== null) return; // already running
    this.gazeAwayTimer = setTimeout(() => {
      this.gazeAwayTimer = null;
      if (this.state === 'expanded') {
        this.transitionTo('compact');
        this.callbacks.onCollapsed?.('gaze_away');
      }
    }, this.GAZE_AWAY_COLLAPSE_MS);
  }

  private clearGazeAwayTimer(): void {
    if (this.gazeAwayTimer !== null) {
      clearTimeout(this.gazeAwayTimer);
      this.gazeAwayTimer = null;
    }
  }
}
