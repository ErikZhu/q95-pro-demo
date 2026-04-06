import type { Notification } from '../types/data';

export interface NotificationCenterCallbacks {
  onNewNotification?: (notification: Notification) => void;
  onArchived?: (archivedCount: number) => void;
}

export class NotificationCenter {
  private notifications: Map<string, Notification> = new Map();
  private archivedNotifications: Map<string, Notification> = new Map();
  private callbacks: NotificationCenterCallbacks = {};

  constructor(callbacks?: NotificationCenterCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  setCallbacks(callbacks: NotificationCenterCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /** 需求 7.1: 添加通知，超过50条时自动归档旧已读通知 (需求 7.6) */
  addNotification(notification: Notification): void {
    this.notifications.set(notification.id, { ...notification });
    this.callbacks.onNewNotification?.({ ...notification });

    // 需求 7.6: 超过50条自动归档
    if (this.notifications.size > 50) {
      const archived = this.archiveOldNotifications(50);
      if (archived > 0) {
        this.callbacks.onArchived?.(archived);
      }
    }
  }

  /** 需求 7.2: 按时间倒序返回所有未读通知 */
  getUnreadNotifications(): Notification[] {
    const unread: Notification[] = [];
    for (const n of this.notifications.values()) {
      if (!n.isRead) {
        unread.push({ ...n });
      }
    }
    return unread.sort((a, b) => b.timestamp - a.timestamp);
  }

  /** 需求 7.4: 按应用分组，每组内按时间倒序 */
  getGroupedNotifications(): Map<string, Notification[]> {
    const groups = new Map<string, Notification[]>();
    for (const n of this.notifications.values()) {
      const group = groups.get(n.appId) ?? [];
      group.push({ ...n });
      groups.set(n.appId, group);
    }
    // Sort each group by timestamp descending
    for (const [appId, list] of groups) {
      groups.set(appId, list.sort((a, b) => b.timestamp - a.timestamp));
    }
    return groups;
  }

  /** 标记通知为已读 */
  markAsRead(notificationId: string): void {
    const n = this.notifications.get(notificationId);
    if (n) {
      n.isRead = true;
    }
  }

  /**
   * 需求 7.6: 归档旧已读通知
   * 当通知总数超过 threshold 时，将最旧的已读通知移到归档区，
   * 直到总数 <= threshold。
   * @returns 归档的通知数量
   */
  archiveOldNotifications(threshold: number): number {
    if (this.notifications.size <= threshold) {
      return 0;
    }

    // Collect read notifications sorted by timestamp ascending (oldest first)
    const readNotifications: Notification[] = [];
    for (const n of this.notifications.values()) {
      if (n.isRead) {
        readNotifications.push(n);
      }
    }
    readNotifications.sort((a, b) => a.timestamp - b.timestamp);

    const toArchive = this.notifications.size - threshold;
    let archived = 0;

    for (const n of readNotifications) {
      if (archived >= toArchive) break;
      this.archivedNotifications.set(n.id, n);
      this.notifications.delete(n.id);
      archived++;
    }

    return archived;
  }

  /** 获取通知计数 */
  getCount(): { total: number; unread: number } {
    let unread = 0;
    for (const n of this.notifications.values()) {
      if (!n.isRead) unread++;
    }
    return { total: this.notifications.size, unread };
  }

  /** 获取所有通知（时间倒序） */
  getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values())
      .map((n) => ({ ...n }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /** 获取归档通知 */
  getArchivedNotifications(): Notification[] {
    return Array.from(this.archivedNotifications.values())
      .map((n) => ({ ...n }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}
