import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MessagingModule } from './MessagingModule';

/**
 * MessagingModule 单元测试
 * 需求: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

describe('MessagingModule', () => {
  let mm: MessagingModule;

  beforeEach(() => {
    mm = new MessagingModule();
  });

  afterEach(() => {
    mm.dispose();
  });

  // ─── 初始状态 ───

  describe('初始状态', () => {
    it('starts with no messages', () => {
      expect(mm.getMessages()).toHaveLength(0);
    });

    it('starts with idle call state', () => {
      const cs = mm.getCallState();
      expect(cs.status).toBe('idle');
      expect(cs.callerName).toBeNull();
      expect(cs.duration).toBe(0);
    });

    it('starts with bluetooth connected', () => {
      expect(mm.getBluetoothStatus()).toBe('connected');
      expect(mm.getBluetoothWarning()).toBeNull();
    });
  });

  // ─── 消息接收与预览 — 需求 17.1 ───

  describe('消息接收与预览 (需求 17.1)', () => {
    it('receives and stores a message', () => {
      mm.receiveMessage({ id: 'm1', sender: '张三', summary: '你好', timestamp: 1000, app: '微信' });
      expect(mm.getMessages()).toHaveLength(1);
      expect(mm.getMessages()[0].sender).toBe('张三');
    });

    it('messages are sorted newest first', () => {
      mm.receiveMessage({ id: 'm1', sender: 'A', summary: 'old', timestamp: 1000, app: '微信' });
      mm.receiveMessage({ id: 'm2', sender: 'B', summary: 'new', timestamp: 2000, app: '微信' });
      const msgs = mm.getMessages();
      expect(msgs[0].id).toBe('m2');
      expect(msgs[1].id).toBe('m1');
    });

    it('new messages are unread by default', () => {
      mm.receiveMessage({ id: 'm1', sender: '张三', summary: '你好', timestamp: 1000, app: '微信' });
      expect(mm.getUnreadMessages()).toHaveLength(1);
    });

    it('getLatestPreview returns sender and summary', () => {
      mm.receiveMessage({ id: 'm1', sender: '李四', summary: '开会了', timestamp: 1000, app: '短信' });
      const preview = mm.getLatestPreview();
      expect(preview).not.toBeNull();
      expect(preview!.sender).toBe('李四');
      expect(preview!.summary).toBe('开会了');
    });

    it('getLatestPreview returns null when no unread', () => {
      expect(mm.getLatestPreview()).toBeNull();
    });

    it('marks message as read', () => {
      mm.receiveMessage({ id: 'm1', sender: '张三', summary: '你好', timestamp: 1000, app: '微信' });
      mm.markAsRead('m1');
      expect(mm.getUnreadMessages()).toHaveLength(0);
    });
  });

  // ─── 语音回复 — 需求 17.2 ───

  describe('语音回复 (需求 17.2)', () => {
    it('replies to a message by voice', () => {
      mm.receiveMessage({ id: 'm1', sender: '张三', summary: '你好', timestamp: 1000, app: '微信' });
      const reply = mm.replyByVoice('m1', '好的，马上到');
      expect(reply).not.toBeNull();
      expect(reply!.sender).toBe('我');
      expect(reply!.summary).toBe('好的，马上到');
      expect(reply!.app).toBe('微信');
    });

    it('returns null when replying to non-existent message', () => {
      expect(mm.replyByVoice('nonexistent', 'hello')).toBeNull();
    });

    it('reply is added to messages list', () => {
      mm.receiveMessage({ id: 'm1', sender: '张三', summary: '你好', timestamp: 1000, app: '微信' });
      mm.replyByVoice('m1', '收到');
      expect(mm.getMessages()).toHaveLength(2);
    });
  });

  // ─── 来电处理 — 需求 17.3 ───

  describe('来电处理 (需求 17.3)', () => {
    const call = { callId: 'c1', callerName: '王五', callerNumber: '13800138000', timestamp: Date.now() };

    it('incoming call sets ringing status', () => {
      mm.onIncomingCall(call);
      const cs = mm.getCallState();
      expect(cs.status).toBe('ringing');
      expect(cs.callerName).toBe('王五');
      expect(cs.callerNumber).toBe('13800138000');
    });

    it('accept call transitions to active', () => {
      mm.onIncomingCall(call);
      mm.acceptCall();
      expect(mm.getCallState().status).toBe('active');
    });

    it('reject call transitions to idle', () => {
      mm.onIncomingCall(call);
      mm.rejectCall();
      const cs = mm.getCallState();
      expect(cs.status).toBe('idle');
      expect(cs.callerName).toBeNull();
    });

    it('cannot accept when not ringing', () => {
      mm.acceptCall();
      expect(mm.getCallState().status).toBe('idle');
    });

    it('cannot reject when not ringing', () => {
      mm.rejectCall();
      expect(mm.getCallState().status).toBe('idle');
    });

    it('ignores new call while active', () => {
      mm.onIncomingCall(call);
      mm.acceptCall();
      mm.onIncomingCall({ callId: 'c2', callerName: '赵六', callerNumber: '139', timestamp: Date.now() });
      expect(mm.getCallState().callerName).toBe('王五');
    });
  });

  // ─── 通话状态 — 需求 17.4, 17.5 ───

  describe('通话状态 (需求 17.4, 17.5)', () => {
    const call = { callId: 'c1', callerName: '王五', callerNumber: '13800138000', timestamp: Date.now() };

    it('active call has mic and speaker enabled by default', () => {
      mm.onIncomingCall(call);
      mm.acceptCall();
      const cs = mm.getCallState();
      expect(cs.useMic).toBe(true);
      expect(cs.useSpeaker).toBe(true);
    });

    it('toggles mic', () => {
      mm.toggleMic();
      expect(mm.getCallState().useMic).toBe(false);
      mm.toggleMic();
      expect(mm.getCallState().useMic).toBe(true);
    });

    it('toggles speaker', () => {
      mm.toggleSpeaker();
      expect(mm.getCallState().useSpeaker).toBe(false);
      mm.toggleSpeaker();
      expect(mm.getCallState().useSpeaker).toBe(true);
    });

    it('end call transitions to ended then idle', async () => {
      mm.onIncomingCall(call);
      mm.acceptCall();
      mm.endCall();
      expect(mm.getCallState().status).toBe('ended');
      // Wait for the setTimeout to reset
      await new Promise((r) => setTimeout(r, 10));
      expect(mm.getCallState().status).toBe('idle');
    });
  });

  // ─── 蓝牙连接 — 需求 17.6 ───

  describe('蓝牙连接 (需求 17.6)', () => {
    it('disconnected bluetooth shows warning', () => {
      mm.updateBluetoothStatus('disconnected');
      expect(mm.getBluetoothStatus()).toBe('disconnected');
      expect(mm.getBluetoothWarning()).toBe('蓝牙连接已断开，请重新连接配对手机');
    });

    it('reconnecting clears warning', () => {
      mm.updateBluetoothStatus('disconnected');
      mm.updateBluetoothStatus('connected');
      expect(mm.getBluetoothWarning()).toBeNull();
    });

    it('clearBluetoothWarning clears manually', () => {
      mm.updateBluetoothStatus('disconnected');
      mm.clearBluetoothWarning();
      expect(mm.getBluetoothWarning()).toBeNull();
    });
  });

  // ─── 完整状态 ───

  describe('getState', () => {
    it('returns complete state', () => {
      const state = mm.getState();
      expect(state.messages).toHaveLength(0);
      expect(state.callState.status).toBe('idle');
      expect(state.bluetoothStatus).toBe('connected');
      expect(state.bluetoothWarning).toBeNull();
    });
  });

  // ─── 清理 ───

  describe('dispose', () => {
    it('cleans up resources', () => {
      mm.receiveMessage({ id: 'm1', sender: '张三', summary: '你好', timestamp: 1000, app: '微信' });
      mm.dispose();
      expect(mm.getMessages()).toHaveLength(0);
      expect(mm.getCallState().status).toBe('idle');
    });
  });
});
