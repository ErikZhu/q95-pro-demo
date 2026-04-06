/**
 * HealthMonitor — 健康与运动数据监测服务
 *
 * 健康数据管理（步数、心率、卡路里）、运动类型自动识别、
 * 运动数据记录（时长、距离、心率）、心率异常检测与警告、
 * 配对手机/手环数据同步。
 * Demo 中使用模拟数据。
 *
 * 需求: 16.1, 16.2, 16.3, 16.4, 16.5
 */

/** 心率正常范围 */
const HEART_RATE_LOW = 50;
const HEART_RATE_HIGH = 180;
/** 运动数据更新间隔（ms） */
const WORKOUT_INTERVAL = 1000;

export type ExerciseType = 'walking' | 'running' | 'cycling' | 'swimming' | 'hiking' | 'unknown';

export type HealthMonitorStatus = 'idle' | 'monitoring' | 'workout';

export interface HealthData {
  steps: number;
  heartRate: number;
  calories: number;
  lastUpdated: number;
}

export interface WorkoutSession {
  type: ExerciseType;
  startTime: number;
  duration: number; // seconds
  distance: number; // meters
  heartRate: number;
  calories: number;
  isActive: boolean;
}

export interface HeartRateAlert {
  type: 'too_high' | 'too_low';
  heartRate: number;
  timestamp: number;
  message: string;
}

export interface HealthMonitorState {
  status: HealthMonitorStatus;
  healthData: HealthData;
  currentWorkout: WorkoutSession | null;
  alerts: HeartRateAlert[];
  deviceConnected: boolean;
  deviceName: string | null;
}

export class HealthMonitor {
  private status: HealthMonitorStatus = 'idle';
  private healthData: HealthData = {
    steps: 0,
    heartRate: 72,
    calories: 0,
    lastUpdated: Date.now(),
  };
  private currentWorkout: WorkoutSession | null = null;
  private alerts: HeartRateAlert[] = [];
  private deviceConnected = false;
  private deviceName: string | null = null;
  private workoutTimer: ReturnType<typeof setInterval> | null = null;

  constructor(initialData?: Partial<HealthData>) {
    if (initialData) {
      this.healthData = { ...this.healthData, ...initialData, lastUpdated: Date.now() };
    }
  }

  // ─── 基础健康数据 — 需求 16.1 ───

  /** 获取当前健康数据 */
  getHealthData(): HealthData {
    return { ...this.healthData };
  }

  /** 更新步数 */
  updateSteps(steps: number): void {
    this.healthData.steps = Math.max(0, steps);
    this.healthData.lastUpdated = Date.now();
  }

  /** 增加步数 */
  addSteps(delta: number): void {
    this.updateSteps(this.healthData.steps + Math.max(0, delta));
  }

  /** 更新心率 — 需求 16.5: 异常检测 */
  updateHeartRate(bpm: number): void {
    this.healthData.heartRate = Math.max(0, bpm);
    this.healthData.lastUpdated = Date.now();
    this.checkHeartRateAnomaly(bpm);
  }

  /** 更新卡路里消耗 */
  updateCalories(calories: number): void {
    this.healthData.calories = Math.max(0, calories);
    this.healthData.lastUpdated = Date.now();
  }

  /** 增加卡路里 */
  addCalories(delta: number): void {
    this.updateCalories(this.healthData.calories + Math.max(0, delta));
  }

  // ─── 运动类型识别与记录 — 需求 16.2, 16.3 ───

  /** 自动识别运动类型（模拟） — 需求 16.2 */
  detectExerciseType(sensorData: { speed: number; cadence: number; altitude?: number }): ExerciseType {
    const { speed, cadence, altitude } = sensorData;
    if (speed < 0.5 && cadence < 10) return 'unknown';
    if (speed > 15) return 'cycling';
    if (speed > 8) return 'running';
    if (altitude != null && Math.abs(altitude) > 5) return 'hiking';
    if (cadence > 40) return 'walking';
    return 'unknown';
  }

  /** 开始运动记录 — 需求 16.2 */
  startWorkout(type?: ExerciseType): void {
    if (this.currentWorkout?.isActive) {
      throw new Error('已有运动正在记录中');
    }
    this.currentWorkout = {
      type: type ?? 'unknown',
      startTime: Date.now(),
      duration: 0,
      distance: 0,
      heartRate: this.healthData.heartRate,
      calories: 0,
      isActive: true,
    };
    this.status = 'workout';
    this.startWorkoutTimer();
  }

  /** 停止运动记录 */
  stopWorkout(): WorkoutSession | null {
    if (!this.currentWorkout?.isActive) return null;
    this.stopWorkoutTimer();
    this.currentWorkout.isActive = false;
    const session = { ...this.currentWorkout };
    this.status = 'monitoring';
    return session;
  }

