import type { AIStatus, AssistantResponse, AudioStream, Intent, TaskAction } from '../types/ai';

/** 唤醒词激活最大延迟 (需求 8.1) */
const MAX_ACTIVATION_MS = 500;
/** 语音响应最大延迟 (需求 8.2) */
const MAX_RESPONSE_MS = 2000;
/** 无输入自动退出超时 (需求 8.7) */
const DEFAULT_IDLE_TIMEOUT_MS = 5000;
/** 低置信度阈值 (需求 8.6) */
const CONFIDENCE_THRESHOLD = 0.6;

export interface AIAssistantCallbacks {
  onStatusChange?: (status: AIStatus) => void;
  onDeactivated?: (reason: 'timeout' | 'manual') => void;
}

/**
 * 模拟 Intent 解析结果，用于 Demo 中的自然语言理解模拟
 */
interface IntentMapping {
  keywords: string[];
  intent: Intent;
  actions: TaskAction[];
}

/** 预定义的 Intent 映射表 (需求 8.3, 8.5) */
const INTENT_MAPPINGS: IntentMapping[] = [
  {
    keywords: ['打开', '启动', '亮度', '音量', '静音', '拍照', '录像'],
    intent: { name: 'device_control', target: 'local', params: {} },
    actions: [{ actionId: 'local-action', type: 'device_control', params: {} }],
  },
  {
    keywords: ['播放', '暂停', '下一曲', '上一曲', '日程', '电话', '拨打'],
    intent: { name: 'phone_control', target: 'phone', params: {} },
    actions: [{ actionId: 'phone-action', type: 'phone_control', params: {} }],
  },
  {
    keywords: ['空调', '灯', '窗帘', '回家模式', '离家模式', '智能家居'],
    intent: { name: 'iot_control', target: 'iot', params: {} },
    actions: [{ actionId: 'iot-action', type: 'iot_control', params: {} }],
  },
  {
    keywords: ['车', '车窗', '车门', '导航发送到车机', '预热'],
    intent: { name: 'vehicle_control', target: 'vehicle', params: {} },
    actions: [{ actionId: 'vehicle-action', type: 'vehicle_control', params: {} }],
  },
  {
    keywords: ['手表', '步数', '心率', '运动记录'],
    intent: { name: 'watch_control', target: 'watch', params: {} },
    actions: [{ actionId: 'watch-action', type: 'watch_control', params: {} }],
  },
  {
    keywords: ['微信', '抖音', '朋友圈', '备忘', '会议'],
    intent: { name: 'third_party_control', target: 'third_party', params: {} },
    actions: [{ actionId: 'third-party-action', type: 'app_control', params: {} }],
  },
];

/**
 * AIAssistant 服务
 *
 * Demo 模拟实现：所有 AI 处理通过预定义映射和延时模拟。
 *
 * 需求: 8.1 (唤醒词 500ms 内激活)
 * 需求: 8.2 (语音响应 2 秒内返回)
 * 需求: 8.3 (自然语言理解)
 * 需求: 8.5 (控制系统功能)
 * 需求: 8.6 (低置信度确认)
 * 需求: 8.7 (5 秒无输入自动退出)
 */
export class AIAssistant {
  private status: AIStatus = 'idle';
  private wakeWord: string = '你好小Q';
  private idleTimeoutMs: number = DEFAULT_IDLE_TIMEOUT_MS;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: AIAssistantCallbacks = {};

