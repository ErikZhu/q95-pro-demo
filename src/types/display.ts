export interface DisplaySpec {
  resolution: { width: number; height: number }; // per eye
  maxBrightness: number; // nits
  refreshRate: number; // Hz
  fov: number; // degrees
  panelType: 'MicroOLED' | 'MicroLED' | 'LCoS';
}

export type ScreenZone = 'main_task_area' | 'smart_task_zone' | 'status_bar';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlayConfig {
  zone: ScreenZone;
  opacity: number; // 0-1
  priority: number;
  content: unknown; // RenderNode placeholder
}
