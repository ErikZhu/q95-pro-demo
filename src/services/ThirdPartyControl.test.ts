import { describe, it, expect, beforeEach } from 'vitest';
import { ThirdPartyControlService } from './ThirdPartyControl';

describe('ThirdPartyControlService', () => {
  let svc: ThirdPartyControlService;

  beforeEach(() => {
    svc = new ThirdPartyControlService();
  });

  describe('routeVoiceCommand (requirement 10.5)', () => {
    it('routes social command to 微信', () => {
      const app = svc.routeVoiceCommand('给张三发微信说我到了');
      expect(app).not.toBeNull();
      expect(app!.name).toBe('微信');
      expect(app!.category).toBe('social');
    });

    it('routes entertainment command to 音乐播放器', () => {
      const app = svc.routeVoiceCommand('播放周杰伦的歌');
      expect(app).not.toBeNull();
      expect(app!.name).toBe('音乐播放器');
      expect(app!.category).toBe('entertainment');
    });

    it('routes office command to 日程管理', () => {
      const app = svc.routeVoiceCommand('打开今天的会议日程');
      expect(app).not.toBeNull();
      expect(app!.name).toBe('日程管理');
      expect(app!.category).toBe('office');
    });

    it('returns null for unrecognized command', () => {
      const app = svc.routeVoiceCommand('做一些完全无关的事情');
      expect(app).toBeNull();
    });
  });

  describe('executeVoiceIntent — social apps (requirement 10.1)', () => {
    it('sends a WeChat message', () => {
      const result = svc.executeVoiceIntent('给张三发微信说我到了');
      expect(result.success).toBe(true);
      expect(result.data?.app).toBe('微信');
      expect(result.data?.category).toBe('social');
    });

    it('views moments', () => {
      const result = svc.executeVoiceIntent('查看最新朋友圈');
      expect(result.success).toBe(true);
      expect(result.data?.app).toBe('微信');
    });

    it('opens 抖音', () => {
      const result = svc.executeVoiceIntent('打开抖音');
      expect(result.success).toBe(true);
      expect(result.data?.app).toBe('抖音');
    });
  });

  describe('executeVoiceIntent — entertainment apps (requirement 10.2)', () => {
    it('plays music', () => {
      const result = svc.executeVoiceIntent('播放周杰伦的歌');
      expect(result.success).toBe(true);
      expect(result.data?.app).toBe('音乐播放器');
    });

    it('opens video player', () => {
      const result = svc.executeVoiceIntent('打开视频看电影');
      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('entertainment');
    });
  });

  describe('executeVoiceIntent — office apps (requirement 10.3)', () => {
    it('opens meeting schedule', () => {
      const result = svc.executeVoiceIntent('打开今天的会议日程');
      expect(result.success).toBe(true);
      expect(result.data?.app).toBe('日程管理');
    });

    it('creates a memo', () => {
      const result = svc.executeVoiceIntent('记录一条备忘买牛奶');
      expect(result.success).toBe(true);
      expect(result.data?.app).toBe('备忘录');
    });
  });

  describe('executeVoiceIntent — not installed / not supported (requirement 10.6)', () => {
    it('returns failure with alternatives when app is not installed', () => {
      svc.registerApp({
        name: 'QQ',
        category: 'social',
        installed: false,
        supportsVoice: true,
        keywords: ['qq'],
      });
      const result = svc.executeVoiceIntent('打开qq聊天');
      expect(result.success).toBe(false);
      expect(result.message).toContain('未安装');
      expect(result.data?.reason).toBe('not_installed');
      expect(Array.isArray(result.data?.suggestions)).toBe(true);
    });

    it('returns failure with alternatives when app does not support voice', () => {
      svc.registerApp({
        name: '计算器',
        category: 'office',
        installed: true,
        supportsVoice: false,
        keywords: ['计算'],
      });
      const result = svc.executeVoiceIntent('打开计算器');
      expect(result.success).toBe(false);
      expect(result.message).toContain('不支持语音控制');
      expect(result.data?.reason).toBe('voice_not_supported');
      expect(Array.isArray(result.data?.suggestions)).toBe(true);
    });

    it('returns failure with suggestions for unrecognized command', () => {
      const result = svc.executeVoiceIntent('做一些完全无关的事情');
      expect(result.success).toBe(false);
      expect(result.message).toContain('未识别');
      expect(Array.isArray(result.data?.suggestions)).toBe(true);
    });
  });

  describe('executeIntent — Voice Intent API (requirement 10.4)', () => {
    it('executes a structured intent successfully', () => {
      const result = svc.executeIntent({
        appName: '微信',
        action: '发送消息',
        params: { to: '张三', message: '你好' },
      });
      expect(result.success).toBe(true);
      expect(result.data?.app).toBe('微信');
    });

    it('fails for unknown app', () => {
      const result = svc.executeIntent({
        appName: '不存在的应用',
        action: '打开',
        params: {},
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('未找到应用');
    });

    it('fails for uninstalled app', () => {
      svc.registerApp({
        name: '测试应用',
        category: 'social',
        installed: false,
        supportsVoice: true,
        keywords: ['测试'],
      });
      const result = svc.executeIntent({
        appName: '测试应用',
        action: '打开',
        params: {},
      });
      expect(result.success).toBe(false);
      expect(result.data?.reason).toBe('not_installed');
    });

    it('fails for app without voice support', () => {
      svc.registerApp({
        name: '无语音应用',
        category: 'office',
        installed: true,
        supportsVoice: false,
        keywords: ['无语音'],
      });
      const result = svc.executeIntent({
        appName: '无语音应用',
        action: '打开',
        params: {},
      });
      expect(result.success).toBe(false);
      expect(result.data?.reason).toBe('voice_not_supported');
    });
  });

  describe('getApps / getAppsByCategory', () => {
    it('returns all default apps', () => {
      const apps = svc.getApps();
      expect(apps.length).toBe(6);
    });

    it('filters by social category', () => {
      const social = svc.getAppsByCategory('social');
      expect(social.length).toBe(2);
      expect(social.map((a) => a.name)).toContain('微信');
      expect(social.map((a) => a.name)).toContain('抖音');
    });

    it('filters by entertainment category', () => {
      const ent = svc.getAppsByCategory('entertainment');
      expect(ent.length).toBe(2);
    });

    it('filters by office category', () => {
      const office = svc.getAppsByCategory('office');
      expect(office.length).toBe(2);
    });

    it('includes custom registered apps', () => {
      svc.registerApp({
        name: '自定义应用',
        category: 'social',
        installed: true,
        supportsVoice: true,
        keywords: ['自定义'],
      });
      expect(svc.getApps().length).toBe(7);
      expect(svc.getAppsByCategory('social').length).toBe(3);
    });
  });

  describe('Smart_Task_Zone format (requirement 10.7)', () => {
    it('returns TaskResult with taskId, success, message, and data', () => {
      const result = svc.executeVoiceIntent('播放音乐');
      expect(result).toHaveProperty('taskId');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
    });
  });
});
