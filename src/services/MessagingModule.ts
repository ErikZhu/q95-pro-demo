/**
 * MessagingModule — 消息与通话功能服务
 *
 * 消息接收与预览（发送者和摘要）、语音回复、来电处理（接听/拒绝）、
 * 通话状态管理（时长和对方信息）、内置麦克风和扬声器通话、
 * 蓝牙断开提示。
 * Demo 中使用模拟数据。
 *
 * 需求: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

/** 通话计时间隔（ms） */
const CALL_TIMER_INTERVAL = 1000;

export interface Message {
  id: string;
  sender: string;
  summary: string;
  timestamp: number;
  isRead: boolean;
  app: string; // e.g. '微信', '短信'
}

export interface IncomingCall {
  callId: string;
  callerName: string;
  callerNumber: string;
  timestamp: number;
}

export type CallStatus = 'idle' | 'ringing' | 'active' | 'ended';

export interface CallState {
  status: CallStatus;
  callerName: string | null;
  callerNumber: string | null;
  duration: number; // seconds
  useMic: boolean;
  useSpeaker: boolean;
}

export type BluetoothStatus = 'connected' | 'disconnected';

export interface MessagingState {
  messages: Message[];
  callState: CallState;
  bluetoothStatus: BluetoothStatus;
  bluetoothWarning: string | null;
}

export class MessagingModule {
  private messages: Message[] = [];
  private callStatus: CallStatus = 'idle';
  private callerName: string | null = null;
  private callerNumber: string | null = null;
  private callDuration = 0;
  private callTimer: ReturnType<typeof setInterval> | null = null;
  private useMic = true;
  private useSpeaker = true;
  private bluetoothStatus: BluetoothStatus = 'connected';
  private bluetoothWarning: string | null = null;

  // ─── 消息接收与预览 — 需求 17.1 ───

  /** 接收新消息 */
  receiveMessage(msg: Omit<Message, 'isRead'>): void {
    this.messages.push({ ...msg, isRead: false });
  }

  /** 获取所有消息（最新在前） */
  getMessages(): Message[] {
    return [...this.messages].sort((a, b) => b.timestamp - a.timestamp);
  }

  /** 获取未读消息 */
  getUnreadMessages(): Message[] {
    return this.getMessages().filter((m) => !m.isRead);
  }

  /** 获取最新消息预览（发送者和摘要）— 需求 17.1 */
  getLatestPreview(): { sender: string; summary: string } | null {
    const unread = this.getUnreadMessages();
    if (unread.length === 0) return null;
    return { sender: unread[0].sender, summary: unread[0].summary };
  }

  /** 标记消息已读 */
  markAsRead(messageId: string): void {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg) msg.isRead = true;
  }

  // ─── 语音回复 — 需求 17.2 ───

  /** 通过语音输入回复消息（模拟） */
  replyByVoice(messageId: string, voiceText: string): Message | null {
    const original = this.messages.find((m) => m.id === messageId);
    if (!original) return null;

    const reply: Message = {
      id: `reply_${Date.now()}`,
      sender: '我',
      summary: voiceText,
      timestamp: Date.now(),
      isRead: true,
      app: original.app,
    };
    this.messages.push(reply);
    return reply;
  }

  // ─── 来电处理 — 需求 17.3 ───

  /** 收到来电 */
  onIncomingCall(call: IncomingCall): void {
    if (this.callStatus === 'active') return; // 通话中不处理新来电
    this.callStatus = 'ringing';
    this.callerName = call.callerName;
    this.callerNumber = call.callerNumber;
    this.callDuration = 0;
  }

  /** 接听来电 — 需求 17.3, 17.5 */
  acceptCall(): void {
    if (this.callStatus !== 'ringing') return;
    this.callStatus = 'active';
    this.callDuration = 0;
    this.useMic = true;
    this.useSpeaker = true;
    this.startCallTimer();
  }

  /** 拒绝来电 — 需求 17.3 */
  rejectCall(): void {
    if (this.callStatus !== 'ringing') return;
    this.callStatus = 'idle';
    this.callerName = null;
    this.callerNumber = null;
  }

  /** 结束通话 */
  endCall(): void {
    if (this.callStatus !== 'active' && this.callStatus !== 'ringing') return;
    this.stopCallTimer();
    this.callStatus = 'ended';
    // Reset after a brief moment (simulate)
    setTimeout(() => {
      if (this.callStatus === 'ended') {
        this.callStatus = 'idle';
        this.callerName = null;
        this.callerNumber = null;
        this.callDuration = 0;
      }
    }, 0);
  }

  // ─── 通话状态 — 需求 17.4, 17.5 ───

  /** 获取通话状态 */
  getCallState(): CallState {
    return {
      status: this.callStatus,
      callerName: this.callerName,
      callerNumber: this.callerNumber,
      duration: this.callDuration,
      useMic: this.useMic,
      useSpeaker: this.useSpeaker,
    };
  }

  /** 切换麦克风 — 需求 17.5 */
  toggleMic(): void {
    this.useMic = !this.useMic;
  }

  /** 切换扬声器 — 需求 17.5 */
  toggleSpeaker(): void {
    this.useSpeaker = !this.useSpeaker;
  }

  // ─── 蓝牙连接 — 需求 17.6 ───

  /** 更新蓝牙连接状态 */
  updateBluetoothStatus(status: BluetoothStatus): void {
    this.bluetoothStatus = status;
    if (status === 'disconnected') {
      this.bluetoothWarning = '蓝牙连接已断开，请重新连接配对手机';
    } else {
      this.bluetoothWarning = null;
    }
  }

  /** 获取蓝牙状态 */
  getBluetoothStatus(): BluetoothStatus {
    return this.bluetoothStatus;
  }

  /** 获取蓝牙警告信息 */
  getBluetoothWarning(): string | null {
    return this.bluetoothWarning;
  }

  /** 清除蓝牙警告 */
  clearBluetoothWarning(): void {
    this.bluetoothWarning = null;
  }

  // ─── 完整状态 ───

  /** 获取完整模块状态 */
  getState(): MessagingState {
    return {
      messages: this.getMessages(),
      callState: this.getCallState(),
      bluetoothStatus: this.bluetoothStatus,
      bluetoothWarning: this.bluetoothWarning,
    };
  }

  /** 清理资源 */
  dispose(): void {
    this.stopCallTimer();
    this.messages = [];
    this.callStatus = 'idle';
    this.callerName = null;
    this.callerNumber = null;
    this.callDuration = 0;
  }

  // ─── 内部方法 ───

  private startCallTimer(): void {
    this.stopCallTimer();
    this.callTimer = setInterval(() => {
      if (this.callStatus === 'active') {
        this.callDuration++;
      }
    }, CALL_TIMER_INTERVAL);
  }

  private stopCallTimer(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }
}
