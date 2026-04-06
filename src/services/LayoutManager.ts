import type { ScreenZone, Rect, OverlayConfig } from '../types/display';

/**
 * LayoutManager 服务
 * 管理屏幕三分区布局（Main_Task_Area、Smart_Task_Zone、Status_Bar），
 * 处理分区边界计算、遮挡检测和浮层注册/移除。
 *
 * 布局基于 1280×720 显示区域：
 * - Smart_Task_Zone: 左上角，约 25% 宽度，~15% 高度
 * - Status_Bar: 右上角，约 25% 宽度，~15% 高度
 * - Main_Task_Area: 顶部栏下方的中央区域，占满宽度
 *
 * 三分区互不重叠，之间有清晰的视觉边界（gap）。
 *
 * 需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

interface StoredOverlay extends OverlayConfig {
  id: string;
}

export class LayoutManager {
  private readonly screenWidth: number;
  private readonly screenHeight: number;
  private readonly gap: number;
  private smartTaskMode: 'compact' | 'expanded';
  private overlays: Map<string, StoredOverlay>;
  private nextOverlayId: number;

  constructor(screenWidth = 1280, screenHeight = 720, gap = 4) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.gap = gap;
    this.smartTaskMode = 'compact';
    this.overlays = new Map();
    this.nextOverlayId = 1;
  }

  /**
   * 获取指定分区的边界矩形。
   *
   * 需求 2.1: 三个常驻分区
   * 需求 2.2: Main_Task_Area 占据屏幕中央主要区域
   * 需求 2.3: Smart_Task_Zone 固定显示在屏幕左上角
   * 需求 2.4: Status_Bar 固定显示在屏幕右上角
   * 需求 2.6: 分区之间有清晰的视觉边界（gap）
   */
  getZoneBounds(zone: ScreenZone): Rect {
    const topBarHeight = Math.round(this.screenHeight * 0.15);
    const topBarWidth = Math.round(this.screenWidth * 0.25);

    switch (zone) {
      case 'smart_task_zone':
        // 需求 2.3: 左上角
        return {
          x: 0,
          y: 0,
          width: topBarWidth,
          height: topBarHeight,
        };

      case 'status_bar':
        // 需求 2.4: 右上角
        return {
          x: this.screenWidth - topBarWidth,
          y: 0,
          width: topBarWidth,
          height: topBarHeight,
        };

      case 'main_task_area':
        // 需求 2.2: 中央主要区域，位于顶部栏下方
        return {
          x: 0,
          y: topBarHeight + this.gap,
          width: this.screenWidth,
          height: this.screenHeight - topBarHeight - this.gap,
        };
    }
  }

  /**
   * 设置 Smart_Task_Zone 的显示模式。
   * compact: 紧凑模式（默认）
   * expanded: 展开模式
   */
  setSmartTaskMode(mode: 'compact' | 'expanded'): void {
    this.smartTaskMode = mode;
  }

  /** 获取当前 Smart_Task_Zone 模式 */
  getSmartTaskMode(): 'compact' | 'expanded' {
    return this.smartTaskMode;
  }

  /**
   * 检查两个分区是否存在遮挡/重叠。
   *
   * 需求 2.5: Smart_Task_Zone 和 Status_Bar 不遮挡 Main_Task_Area 核心内容
   * 需求 2.6: 三个分区之间有清晰的视觉边界
   */
  checkOverlap(zoneA: ScreenZone, zoneB: ScreenZone): boolean {
    if (zoneA === zoneB) return true;
    const a = this.getZoneBounds(zoneA);
    const b = this.getZoneBounds(zoneB);
    return rectsOverlap(a, b);
  }

  /**
   * 注册一个浮层到指定分区。
   * 返回浮层 ID，用于后续移除。
   */
  registerOverlay(overlay: OverlayConfig): string {
    const id = `overlay_${this.nextOverlayId++}`;
    this.overlays.set(id, { ...overlay, id });
    return id;
  }

  /** 移除指定 ID 的浮层 */
  removeOverlay(id: string): void {
    this.overlays.delete(id);
  }

  /** 获取指定分区的所有浮层（按 priority 降序） */
  getOverlaysForZone(zone: ScreenZone): StoredOverlay[] {
    return Array.from(this.overlays.values())
      .filter((o) => o.zone === zone)
      .sort((a, b) => b.priority - a.priority);
  }

  /** 获取所有已注册浮层数量 */
  getOverlayCount(): number {
    return this.overlays.size;
  }

  /** 获取屏幕尺寸 */
  getScreenSize(): { width: number; height: number } {
    return { width: this.screenWidth, height: this.screenHeight };
  }
}

/** 判断两个矩形是否重叠 */
function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
