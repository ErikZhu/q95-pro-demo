import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationCenter } from './NotificationCenter';
import type { Notification } from '../types/data';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    appId: overrides.appId ?? 'app-1',
    appName: overrides.appName ?? 'TestApp',
    title: overrides.title ?? 'Test Title',
    summary: overrides.summary ?? 'Test Summary',
    timestamp: overrides.timestamp ?? Date.now(),
    isRead: overrides.isRead ?? false,
    actions: overrides.actions,
  };
}

describe('NotificationCenter', () => {
  let center: NotificationCenter;

  beforeEach(() => {
    center = new NotificationCenter();
  });

  describe('addNotification (需求 7.1)', () => {
    it('adds a notification and increments count', () => {
      center.addNotification(makeNotification());
      expect(center.getCount().total).toBe(1);
    });

    it('fires onNewNotification callback', () => {
      const onNew = vi.fn();
      center.setCallbacks({ onNewNotification: onNew });
      const n = makeNotification();
      center.addNotification(n);
      expect(onNew).toHaveBeenCalledTimes(1);
      expect(onNew.mock.calls[0][0].id).toBe(n.id);
    });

    it('stores a copy, not a reference', () => {
      const n = makeNotification();
      center.addNotification(n);
      n.title = 'Modified';
      expect(center.getAllNotifications()[0].title).toBe('Test Title');
    });
  });

  describe('getUnreadNotifications (需求 7.2)', () => {
    it('returns only unread notifications', () => {
      center.addNotification(makeNotification({ id: '1', isRead: false }));
      center.addNotification(makeNotification({ id: '2', isRead: true }));
      center.addNotification(makeNotification({ id: '3', isRead: false }));
      const unread = center.getUnreadNotifications();
      expect(unread).toHaveLength(2);
      expect(unread.every((n) => !n.isRead)).toBe(true);
    });

    it('returns notifications sorted by time descending', () => {
      center.addNotification(makeNotification({ id: '1', timestamp: 100 }));
      center.addNotification(makeNotification({ id: '2', timestamp: 300 }));
      center.addNotification(makeNotification({ id: '3', timestamp: 200 }));
      const unread = center.getUnreadNotifications();
      expect(unread[0].timestamp).toBe(300);
      expect(unread[1].timestamp).toBe(200);
      expect(unread[2].timestamp).toBe(100);
    });

    it('returns empty array when no unread notifications', () => {
      center.addNotification(makeNotification({ isRead: true }));
      expect(center.getUnreadNotifications()).toHaveLength(0);
    });

    it('returns copies, not references', () => {
      center.addNotification(makeNotification({ id: '1' }));
      const unread = center.getUnreadNotifications();
      unread[0].title = 'Hacked';
      expect(center.getUnreadNotifications()[0].title).toBe('Test Title');
    });
  });

  describe('getGroupedNotifications (需求 7.4)', () => {
    it('groups notifications by appId', () => {
      center.addNotification(makeNotification({ id: '1', appId: 'wechat' }));
      center.addNotification(makeNotification({ id: '2', appId: 'email' }));
      center.addNotification(makeNotification({ id: '3', appId: 'wechat' }));
      const groups = center.getGroupedNotifications();
      expect(groups.size).toBe(2);
      expect(groups.get('wechat')).toHaveLength(2);
      expect(groups.get('email')).toHaveLength(1);
    });

    it('sorts each group by time descending', () => {
      center.addNotification(
        makeNotification({ id: '1', appId: 'app', timestamp: 100 }),
      );
      center.addNotification(
        makeNotification({ id: '2', appId: 'app', timestamp: 300 }),
      );
      center.addNotification(
        makeNotification({ id: '3', appId: 'app', timestamp: 200 }),
      );
      const group = center.getGroupedNotifications().get('app')!;
      expect(group[0].timestamp).toBe(300);
      expect(group[1].timestamp).toBe(200);
      expect(group[2].timestamp).toBe(100);
    });

    it('returns empty map when no notifications', () => {
      expect(center.getGroupedNotifications().size).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', () => {
      center.addNotification(makeNotification({ id: 'n1', isRead: false }));
      center.markAsRead('n1');
      expect(center.getUnreadNotifications()).toHaveLength(0);
      expect(center.getCount().unread).toBe(0);
    });

    it('does nothing for non-existent notification', () => {
      center.markAsRead('non-existent');
      expect(center.getCount().total).toBe(0);
    });

    it('is idempotent', () => {
      center.addNotification(makeNotification({ id: 'n1', isRead: false }));
      center.markAsRead('n1');
      center.markAsRead('n1');
      expect(center.getCount().unread).toBe(0);
    });
  });

  describe('archiveOldNotifications (需求 7.6)', () => {
    it('archives oldest read notifications when count exceeds threshold', () => {
      // Add 5 read notifications with ascending timestamps
      for (let i = 0; i < 5; i++) {
        center.addNotification(
          makeNotification({ id: `r${i}`, isRead: true, timestamp: i * 100 }),
        );
      }
      const archived = center.archiveOldNotifications(3);
      expect(archived).toBe(2);
      expect(center.getCount().total).toBe(3);
      // The oldest two should be archived
      const remaining = center.getAllNotifications();
      expect(remaining.map((n) => n.id)).toEqual(
        expect.arrayContaining(['r2', 'r3', 'r4']),
      );
    });

    it('does not archive unread notifications', () => {
      for (let i = 0; i < 5; i++) {
        center.addNotification(
          makeNotification({ id: `u${i}`, isRead: false, timestamp: i * 100 }),
        );
      }
      const archived = center.archiveOldNotifications(3);
      expect(archived).toBe(0);
      expect(center.getCount().total).toBe(5);
    });

    it('returns 0 when count is at or below threshold', () => {
      center.addNotification(makeNotification({ id: '1' }));
      expect(center.archiveOldNotifications(5)).toBe(0);
    });

    it('archives only enough to reach threshold', () => {
      for (let i = 0; i < 10; i++) {
        center.addNotification(
          makeNotification({ id: `n${i}`, isRead: true, timestamp: i }),
        );
      }
      const archived = center.archiveOldNotifications(7);
      expect(archived).toBe(3);
      expect(center.getCount().total).toBe(7);
    });

    it('archived notifications are accessible via getArchivedNotifications', () => {
      for (let i = 0; i < 5; i++) {
        center.addNotification(
          makeNotification({ id: `n${i}`, isRead: true, timestamp: i }),
        );
      }
      center.archiveOldNotifications(3);
      const archived = center.getArchivedNotifications();
      expect(archived).toHaveLength(2);
    });
  });

  describe('auto-archive on addNotification (需求 7.6)', () => {
    it('auto-archives when adding a notification causes count to exceed 50', () => {
      // Add 50 read notifications
      for (let i = 0; i < 50; i++) {
        center.addNotification(
          makeNotification({ id: `n${i}`, isRead: true, timestamp: i }),
        );
      }
      expect(center.getCount().total).toBe(50);

      // Adding the 51st triggers auto-archive
      center.addNotification(
        makeNotification({ id: 'n50', isRead: false, timestamp: 50 }),
      );
      expect(center.getCount().total).toBe(50);
    });

    it('fires onArchived callback during auto-archive', () => {
      const onArchived = vi.fn();
      center.setCallbacks({ onArchived });

      for (let i = 0; i < 50; i++) {
        center.addNotification(
          makeNotification({ id: `n${i}`, isRead: true, timestamp: i }),
        );
      }
      center.addNotification(
        makeNotification({ id: 'trigger', isRead: false, timestamp: 999 }),
      );
      expect(onArchived).toHaveBeenCalledWith(1);
    });

    it('does not auto-archive if no read notifications available', () => {
      for (let i = 0; i < 50; i++) {
        center.addNotification(
          makeNotification({ id: `n${i}`, isRead: false, timestamp: i }),
        );
      }
      center.addNotification(
        makeNotification({ id: 'n50', isRead: false, timestamp: 50 }),
      );
      // Can't archive unread, so total stays at 51
      expect(center.getCount().total).toBe(51);
    });
  });

  describe('getCount', () => {
    it('returns correct total and unread counts', () => {
      center.addNotification(makeNotification({ id: '1', isRead: false }));
      center.addNotification(makeNotification({ id: '2', isRead: true }));
      center.addNotification(makeNotification({ id: '3', isRead: false }));
      const count = center.getCount();
      expect(count.total).toBe(3);
      expect(count.unread).toBe(2);
    });

    it('returns zeros when empty', () => {
      expect(center.getCount()).toEqual({ total: 0, unread: 0 });
    });
  });

  describe('constructor with callbacks', () => {
    it('accepts callbacks in constructor', () => {
      const onNew = vi.fn();
      const c = new NotificationCenter({ onNewNotification: onNew });
      c.addNotification(makeNotification());
      expect(onNew).toHaveBeenCalledTimes(1);
    });
  });
});
