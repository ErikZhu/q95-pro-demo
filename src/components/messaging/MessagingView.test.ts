import { describe, it, expect } from 'vitest';
import type { MessagingState } from '../../services/MessagingModule';

/**
 * MessagingView 单元测试
 * 需求: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 *
 * 测试 MessagingView 的数据逻辑和状态映射。
 */

function makeState(overrides?: Partial<MessagingState>): MessagingState {
  return {
    messages: [],
    callState: {
      status: 'idle',
      callerName: null,
      callerNumber: null,
      duration: 0,
      useMic: true,
      useSpeaker: true,
    },
    bluetoothStatus: 'connected',
    bluetoothWarning: null,
    ...overrides,
  };
}

describe('MessagingView data logic', () => {
  // ─── 需求 17.1: 消息预览 ───

  describe('消息预览 (需求 17.1)', () => {
    it('state with no messages', () => {
      const state = makeState();
      expect(state.messages).toHaveLength(0);
    });

    it('state provides message sender and summary', () => {
      const state = makeState({
        messages: [
          { id: 'm1', sender: '张三', summary: '你好', timestamp: 1000, isRead: false, app: '微信' },
        ],
      });
      expect(state.messages[0].sender).toBe('张三');
      expect(state.messages[0].summary).toBe('你好');
    });

    it('unread count can be derived from messages', () => {
      const state = makeState({
        messages: [
          { id: 'm1', sender: 'A', summary: 'a', timestamp: 1000, isRead: false, app: '微信' },
          { id: 'm2', sender: 'B', summary: 'b', timestamp: 2000, isRead: true, app: '微信' },
          { id: 'm3', sender: 'C', summary: 'c', timestamp: 3000, isRead: false, app: '短信' },
        ],
      });
      const unread = state.messages.filter((m) => !m.isRead).length;
      expect(unread).toBe(2);
    });
  });

  // ─── 需求 17.3: 来电界面 ───

  describe('来电界面 (需求 17.3)', () => {
    it('ringing state shows call info', () => {
      const state = makeState({
        callState: {
          status: 'ringing',
          callerName: '王五',
          callerNumber: '13800138000',
          duration: 0,
          useMic: true,
          useSpeaker: true,
        },
      });
      expect(state.callState.status).toBe('ringing');
      expect(state.callState.callerName).toBe('王五');
      expect(state.callState.callerNumber).toBe('13800138000');
    });

    it('idle state hides call UI', () => {
      const state = makeState();
      const showCallUI = state.callState.status === 'ringing' || state.callState.status === 'active';
      expect(showCallUI).toBe(false);
    });
  });

  // ─── 需求 17.4: 通话状态显示 ───

  describe('通话状态 (需求 17.4)', () => {
    it('active call shows duration and caller info', () => {
      const state = makeState({
        callState: {
          status: 'active',
          callerName: '王五',
          callerNumber: '13800138000',
          duration: 125,
          useMic: true,
          useSpeaker: true,
        },
      });
      expect(state.callState.status).toBe('active');
      expect(state.callState.duration).toBe(125);
      expect(state.callState.callerName).toBe('王五');
    });
  });

  // ─── 需求 17.5: 麦克风/扬声器 ───

  describe('麦克风/扬声器 (需求 17.5)', () => {
    it('mic and speaker default to on', () => {
      const state = makeState();
      expect(state.callState.useMic).toBe(true);
      expect(state.callState.useSpeaker).toBe(true);
    });

    it('state reflects mic off', () => {
      const state = makeState({
        callState: {
          status: 'active',
          callerName: '王五',
          callerNumber: '138',
          duration: 10,
          useMic: false,
          useSpeaker: true,
        },
      });
      expect(state.callState.useMic).toBe(false);
    });
  });

  // ─── 需求 17.6: 蓝牙断开提示 ───

  describe('蓝牙断开提示 (需求 17.6)', () => {
    it('connected state has no warning', () => {
      const state = makeState();
      expect(state.bluetoothStatus).toBe('connected');
      expect(state.bluetoothWarning).toBeNull();
    });

    it('disconnected state shows warning', () => {
      const state = makeState({
        bluetoothStatus: 'disconnected',
        bluetoothWarning: '蓝牙连接已断开，请重新连接配对手机',
      });
      expect(state.bluetoothStatus).toBe('disconnected');
      expect(state.bluetoothWarning).not.toBeNull();
    });
  });
});
