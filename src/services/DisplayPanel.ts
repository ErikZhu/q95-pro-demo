import type { DisplaySpec } from '../types/display';

/**
 * DisplayPanel 服务
 * 管理双目显示面板的亮度、刷新率和环境光自适应。
 *
 * 需求: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export class DisplayPanel {
  private spec: DisplaySpec;
  private brightness: number; // 0-100
  private autoBrightnessEnabled: boolean;
  private simulatedAmbientLight: number; // 0-100, 模拟环境光强度
  private currentRefreshRate: 60 | 90 | 120;

  constructor(spec?: Partial<DisplaySpec>) {
    this.spec = {
      resolution: { width: 1920, height: 1080 },
      maxBrightness: 4000,
      refreshRate: 90,
      fov: 52,
      panelType: 'MicroOLED',
      ...spec,
    };
    this.brightness = 50;
    this.autoBrightnessEnabled = false;
    this.simulatedAmbientLight = 50;
    this.currentRefreshRate = this.spec.refreshRate as 60 | 90 | 120;
  }

  /** 获取显示规格 */
  getSpec(): DisplaySpec {
    return { ...this.spec };
  }

  /** 设置亮度 (0-100)，自动亮度开启时忽略手动设置 */
  setBrightness(level: number): void {
    if (this.autoBrightnessEnabled) return;
    this.brightness = Math.max(0, Math.min(100, level));
  }

  /** 获取当前亮度 */
  getBrightness(): number {
    return this.brightness;
  }

  /**
   * 获取模拟环境光强度 (0-100)
   * Demo 中通过 setSimulatedAmbientLight 模拟环境光变化
   */
  getAmbientLight(): number {
    return this.simulatedAmbientLight;
  }

  /**
   * 设置模拟环境光 (0-100)
   * 当自动亮度开启时，会联动调节显示亮度
   */
  setSimulatedAmbientLight(level: number): void {
    this.simulatedAmbientLight = Math.max(0, Math.min(100, level));
    if (this.autoBrightnessEnabled) {
      this.applyAutoBrightness();
    }
  }

  /** 启用/禁用自动亮度调节 (需求 1.5) */
  setAutoBrightness(enabled: boolean): void {
    this.autoBrightnessEnabled = enabled;
    if (enabled) {
      this.applyAutoBrightness();
    }
  }

  /** 获取自动亮度是否开启 */
  isAutoBrightnessEnabled(): boolean {
    return this.autoBrightnessEnabled;
  }

  /** 设置刷新率 (需求 1.3) */
  setRefreshRate(hz: 60 | 90 | 120): void {
    this.currentRefreshRate = hz;
  }

  /** 获取当前刷新率 */
  getRefreshRate(): number {
    return this.currentRefreshRate;
  }

  /**
   * 根据环境光自动计算并应用亮度
   * 映射: 环境光 0 → 亮度 10, 环境光 100 → 亮度 100
   */
  private applyAutoBrightness(): void {
    const minBrightness = 10;
    const maxBrightness = 100;
    this.brightness = Math.round(
      minBrightness + (this.simulatedAmbientLight / 100) * (maxBrightness - minBrightness),
    );
  }
}
