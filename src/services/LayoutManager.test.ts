import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutManager } from './LayoutManager';
import type { ScreenZone } from '../types/display';

describe('LayoutManager', () => {
  let lm: LayoutManager;

  beforeEach(() => {
    lm = new LayoutManager(1280, 720);
  });

  describe('getZoneBounds', () => {
    // 需求 2.3: Smart_Task_Zone 固定显示在屏幕左上角
    it('places Smart_Task_Zone at top-left corner', () => {
      const bounds = lm.getZoneBounds('smart_task_zone');
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(320); // 25% of 1280
      expect(bounds.height).toBe(108); // 15% of 720
    });

    // 需求 2.4: Status_Bar 固定显示在屏幕右上角
    it('places Status_Bar at top-right corner', () => {
      const bounds = lm.getZoneBounds('status_bar');
      expect(bounds.x).toBe(960); // 1280 - 320
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(320);
      expect(bounds.height).toBe(108);
    });

    // 需求 2.2: Main_Task_Area 占据屏幕中央主要区域
    it('places Main_Task_Area below the top bar zones', () => {
      const bounds = lm.getZoneBounds('main_task_area');
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(112); // 108 + 4 gap
      expect(bounds.width).toBe(1280);
      expect(bounds.height).toBe(608); // 720 - 108 - 4
    });

    // 需求 2.2: Main_Task_Area 占据大部分屏幕面积
    it('Main_Task_Area occupies the majority of screen area', () => {
      const main = lm.getZoneBounds('main_task_area');
      const screenArea = 1280 * 720;
      const mainArea = main.width * main.height;
      expect(mainArea / screenArea).toBeGreaterThan(0.5);
    });
  });

  // 需求 2.5, 2.6: 分区不遮挡且有清晰边界
  describe('checkOverlap', () => {
    const zones: ScreenZone[] = ['main_task_area', 'smart_task_zone', 'status_bar'];

    it('returns true when checking a zone against itself', () => {
      for (const zone of zones) {
        expect(lm.checkOverlap(zone, zone)).toBe(true);
      }
    });

    it('no overlap between any two different zones', () => {
      expect(lm.checkOverlap('smart_task_zone', 'status_bar')).toBe(false);
      expect(lm.checkOverlap('smart_task_zone', 'main_task_area')).toBe(false);
      expect(lm.checkOverlap('status_bar', 'main_task_area')).toBe(false);
    });
  });

  describe('setSmartTaskMode / getSmartTaskMode', () => {
    it('defaults to compact mode', () => {
      expect(lm.getSmartTaskMode()).toBe('compact');
    });

    it('can switch to expanded mode', () => {
      lm.setSmartTaskMode('expanded');
      expect(lm.getSmartTaskMode()).toBe('expanded');
    });

    it('can switch back to compact mode', () => {
      lm.setSmartTaskMode('expanded');
      lm.setSmartTaskMode('compact');
      expect(lm.getSmartTaskMode()).toBe('compact');
    });
  });

  describe('overlay management', () => {
    it('registerOverlay returns a unique id', () => {
      const id1 = lm.registerOverlay({ zone: 'main_task_area', opacity: 0.5, priority: 1, content: null });
      const id2 = lm.registerOverlay({ zone: 'main_task_area', opacity: 0.8, priority: 2, content: null });
      expect(id1).not.toBe(id2);
    });

    it('removeOverlay removes the overlay', () => {
      const id = lm.registerOverlay({ zone: 'status_bar', opacity: 1, priority: 1, content: null });
      expect(lm.getOverlayCount()).toBe(1);
      lm.removeOverlay(id);
      expect(lm.getOverlayCount()).toBe(0);
    });

    it('removeOverlay with unknown id does nothing', () => {
      lm.registerOverlay({ zone: 'status_bar', opacity: 1, priority: 1, content: null });
      lm.removeOverlay('nonexistent');
      expect(lm.getOverlayCount()).toBe(1);
    });

    it('getOverlaysForZone returns overlays sorted by priority descending', () => {
      lm.registerOverlay({ zone: 'main_task_area', opacity: 0.5, priority: 1, content: 'low' });
      lm.registerOverlay({ zone: 'main_task_area', opacity: 0.8, priority: 10, content: 'high' });
      lm.registerOverlay({ zone: 'main_task_area', opacity: 0.6, priority: 5, content: 'mid' });
      lm.registerOverlay({ zone: 'status_bar', opacity: 1, priority: 99, content: 'other zone' });

      const overlays = lm.getOverlaysForZone('main_task_area');
      expect(overlays).toHaveLength(3);
      expect(overlays[0].priority).toBe(10);
      expect(overlays[1].priority).toBe(5);
      expect(overlays[2].priority).toBe(1);
    });

    it('getOverlaysForZone returns empty array for zone with no overlays', () => {
      expect(lm.getOverlaysForZone('smart_task_zone')).toEqual([]);
    });
  });

  describe('custom screen sizes', () => {
    it('works with different screen dimensions', () => {
      const custom = new LayoutManager(1920, 1080);
      const stz = custom.getZoneBounds('smart_task_zone');
      const sb = custom.getZoneBounds('status_bar');
      const main = custom.getZoneBounds('main_task_area');

      expect(stz.x).toBe(0);
      expect(sb.x).toBe(1920 - 480); // 25% of 1920 = 480
      expect(main.width).toBe(1920);
      // zones should still not overlap
      expect(custom.checkOverlap('smart_task_zone', 'status_bar')).toBe(false);
      expect(custom.checkOverlap('smart_task_zone', 'main_task_area')).toBe(false);
      expect(custom.checkOverlap('status_bar', 'main_task_area')).toBe(false);
    });
  });
});
