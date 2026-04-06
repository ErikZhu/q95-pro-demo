export type AIStatus = 'idle' | 'listening' | 'thinking' | 'responding';

export interface Intent {
  name: string;
  target: 'local' | 'phone' | 'iot' | 'vehicle' | 'watch' | 'third_party';
  params: Record<string, unknown>;
}

export interface AssistantResponse {
  text: string;
  confidence: number;
  intent?: Intent;
  actions?: TaskAction[];
  needsConfirmation: boolean;
}

export interface TaskAction {
  actionId: string;
  type: string;
  params: Record<string, unknown>;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export type TaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';

/** Simulated audio stream for Demo purposes */
export interface AudioStream {
  /** Simulated transcript of the audio */
  transcript: string;
  /** Duration of the audio in ms */
  durationMs: number;
}
