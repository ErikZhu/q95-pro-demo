import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NotificationCenterView } from './NotificationCenter';
import type { Notification } from '../../types/data';
import type { NotificationCenterViewProps } from './NotificationCenter';

/**
 * NotificationCenterView 单元测试
 * 需求: 7.1, 7.3, 7.5
 */

function makeNotification(overrides?: Partial<Notification>): Notification {
  return {
    id: 'n1',
    appId: 'wechat',
    appName: '微信',
    title: '张三',
    summary: '你好，明天开会吗？',
    timestamp: Date.now() - 60000,
    isRead: false,
    ...overrides,
  };
}

function makeProps(overrides?: Partial<NotificationCenterViewProps>): NotificationCenterViewProps {
  return {
    notifications: [],
    groupedNotifications: new Map(),
    mode: 'hidden',
    unreadCount: 0,
    ...overrides,
  };
}

function render(props: NotificationCenterViewProps): string {
  return renderToStaticMarkup(createElement(NotificationCenterView, props));
}

describe('NotificationCenterView', () => {
  describe('隐藏模式', () => {
    it('renders hidden mode with no visible content', () => {
      const html = render(makeProps());
      expect(html).toContain('data-mode="hidden"');
      expect(html).not.toContain('notification-toast');
      expect(html).not.toContain('notification-list-panel');
    });
  });

  describe('Toast 简要通知提示 (需求 7.1)', () => {
    it('renders toast notification with app name, title, and summary', () => {
      const n = makeNotification();
      const html = render(makeProps({
        mode: 'toast',
        toastNotification: n,
      }));
      expect(html).toContain('data-mode="toast"');
      expect(html).toContain('notification-toast');
      expect(html).toContain('微信');
      expect(html).toContain('张三');
      expect(html).toContain('你好，明天开会吗？');
    });

    it('renders bell icon in toast', () => {
      const n = makeNotification();
      const html = render(makeProps({
        mode: 'toast',
        toastNotification: n,
      }));
      // Bell icon is rendered as SVG via Icon component
      expect(html).toContain('<svg');
      expect(html).toContain('notification-toast');
    });

    it('renders toast with role=alert for accessibility', () => {
      const n = makeNotification();
      const html = render(makeProps({
        mode: 'toast',
        toastNotification: n,
      }));
      expect(html).toContain('role="alert"');
    });
  });

  describe('通知列表 (需求 7.3)', () => {
    it('renders notification list panel', () => {
      const html = render(makeProps({ mode: 'list' }));
      expect(html).toContain('data-mode="list"');
      expect(html).toContain('notification-list-panel');
      expect(html).toContain('通知中心');
    });

    it('shows empty state when no notifications', () => {
      const html = render(makeProps({ mode: 'list' }));
      expect(html).toContain('empty-state');
      expect(html).toContain('暂无通知');
    });

    it('renders notification items in list', () => {
      const notifications = [
        makeNotification({ id: 'n1', title: '消息1', timestamp: Date.now() }),
        makeNotification({ id: 'n2', title: '消息2', timestamp: Date.now() - 60000 }),
      ];
      const html = render(makeProps({
        mode: 'list',
        notifications,
        unreadCount: 2,
      }));
      expect(html).toContain('消息1');
      expect(html).toContain('消息2');
    });

    it('shows unread badge with count', () => {
      const html = render(makeProps({
        mode: 'list',
        unreadCount: 5,
      }));
      expect(html).toContain('unread-badge');
      expect(html).toContain('5');
    });

    it('does not show unread badge when count is 0', () => {
      const html = render(makeProps({
        mode: 'list',
        unreadCount: 0,
      }));
      expect(html).not.toContain('unread-badge');
    });

    it('shows unread dot for unread notifications', () => {
      const notifications = [makeNotification({ isRead: false })];
      const html = render(makeProps({
        mode: 'list',
        notifications,
      }));
      expect(html).toContain('unread-dot');
    });

    it('does not show unread dot for read notifications', () => {
      const notifications = [makeNotification({ isRead: true })];
      const html = render(makeProps({
        mode: 'list',
        notifications,
      }));
      expect(html).not.toContain('unread-dot');
    });

    it('renders grouped view when groupByApp is true', () => {
      const grouped = new Map<string, Notification[]>();
      grouped.set('wechat', [
        makeNotification({ id: 'n1', appId: 'wechat', appName: '微信' }),
        makeNotification({ id: 'n2', appId: 'wechat', appName: '微信', title: '李四' }),
      ]);
      grouped.set('email', [
        makeNotification({ id: 'n3', appId: 'email', appName: '邮件', title: '会议通知' }),
      ]);
      const html = render(makeProps({
        mode: 'list',
        notifications: [...grouped.get('wechat')!, ...grouped.get('email')!],
        groupedNotifications: grouped,
        groupByApp: true,
      }));
      // The group toggle button should be present
      expect(html).toContain('group-toggle-btn');
    });

    it('includes close button in list panel', () => {
      const html = render(makeProps({ mode: 'list' }));
      expect(html).toContain('list-close-btn');
    });
  });

  describe('通知详情与快捷操作 (需求 7.5)', () => {
    it('renders notification detail panel', () => {
      const n = makeNotification({
        title: '重要消息',
        summary: '这是一条重要的通知内容',
      });
      const html = render(makeProps({
        mode: 'detail',
        selectedNotification: n,
      }));
      expect(html).toContain('data-mode="detail"');
      expect(html).toContain('notification-detail');
      expect(html).toContain('重要消息');
      expect(html).toContain('这是一条重要的通知内容');
    });

    it('shows app name in detail view', () => {
      const n = makeNotification({ appName: '钉钉' });
      const html = render(makeProps({
        mode: 'detail',
        selectedNotification: n,
      }));
      expect(html).toContain('钉钉');
    });

    it('shows mark-as-read button for unread notifications', () => {
      const n = makeNotification({ isRead: false });
      const html = render(makeProps({
        mode: 'detail',
        selectedNotification: n,
        onMarkAsRead: () => {},
      }));
      expect(html).toContain('mark-read-btn');
      expect(html).toContain('标记已读');
    });

    it('does not show mark-as-read button for read notifications', () => {
      const n = makeNotification({ isRead: true });
      const html = render(makeProps({
        mode: 'detail',
        selectedNotification: n,
        onMarkAsRead: () => {},
      }));
      expect(html).not.toContain('mark-read-btn');
    });

    it('renders custom action buttons from notification', () => {
      const n = makeNotification({
        actions: [
          { label: '回复', actionId: 'reply' },
          { label: '忽略', actionId: 'ignore' },
        ],
      });
      const html = render(makeProps({
        mode: 'detail',
        selectedNotification: n,
      }));
      expect(html).toContain('回复');
      expect(html).toContain('忽略');
      expect(html).toContain('action-reply');
      expect(html).toContain('action-ignore');
    });

    it('renders dismiss button when no custom actions', () => {
      const n = makeNotification({ actions: undefined });
      const html = render(makeProps({
        mode: 'detail',
        selectedNotification: n,
      }));
      expect(html).toContain('action-dismiss');
      expect(html).toContain('关闭');
    });

    it('includes close button in detail view', () => {
      const n = makeNotification();
      const html = render(makeProps({
        mode: 'detail',
        selectedNotification: n,
      }));
      expect(html).toContain('detail-close-btn');
    });
  });

  describe('accessibility', () => {
    it('notification items have aria-label', () => {
      const notifications = [makeNotification({ appName: '微信', title: '张三' })];
      const html = render(makeProps({
        mode: 'list',
        notifications,
      }));
      expect(html).toContain('aria-label="微信: 张三"');
    });

    it('notification items have role=button', () => {
      const notifications = [makeNotification()];
      const html = render(makeProps({
        mode: 'list',
        notifications,
      }));
      expect(html).toContain('role="button"');
    });
  });
});
