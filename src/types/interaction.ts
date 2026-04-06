export type InputSource =
  | 'side_touchpad'
  | 'voice'
  | 'emg_band'
  | 'camera_gesture'
  | 'head_tracking'
  | 'physical_button';

export interface PriorityRule {
  sources: InputSource[];
  priority: number;
  context?: string;
}

export interface InputEvent {
  source: InputSource;
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ProcessedAction {
  action: string;
  source: InputSource;
  latency: number;
  conflictResolved: boolean;
}
