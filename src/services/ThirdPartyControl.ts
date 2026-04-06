import type { TaskResult } from '../types/ai';

/**
 * App category types for third-party applications.
 */
export type AppCategory = 'social' | 'entertainment' | 'office';

/**
 * Simulated third-party app registration.
 */
export interface ThirdPartyApp {
  name: string;
  category: AppCategory;
  installed: boolean;
  supportsVoice: boolean;
  /** Keywords used to match voice intents to this app */
  keywords: string[];
}

/**
 * Voice Intent API — standardized interface for third-party voice control.
 * 需求: 10.4
 */
export interface VoiceIntent {
  /** Target app name (resolved by routing) */
  appName: string;
  /** The action to perform */
  action: string;
  /** Additional parameters for the action */
  params: Record<string, unknown>;
}

/**
 * Third_Party_Control 服务
 *
 * 模拟社交、娱乐、办公类三方应用的语音控制能力。
 * 需求: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */
export class ThirdPartyControlService {
  private apps: Map<string, ThirdPartyApp> = new Map();

  constructor() {
    this.initDefaultApps();
  }

  /**
   * Route a voice command to the correct app based on keyword matching.
   * 需求: 10.5
   */
  routeVoiceCommand(command: string): ThirdPartyApp | null {
    const cmd = command.toLowerCase();
    for (const app of this.apps.values()) {
      if (app.keywords.some((kw) => cmd.includes(kw))) {
        return app;
      }
    }
    return null;
  }

  /**
   * Execute a voice intent on a third-party app.
   * Handles routing, installation check, and voice support check.
   * 需求: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7
   */
  executeVoiceIntent(command: string): TaskResult {
    const app = this.routeVoiceCommand(command);

    if (!app) {
      return {
        taskId: '',
        success: false,
        message: `未识别目标应用，请尝试指定应用名称`,
        data: {
          suggestions: this.getSuggestions(command),
        },
      };
    }

    if (!app.installed) {
      return {
        taskId: '',
        success: false,
        message: `${app.name} 未安装`,
        data: {
          app: app.name,
          reason: 'not_installed',
          suggestions: this.getAlternatives(app),
        },
      };
    }

    if (!app.supportsVoice) {
      return {
        taskId: '',
        success: false,
        message: `${app.name} 不支持语音控制`,
        data: {
          app: app.name,
          reason: 'voice_not_supported',
          suggestions: this.getAlternatives(app),
        },
      };
    }

    // Simulate successful voice control execution
    const intent = this.parseIntent(app, command);
    return {
      taskId: '',
      success: true,
      message: `${app.name}: ${intent.action}`,
      data: {
        app: app.name,
        category: app.category,
        intent,
      },
    };
  }

  /**
   * Execute a structured VoiceIntent directly (Voice Intent API).
   * 需求: 10.4
   */
  executeIntent(intent: VoiceIntent): TaskResult {
    const app = this.apps.get(intent.appName);

    if (!app) {
      return {
        taskId: '',
        success: false,
        message: `未找到应用: ${intent.appName}`,
      };
    }

    if (!app.installed) {
      return {
        taskId: '',
        success: false,
        message: `${app.name} 未安装`,
        data: { reason: 'not_installed', suggestions: this.getAlternatives(app) },
      };
    }

    if (!app.supportsVoice) {
      return {
        taskId: '',
        success: false,
        message: `${app.name} 不支持语音控制`,
        data: { reason: 'voice_not_supported', suggestions: this.getAlternatives(app) },
      };
    }

    return {
      taskId: '',
      success: true,
      message: `${app.name}: ${intent.action}`,
      data: { app: app.name, intent },
    };
  }

  /** Get all registered apps */
  getApps(): ThirdPartyApp[] {
    return Array.from(this.apps.values());
  }

  /** Get apps by category */
  getAppsByCategory(category: AppCategory): ThirdPartyApp[] {
    return this.getApps().filter((a) => a.category === category);
  }

