import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIAssistantView } from './AIAssistantView';
import type { AIAssistantViewProps, ConversationEntry } from './AIAssistantView';
import type { AIStatus } from '../../types/ai';

/**
 * AIAssistantView 单元测试
 * 需求: 8.4
 */

function makeEntry(overrides?: Partial<ConversationEntry>): ConversationEntry {
  return {
    role: 'user',
    text: '打开导航',
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeProps(overrides?: Partial<AIAssistantViewProps>): AIAssistantViewProps {
  return {
    status: 'listening',
    conversation: [],
    ...overrides,
  };
}

function render(props: AIAssistantViewProps): string {
  return renderToStaticMarkup(createElement(AIAssistantView, props));
}

const ACTIVE_STATUSES: AIStatus[] = ['listening', 'thinking', 'responding'];

describe('AIAssistantView', () => {
  describe('可见性 — 仅在激活时显示 (需求 8.4)', () => {
    it('returns null when status is idle', () => {
      const html = render(makeProps({ status: 'idle' }));
      expect(html).toBe('');
    });

    it('renders when status is listening', () => {
      const html = render(makeProps({ status: 'listening' }));
      expect(html).toContain('ai-assistant-view');
    });

    it('renders when status is thinking', () => {
      const html = render(makeProps({ status: 'thinking' }));
      expect(html).toContain('ai-assistant-view');
    });

    it('renders when status is responding', () => {
      const html = render(makeProps({ status: 'responding' }));
      expect(html).toContain('ai-assistant-view');
    });
  });

  describe('AI_Status_Orb 集成', () => {
    it('renders AI status orb with current status', () => {
      for (const status of ACTIVE_STATUSES) {
        const html = render(makeProps({ status }));
        expect(html).toContain('ai-status-orb');
        expect(html).toContain(`data-status="${status}"`);
      }
    });
  });

  describe('状态标签显示', () => {
    it('shows "聆听中..." when listening', () => {
      const html = render(makeProps({ status: 'listening' }));
      expect(html).toContain('聆听中...');
    });

    it('shows "正在思考..." when thinking', () => {
      const html = render(makeProps({ status: 'thinking' }));
      expect(html).toContain('正在思考...');
    });

    it('shows "回复中" when responding', () => {
      const html = render(makeProps({ status: 'responding' }));
      expect(html).toContain('回复中');
    });
  });

  describe('语音输入可视化', () => {
    it('renders waveform container', () => {
      const html = render(makeProps({ status: 'listening' }));
      expect(html).toContain('waveform');
    });

    it('waveform has animated bars when listening', () => {
      const html = render(makeProps({ status: 'listening' }));
      // Listening state applies animation styles to bars
      expect(html).toContain('ai-view-wave');
    });

    it('waveform bars are inactive when not listening', () => {
      const html = render(makeProps({ status: 'thinking' }));
      // Thinking state should not have wave animation
      expect(html).not.toContain('ai-view-wave');
    });
  });

  describe('对话历史展示', () => {
    it('shows empty hint when no conversation', () => {
      const html = render(makeProps({ conversation: [] }));
      expect(html).toContain('说点什么试试...');
    });

    it('renders user messages', () => {
      const conversation = [makeEntry({ role: 'user', text: '打开空调' })];
      const html = render(makeProps({ conversation }));
      expect(html).toContain('打开空调');
      expect(html).toContain('message-user');
    });

    it('renders assistant messages', () => {
      const conversation = [
        makeEntry({ role: 'assistant', text: '好的，正在为您打开空调。' }),
      ];
      const html = render(makeProps({ conversation }));
      expect(html).toContain('好的，正在为您打开空调。');
      expect(html).toContain('message-assistant');
    });

    it('renders multiple conversation entries in order', () => {
      const conversation = [
        makeEntry({ role: 'user', text: '第一条' }),
        makeEntry({ role: 'assistant', text: '第二条' }),
        makeEntry({ role: 'user', text: '第三条' }),
      ];
      const html = render(makeProps({ conversation }));
      expect(html).toContain('第一条');
      expect(html).toContain('第二条');
      expect(html).toContain('第三条');
    });

    it('shows confirm badge for low-confidence responses', () => {
      const conversation = [
        makeEntry({ role: 'assistant', text: '您是想控制眼镜设备吗？', needsConfirmation: true }),
      ];
      const html = render(makeProps({ conversation }));
      expect(html).toContain('confirm-badge');
      expect(html).toContain('置信度较低');
    });

    it('does not show confirm badge for high-confidence responses', () => {
      const conversation = [
        makeEntry({ role: 'assistant', text: '好的', needsConfirmation: false }),
      ];
      const html = render(makeProps({ conversation }));
      expect(html).not.toContain('confirm-badge');
    });
  });

  describe('处理中反馈', () => {
    it('shows processing text when provided', () => {
      const html = render(makeProps({ processingText: '正在搜索附近餐厅' }));
      expect(html).toContain('processing-text');
      expect(html).toContain('正在搜索附近餐厅');
    });

    it('does not show processing text when not provided', () => {
      const html = render(makeProps());
      expect(html).not.toContain('processing-text');
    });
  });

  describe('确认操作栏', () => {
    it('shows confirm bar when last response needs confirmation', () => {
      const conversation = [
        makeEntry({
          role: 'assistant',
          text: '您是想控制智能家居吗？',
          needsConfirmation: true,
        }),
      ];
      const html = render(makeProps({
        status: 'listening',
        conversation,
        onConfirm: () => {},
        onRetry: () => {},
      }));
      expect(html).toContain('confirm-bar');
      expect(html).toContain('confirm-action-btn');
      expect(html).toContain('retry-btn');
      expect(html).toContain('确认');
      expect(html).toContain('重新输入');
    });

    it('does not show confirm bar when last response is confident', () => {
      const conversation = [
        makeEntry({ role: 'assistant', text: '好的', needsConfirmation: false }),
      ];
      const html = render(makeProps({ conversation }));
      expect(html).not.toContain('confirm-bar');
    });

    it('does not show confirm bar while thinking', () => {
      const conversation = [
        makeEntry({ role: 'assistant', text: '确认？', needsConfirmation: true }),
      ];
      const html = render(makeProps({ status: 'thinking', conversation }));
      expect(html).not.toContain('confirm-bar');
    });
  });

  describe('文本输入回退 (Demo)', () => {
    it('renders text input field', () => {
      const html = render(makeProps());
      expect(html).toContain('text-input');
      expect(html).toContain('输入文字指令...');
    });

    it('renders send button', () => {
      const html = render(makeProps());
      expect(html).toContain('send-btn');
      expect(html).toContain('发送');
    });
  });

  describe('关闭按钮', () => {
    it('renders deactivate button when callback provided', () => {
      const html = render(makeProps({ onDeactivate: () => {} }));
      expect(html).toContain('deactivate-btn');
      expect(html).toContain('关闭');
    });

    it('does not render deactivate button when no callback', () => {
      const html = render(makeProps({ onDeactivate: undefined }));
      expect(html).not.toContain('deactivate-btn');
    });
  });

  describe('无障碍', () => {
    it('has dialog role', () => {
      const html = render(makeProps());
      expect(html).toContain('role="dialog"');
    });

    it('has aria-label for the dialog', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="AI 语音助手"');
    });

    it('has aria-label on text input', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="文字指令输入"');
    });
  });
});
