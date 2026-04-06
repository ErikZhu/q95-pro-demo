/**
 * Teleprompter — 提词器服务
 *
 * 文本加载、自动滚动速度控制、暂停/恢复、从配对手机导入文本。
 * Demo 中使用模拟数据。
 *
 * 需求: 15.1, 15.2, 15.3, 15.4, 15.5
 */

/** 默认滚动速度（行/秒） */
const DEFAULT_SCROLL_SPEED = 2;
/** 最小滚动速度 */
const MIN_SCROLL_SPEED = 0.5;
/** 最大滚动速度 */
const MAX_SCROLL_SPEED = 10;
/** 默认字体大小（px） */
const DEFAULT_FONT_SIZE = 24;
/** 最小字体大小 */
const MIN_FONT_SIZE = 12;
/** 最大字体大小 */
const MAX_FONT_SIZE = 72;
/** 滚动更新间隔（ms） */
const SCROLL_INTERVAL = 100;
/** 每次滚动的像素基数 — 乘以速度得到实际像素 */
const SCROLL_PIXEL_BASE = 3;

export type TeleprompterStatus = 'idle' | 'playing' | 'paused';

export interface TeleprompterState {
  status: TeleprompterStatus;
  text: string;
  scrollPosition: number; // pixels from top
  scrollSpeed: number; // lines per second
  fontSize: number; // px
  opacity: number; // 0-1, for semi-transparent overlay
  phoneConnected: boolean;
}

export class Teleprompter {
  private status: TeleprompterStatus = 'idle';
  private text = '';
  private scrollPosition = 0;
  private scrollSpeed: number = DEFAULT_SCROLL_SPEED;
  private fontSize: number = DEFAULT_FONT_SIZE;
  private opacity = 0.85;
  private phoneConnected = false;
  private scrollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options?: {
    scrollSpeed?: number;
    fontSize?: number;
    opacity?: number;
  }) {
    if (options?.scrollSpeed != null) this.setScrollSpeed(options.scrollSpeed);
    if (options?.fontSize != null) this.setFontSize(options.fontSize);
    if (options?.opacity != null) this.setOpacity(options.opacity);
  }

  // ─── 文本加载 — 需求 15.1 ───

  /** 加载文本内容 */
  loadText(text: string): void {
    if (!text.trim()) {
      throw new Error('文本内容不能为空');
    }
    this.text = text;
    this.scrollPosition = 0;
    this.status = 'idle';
    this.stopScrollTimer();
  }

  /** 获取已加载的文本 */
  getText(): string {
    return this.text;
  }

  /** 是否已加载文本 */
  hasText(): boolean {
    return this.text.trim().length > 0;
  }

  // ─── 播放控制 — 需求 15.2, 15.5 ───

  /** 开始/恢复自动滚动 */
  play(): void {
    if (!this.hasText()) {
      throw new Error('请先加载文本');
    }
    this.status = 'playing';
    this.startScrollTimer();
  }

  /** 暂停滚动 — 需求 15.5: 立即停止滚动并保持当前位置 */
  pause(): void {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.stopScrollTimer();
  }

  /** 停止并重置到开头 */
  stop(): void {
    this.status = 'idle';
    this.scrollPosition = 0;
    this.stopScrollTimer();
  }

  /** 切换播放/暂停 */
  togglePlayPause(): void {
    if (this.status === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  // ─── 滚动速度控制 — 需求 15.2 ───

  /** 设置滚动速度（行/秒），可通过 Side_Touchpad 调节 */
  setScrollSpeed(speed: number): void {
    this.scrollSpeed = Math.max(MIN_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, speed));
  }

  /** 获取当前滚动速度 */
  getScrollSpeed(): number {
    return this.scrollSpeed;
  }

  /** 增加滚动速度（Side_Touchpad 上滑） */
  increaseSpeed(delta = 0.5): void {
    this.setScrollSpeed(this.scrollSpeed + delta);
  }

  /** 减少滚动速度（Side_Touchpad 下滑） */
  decreaseSpeed(delta = 0.5): void {
    this.setScrollSpeed(this.scrollSpeed - delta);
  }

  /** 获取速度范围 */
  getSpeedRange(): { min: number; max: number } {
    return { min: MIN_SCROLL_SPEED, max: MAX_SCROLL_SPEED };
  }

  // ─── 字体大小 — 需求 15.1 ───

  /** 设置字体大小（px） */
  setFontSize(size: number): void {
    this.fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
  }

  /** 获取字体大小 */
  getFontSize(): number {
    return this.fontSize;
  }

  /** 获取字体大小范围 */
  getFontSizeRange(): { min: number; max: number } {
    return { min: MIN_FONT_SIZE, max: MAX_FONT_SIZE };
  }

  // ─── 半透明显示 — 需求 15.3 ───

  /** 设置显示透明度 (0-1) */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /** 获取显示透明度 */
  getOpacity(): number {
    return this.opacity;
  }

  // ─── 滚动位置 ───

  /** 获取当前滚动位置（px） */
  getScrollPosition(): number {
    return this.scrollPosition;
  }

  /** 手动设置滚动位置 */
  setScrollPosition(position: number): void {
    this.scrollPosition = Math.max(0, position);
  }

  // ─── 手机导入 — 需求 15.4 ───

  /** 连接配对手机 */
  connectPhone(): void {
    this.phoneConnected = true;
  }

  /** 断开配对手机 */
  disconnectPhone(): void {
    this.phoneConnected = false;
  }

  /** 是否已连接手机 */
  isPhoneConnected(): boolean {
    return this.phoneConnected;
  }

  /** 从配对手机导入文本 — 需求 15.4 */
  importFromPhone(text: string): void {
    if (!this.phoneConnected) {
      throw new Error('未连接配对手机');
    }
    if (!text.trim()) {
      throw new Error('导入文本不能为空');
    }
    this.loadText(text);
  }

  // ─── 状态查询 ───

  /** 获取当前状态 */
  getStatus(): TeleprompterStatus {
    return this.status;
  }

  /** 获取完整状态 */
  getState(): TeleprompterState {
    return {
      status: this.status,
      text: this.text,
      scrollPosition: this.scrollPosition,
      scrollSpeed: this.scrollSpeed,
      fontSize: this.fontSize,
      opacity: this.opacity,
      phoneConnected: this.phoneConnected,
    };
  }

  /** 清理资源 */
  dispose(): void {
    this.stop();
    this.text = '';
  }

  // ─── 内部方法 ───

  private startScrollTimer(): void {
    this.stopScrollTimer();
    this.scrollTimer = setInterval(() => {
      if (this.status === 'playing') {
        this.scrollPosition += this.scrollSpeed * SCROLL_PIXEL_BASE * (SCROLL_INTERVAL / 1000);
      }
    }, SCROLL_INTERVAL);
  }

  private stopScrollTimer(): void {
    if (this.scrollTimer) {
      clearInterval(this.scrollTimer);
      this.scrollTimer = null;
    }
  }
}