  constructor(callbacks?: AIAssistantCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  setCallbacks(callbacks: AIAssistantCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /** 需求 8.1: 唤醒词检测后 500ms 内激活 */
  async activate(): Promise<void> {
    if (this.status !== 'idle') return;

    // 模拟唤醒词检测延迟 (保证 < 500ms)
    const activationDelay = Math.min(
      Math.floor(Math.random() * 300) + 100,
      MAX_ACTIVATION_MS - 1,
    );
    await this.delay(activationDelay);

    this.setStatus('listening');
    this.resetIdleTimer();
  }

  /** 停用助手 */
  deactivate(): void {
    this.clearIdleTimer();
    this.setStatus('idle');
    this.callbacks.onDeactivated?.('manual');
  }

  /** 获取当前状态 */
  getStatus(): AIStatus {
    return this.status;
  }

  /** 需求 8.1: 设置唤醒词 */
  setWakeWord(word: string): void {
    this.wakeWord = word;
  }

  /** 获取当前唤醒词 */
  getWakeWord(): string {
    return this.wakeWord;
  }

  /** 需求 8.7: 设置无输入超时时间 */
  setIdleTimeout(ms: number): void {
    this.idleTimeoutMs = ms;
    // 如果当前正在监听，重置定时器
    if (this.status === 'listening') {
      this.resetIdleTimer();
    }
  }

  /** 获取当前超时设置 */
  getIdleTimeout(): number {
    return this.idleTimeoutMs;
  }

  /**
   * 需求 8.2, 8.3, 8.6: 处理语音输入
   * - 2 秒内返回响应
   * - 自然语言理解 (Intent 解析)
   * - 低置信度时请求确认
   */
  async processVoice(audioStream: AudioStream): Promise<AssistantResponse> {
    if (this.status === 'idle') {
      await this.activate();
    }

    this.clearIdleTimer();
    this.setStatus('thinking');

    // 模拟处理延迟 (保证 < 2000ms)
    const processingDelay = Math.min(
      Math.floor(Math.random() * 800) + 200,
      MAX_RESPONSE_MS - 1,
    );
    await this.delay(processingDelay);

    const response = this.generateResponse(audioStream.transcript);

    this.setStatus('responding');

    // 短暂的响应展示后回到监听状态
    await this.delay(100);
    this.setStatus('listening');
    this.resetIdleTimer();

    return response;
  }

  /**
   * 需求 8.2, 8.3, 8.6: 处理文本输入
   */
  async processText(text: string): Promise<AssistantResponse> {
    if (this.status === 'idle') {
      await this.activate();
    }

    this.clearIdleTimer();
    this.setStatus('thinking');

    // 模拟处理延迟 (保证 < 2000ms)
    const processingDelay = Math.min(
      Math.floor(Math.random() * 600) + 100,
      MAX_RESPONSE_MS - 1,
    );
    await this.delay(processingDelay);

    const response = this.generateResponse(text);

    this.setStatus('responding');

    await this.delay(100);
    this.setStatus('listening');
    this.resetIdleTimer();

    return response;
  }

  /**
   * 需求 8.3: 自然语言理解模拟 — Intent 解析和路由
   * 需求 8.6: 低置信度确认请求逻辑
   */
  private generateResponse(text: string): AssistantResponse {
    const matchedMapping = this.matchIntent(text);

    if (!matchedMapping) {
      // 无法识别意图 — 低置信度
      return {
        text: `抱歉，我不太理解"${text}"，请您再说一次或换个说法。`,
        confidence: 0.3,
        needsConfirmation: true,
      };
    }

    const confidence = this.calculateConfidence(text, matchedMapping);
    const intent: Intent = {
      ...matchedMapping.intent,
      params: { ...matchedMapping.intent.params, rawText: text },
    };

    // 需求 8.6: 低置信度时请求确认
    if (confidence < CONFIDENCE_THRESHOLD) {
      return {
        text: `您是想${this.describeIntent(intent)}吗？请确认。`,
        confidence,
        intent,
        actions: matchedMapping.actions,
        needsConfirmation: true,
      };
    }

    return {
      text: this.generateResponseText(intent, text),
      confidence,
      intent,
      actions: matchedMapping.actions,
      needsConfirmation: false,
    };
  }

  /** 匹配 Intent */
  private matchIntent(text: string): IntentMapping | null {
    let bestMatch: IntentMapping | null = null;
    let bestScore = 0;

    for (const mapping of INTENT_MAPPINGS) {
      let score = 0;
      for (const keyword of mapping.keywords) {
        if (text.includes(keyword)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = mapping;
      }
    }

    return bestMatch;
  }

  /** 计算置信度 */
  private calculateConfidence(text: string, mapping: IntentMapping): number {
    let matchedKeywords = 0;
    for (const keyword of mapping.keywords) {
      if (text.includes(keyword)) {
        matchedKeywords++;
      }
    }

    // 基础置信度 + 关键词匹配加成
    const base = 0.5;
    const keywordBonus = Math.min(matchedKeywords * 0.15, 0.45);
    // 较长的输入文本略微降低置信度（模拟模糊指令）
    const lengthPenalty = text.length > 20 ? 0.05 : 0;

    return Math.min(base + keywordBonus - lengthPenalty, 1.0);
  }

  /** 描述 Intent（用于确认提示） */
  private describeIntent(intent: Intent): string {
    const targetNames: Record<string, string> = {
      local: '控制眼镜设备',
      phone: '操作手机',
      iot: '控制智能家居',
      vehicle: '操作车辆',
      watch: '操作手表',
      third_party: '使用第三方应用',
    };
    return targetNames[intent.target] ?? '执行操作';
  }

  /** 生成响应文本 */
  private generateResponseText(intent: Intent, rawText: string): string {
    const responses: Record<string, string> = {
      local: `好的，正在为您${rawText}。`,
      phone: `正在通过手机${rawText}。`,
      iot: `正在控制智能家居：${rawText}。`,
      vehicle: `正在执行车辆操作：${rawText}。`,
      watch: `正在通过手表${rawText}。`,
      third_party: `正在打开应用执行：${rawText}。`,
    };
    return responses[intent.target] ?? `正在处理：${rawText}。`;
  }

  /** 设置状态并触发回调 */
  private setStatus(status: AIStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.callbacks.onStatusChange?.(status);
    }
  }

  /** 需求 8.7: 重置无输入超时定时器 */
  private resetIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      if (this.status === 'listening') {
        this.setStatus('idle');
        this.callbacks.onDeactivated?.('timeout');
      }
    }, this.idleTimeoutMs);
  }

  /** 清除超时定时器 */
  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /** 工具方法：延时 */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** 销毁，清理定时器 */
  destroy(): void {
    this.clearIdleTimer();
    this.status = 'idle';
  }
}

export { MAX_ACTIVATION_MS, MAX_RESPONSE_MS, DEFAULT_IDLE_TIMEOUT_MS, CONFIDENCE_THRESHOLD };
