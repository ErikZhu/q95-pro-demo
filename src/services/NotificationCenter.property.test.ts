import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationCenter } from './NotificationCenter';
import type { Notification } from '../types/data';

/**
 * 通知中心属性测试
 * 任务 8.3
 *
 * 属性 9: 通知排序一致性 — getUnreadNotifications 返回的通知始终按时间倒序排列
 * 属性 10: 自动归档阈值 — 通知数量超过 50 条时自动归档较早的已读通知
 */

let idCounter = 0;
function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id ?? `n_${++idCounter}`,
    appId: overrides.appId ?? 'app-1',
    appName: overrides.appName ?? 'TestApp',
    title: overrides.title ?? 'Test',
    summary: overrides.summary ?? 'Summary',
    timestamp: overrides.timestamp ?? Date.now(),
    isRead: overrides.isRead ?? false,
  };
}

describe('NotificationCenter 属性测试', () => {
  let center: NotificationCenter;

  beforeEach(() => {
    idCounter = 0;
    center = new NotificationCenter();
  });

  // ── 属性 9: 通知排序一致性 (需求 7.2) ──
  describe('属性 9: 通知排序一致性', () => {
    it('随机时间戳的通知始终按时间倒序返回', () => {
      const timestamps = [500, 100, 900, 300, 700, 200, 800, 400, 600, 1000];
      for (const ts of timestamps) {
        center.addNotification(makeNotification({ timestamp: ts }));
      }
      const unread = center.getUnreadNotifications();
      for (let i = 1; i < unread.length; i++) {
        expect(unread[i - 1].timestamp).toBeGreaterThanOrEqual(unread[i].timestamp);
      }
    });

    it('相同时间戳的通知排序稳定', () => {
      for (let i = 0; i < 10; i++) {
        center.addNotification(makeNotification({ id: `same_${i}`, timestamp: 1000 }));
      }
      const r1 = center.getUnreadNotifications().map((n) => n.id);
      const r2 = center.getUnreadNotifications().map((n) => n.id);
      expect(r1).toEqual(r2);
    });

    it('添加新通知后排序仍然正确', () => {
      center.addNotification(makeNotification({ timestamp: 100 }));
      center.addNotification(makeNotification({ timestamp: 300 }));
      center.addNotification(makeNotification({ timestamp: 200 }));

      // 添加一个最新的
      center.addNotification(makeNotification({ timestamp: 400 }));

      const unread = center.getUnreadNotifications();
      expect(unread[0].timestamp).toBe(400);
      expect(unread[unread.length - 1].timestamp).toBe(100);
    });

    it('标记已读后排序不受影响', () => {
      center.addNotification(makeNotification({ id: 'a', timestamp: 100 }));
      center.addNotification(makeNotification({ id: 'b', timestamp: 300 }));
      center.addNotification(makeNotification({ id: 'c', timestamp: 200 }));

      center.markAsRead('b');
      const unread = center.getUnreadNotifications();
      expect(unread).toHaveLength(2);
      expect(unread[0].timestamp).toBeGreaterThanOrEqual(unread[1].timestamp);
    });

    it('大量通知 (100条) 排序正确', () => {
      for (let i = 0; i < 100; i++) {
        center.addNotification(makeNotification({ timestamp: Math.random() * 10000 }));
      }
      const unread = center.getUnreadNotifications();
      for (let i = 1; i < unread.length; i++) {
        expect(unread[i - 1].timestamp).toBeGreaterThanOrEqual(unread[i].timestamp);
      }
    });
  });

  // ── 属性 10: 自动归档阈值 (需求 7.6) ──
  describe('属性 10: 自动归档阈值', () => {
    it('50 条已读通知后添加第 51 条触发自动归档', () => {
      for (let i = 0; i < 50; i++) {
        center.addNotification(makeNotification({ id: `r${i}`, isRead: true, timestamp: i }));
      }
      expect(center.getCount().total).toBe(50);

      center.addNotification(makeNotification({ id: 'trigger', isRead: false, timestamp: 999 }));
      expect(center.getCount().total).toBe(50);
    });

    it('归档的是最早的已读通知', () => {
      for (let i = 0; i < 50; i++) {
        center.addNotification(makeNotification({ id: `r${i}`, isRead: true, timestamp: i * 10 }));
      }
      center.addNotification(makeNotification({ id: 'new', isRead: false, timestamp: 9999 }));

      const all = center.getAllNotifications();
      // 最早的 r0 应该被归档
      expect(all.find((n) => n.id === 'r0')).toBeUndefined();
      // 最新的应该保留
      expect(all.find((n) => n.id === 'new')).toBeDefined();
    });

    it('未读通知不会被归档', () => {
      for (let i = 0; i < 50; i++) {
        center.addNotification(makeNotification({ id: `u${i}`, isRead: false, timestamp: i }));
      }
      center.addNotification(makeNotification({ id: 'u50', isRead: false, timestamp: 50 }));
      // 全部未读，无法归档
      expect(center.getCount().total).toBe(51);
    });

    it('手动归档到指定阈值', () => {
      for (let i = 0; i < 20; i++) {
        center.addNotification(makeNotification({ id: `n${i}`, isRead: true, timestamp: i }));
      }
      const archived = center.archiveOldNotifications(10);
      expect(archived).toBe(10);
      expect(center.getCount().total).toBe(10);
    });

    it('归档后的通知可通过 getArchivedNotifications 获取', () => {
      for (let i = 0; i < 10; i++) {
        center.addNotification(makeNotification({ id: `n${i}`, isRead: true, timestamp: i }));
      }
      center.archiveOldNotifications(5);
      expect(center.getArchivedNotifications()).toHaveLength(5);
    });
  });
});