  /** Register an app (for testing) */
  registerApp(app: ThirdPartyApp): void {
    this.apps.set(app.name, app);
  }

  // --- Private helpers ---

  private parseIntent(app: ThirdPartyApp, command: string): VoiceIntent {
    const cmd = command.toLowerCase();
    let action = '打开';
    const params: Record<string, unknown> = {};

    if (app.category === 'social') {
      if (cmd.includes('发') && cmd.includes('微信')) {
        action = '发送消息';
        const toMatch = cmd.match(/给(.+?)发/);
        if (toMatch) params.to = toMatch[1];
        const msgMatch = cmd.match(/说(.+)/);
        if (msgMatch) params.message = msgMatch[1];
      } else if (cmd.includes('朋友圈')) {
        action = '查看朋友圈';
      } else if (cmd.includes('打开')) {
        action = '打开应用';
      }
    }

    if (app.category === 'entertainment') {
      if (cmd.includes('播放') || cmd.includes('放')) {
        action = '播放';
        const songMatch = cmd.match(/播放(.+?)的/) || cmd.match(/放(.+?)的/);
        if (songMatch) params.query = songMatch[1];
        const artistMatch = cmd.match(/的(.+)/);
        if (artistMatch) params.artist = artistMatch[1];
        if (!songMatch && !artistMatch) {
          const generalMatch = cmd.match(/播放(.+)/) || cmd.match(/放(.+)/);
          if (generalMatch) params.query = generalMatch[1].trim();
        }
      } else if (cmd.includes('打开')) {
        action = '打开应用';
      }
    }

    if (app.category === 'office') {
      if (cmd.includes('日程') || cmd.includes('会议')) {
        action = '查看日程';
      } else if (cmd.includes('备忘') || cmd.includes('记录')) {
        action = '创建备忘';
        const noteMatch = cmd.match(/记录(.+)/) || cmd.match(/备忘(.+)/);
        if (noteMatch) params.content = noteMatch[1].trim();
      }
    }

    return { appName: app.name, action, params };
  }

  private getSuggestions(command: string): string[] {
    const suggestions: string[] = [];
    const cmd = command.toLowerCase();
    if (cmd.includes('消息') || cmd.includes('聊天') || cmd.includes('发')) {
      suggestions.push('微信', '抖音');
    }
    if (cmd.includes('音乐') || cmd.includes('播放') || cmd.includes('歌')) {
      suggestions.push('音乐播放器', '视频播放器');
    }
    if (cmd.includes('日程') || cmd.includes('备忘') || cmd.includes('会议')) {
      suggestions.push('日程管理', '备忘录');
    }
    if (suggestions.length === 0) {
      suggestions.push('微信', '音乐播放器', '日程管理');
    }
    return suggestions;
  }

  private getAlternatives(app: ThirdPartyApp): string[] {
    return this.getApps()
      .filter((a) => a.category === app.category && a.name !== app.name && a.installed && a.supportsVoice)
      .map((a) => a.name);
  }

  private initDefaultApps(): void {
    const defaults: ThirdPartyApp[] = [
      // 社交类 (需求 10.1)
      { name: '微信', category: 'social', installed: true, supportsVoice: true, keywords: ['微信', '朋友圈'] },
      { name: '抖音', category: 'social', installed: true, supportsVoice: true, keywords: ['抖音', '短视频'] },
      // 娱乐类 (需求 10.2)
      { name: '音乐播放器', category: 'entertainment', installed: true, supportsVoice: true, keywords: ['音乐', '歌', '播放'] },
      { name: '视频播放器', category: 'entertainment', installed: true, supportsVoice: true, keywords: ['视频', '电影', '看'] },
      // 办公类 (需求 10.3)
      { name: '日程管理', category: 'office', installed: true, supportsVoice: true, keywords: ['日程', '会议', '安排'] },
      { name: '备忘录', category: 'office', installed: true, supportsVoice: true, keywords: ['备忘', '记录', '笔记'] },
    ];
    for (const app of defaults) {
      this.apps.set(app.name, app);
    }
  }
}