  /** 获取当前运动会话 — 需求 16.3 */
  getCurrentWorkout(): WorkoutSession | null {
    if (!this.currentWorkout) return null;
    return { ...this.currentWorkout };
  }

  /** 更新运动距离（外部传感器数据） */
  updateWorkoutDistance(meters: number): void {
    if (this.currentWorkout?.isActive) {
      this.currentWorkout.distance = Math.max(0, meters);
    }
  }

  /** 更新运动类型（自动识别后更新） */
  updateWorkoutType(type: ExerciseType): void {
    if (this.currentWorkout?.isActive) {
      this.currentWorkout.type = type;
    }
  }

  // ─── 心率异常检测 — 需求 16.5 ───

  /** 检测心率异常 */
  private checkHeartRateAnomaly(bpm: number): void {
    if (bpm > HEART_RATE_HIGH) {
      const alert: HeartRateAlert = {
        type: 'too_high',
        heartRate: bpm,
        timestamp: Date.now(),
        message: `心率过高警告：当前心率 ${bpm} BPM，请注意休息`,
      };
      this.alerts.push(alert);
    } else if (bpm > 0 && bpm < HEART_RATE_LOW) {
      const alert: HeartRateAlert = {
        type: 'too_low',
        heartRate: bpm,
        timestamp: Date.now(),
        message: `心率过低警告：当前心率 ${bpm} BPM，请注意身体状况`,
      };
      this.alerts.push(alert);
    }
  }

  /** 获取所有警告 */
  getAlerts(): HeartRateAlert[] {
    return [...this.alerts];
  }

  /** 获取最新警告 */
  getLatestAlert(): HeartRateAlert | null {
    return this.alerts.length > 0 ? { ...this.alerts[this.alerts.length - 1] } : null;
  }

  /** 清除警告 */
  clearAlerts(): void {
    this.alerts = [];
  }

  /** 获取心率正常范围 */
  getHeartRateRange(): { low: number; high: number } {
    return { low: HEART_RATE_LOW, high: HEART_RATE_HIGH };
  }

  // ─── 设备同步 — 需求 16.4 ───

  /** 连接配对设备（手机/手环） */
  connectDevice(name: string): void {
    this.deviceConnected = true;
    this.deviceName = name;
    if (this.status === 'idle') {
      this.status = 'monitoring';
    }
  }

  /** 断开配对设备 */
  disconnectDevice(): void {
    this.deviceConnected = false;
    this.deviceName = null;
  }

  /** 是否已连接设备 */
  isDeviceConnected(): boolean {
    return this.deviceConnected;
  }

  /** 获取已连接设备名称 */
  getDeviceName(): string | null {
    return this.deviceName;
  }

  /** 从配对设备同步数据 — 需求 16.4 */
  syncFromDevice(data: Partial<HealthData>): void {
    if (!this.deviceConnected) {
      throw new Error('未连接配对设备');
    }
    if (data.steps != null) this.healthData.steps = Math.max(0, data.steps);
    if (data.heartRate != null) {
      this.healthData.heartRate = Math.max(0, data.heartRate);
      this.checkHeartRateAnomaly(data.heartRate);
    }
    if (data.calories != null) this.healthData.calories = Math.max(0, data.calories);
    this.healthData.lastUpdated = Date.now();
  }

  // ─── 状态查询 ───

  /** 获取当前状态 */
  getStatus(): HealthMonitorStatus {
    return this.status;
  }

  /** 获取完整状态 */
  getState(): HealthMonitorState {
    return {
      status: this.status,
      healthData: this.getHealthData(),
      currentWorkout: this.getCurrentWorkout(),
      alerts: this.getAlerts(),
      deviceConnected: this.deviceConnected,
      deviceName: this.deviceName,
    };
  }

  /** 清理资源 */
  dispose(): void {
    this.stopWorkoutTimer();
    this.currentWorkout = null;
    this.alerts = [];
    this.status = 'idle';
  }

  // ─── 内部方法 ───

  private startWorkoutTimer(): void {
    this.stopWorkoutTimer();
    this.workoutTimer = setInterval(() => {
      if (this.currentWorkout?.isActive) {
        this.currentWorkout.duration++;
        this.currentWorkout.heartRate = this.healthData.heartRate;
        // Simulate calorie burn (~5 cal/min for moderate exercise)
        this.currentWorkout.calories += 5 / 60;
      }
    }, WORKOUT_INTERVAL);
  }

  private stopWorkoutTimer(): void {
    if (this.workoutTimer) {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;
    }
  }
}
