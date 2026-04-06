import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrbMenuView } from './OrbMenuView';
import type { OrbMenuItemData } from './OrbMenuItem';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

/**
 * OrbMenuView 单元测试
 * 需求: 3.1, 3.2, 3.6
 */

const menuItems: OrbMenuItemData[] = [
  { id: 'launcher', icon: 'home', label: '主页', route: 'launcher' },
  { id: 'notification_center', icon: 'bell', label: '通知', route: 'notification_center' },
  { id: 'ar_navigation', icon: 'compass', label: '导航', route: 'ar_navigation' },
  { id: 'camera', icon: 'camera', label: '相机', route: 'camera' },
  { id: 'music', icon: 'music', label: '音乐', route: 'music' },
  { id: 'ai_assistant', icon: 'ai', label: 'AI', route: 'ai_assistant' },
  { id: 'translator', icon: 'globe', label: '翻译', route: 'translator' },
  { id: 'teleprompter', icon: 'text', label: '提词', route: 'teleprompter' },
  { id: 'health', icon: 'heart', label: '健康', route: 'health' },
  { id: 'messaging', icon: 'chat', label: '消息', route: 'messaging' },
  { id: 'settings', icon: 'gear', label: '设置', route: 'settings' },
];

const defaultProps = {
  menuItems,
  focusedItemId: null,
  activeAppId: null,
  orbPosition: { x: 60, y: 60 },
};

function render(overrides?: Record<string, unknown>): string {
  return renderToStaticMarkup(
    createElement(OrbMenuView, { ...defaultProps, ...overrides } as any),
  );
}

describe('OrbMenuView', () => {
  // ─── 需求 3.2: menuState='orb_menu_open' 时渲染所有 11 个菜单项 ───

  describe('orb_menu_open 渲染 (需求 3.2)', () => {
    it('renders the menu view container', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      expect(html).toContain('data-testid="orb-menu-view"');
    });

    it('renders all 11 menu items', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      for (const item of menuItems) {
        expect(html).toContain(`data-testid="orb-menu-item-${item.id}"`);
      }
    });

    it('renders each menu item with its label', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      for (const item of menuItems) {
        expect(html).toContain(item.label);
      }
    });

    it('renders menu items with opacity:1 when open', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      // Each OrbMenuItem should have opacity:1 when menu is open
      expect(html).toContain('opacity:1');
    });
  });

  // ─── 需求 3.2: menuState='orb_idle' 时菜单项隐藏 (opacity:0, scale(0)) ───

  describe('orb_idle 隐藏 (需求 3.2)', () => {
    it('still renders menu item elements in the DOM when idle', () => {
      const html = render({ menuState: 'orb_idle' as OrbMenuState });
      for (const item of menuItems) {
        expect(html).toContain(`data-testid="orb-menu-item-${item.id}"`);
      }
    });

    it('renders menu items with opacity:0 when idle', () => {
      const html = render({ menuState: 'orb_idle' as OrbMenuState });
      expect(html).toContain('opacity:0');
    });

    it('renders menu items with scale(0) when idle', () => {
      const html = render({ menuState: 'orb_idle' as OrbMenuState });
      expect(html).toContain('scale(0)');
    });
  });

  // ─── 需求 3.1: focusedItemId 正确传递给对应 OrbMenuItem ───

  describe('focusedItemId 传递 (需求 3.1)', () => {
    it('sets data-focused=true on the focused item', () => {
      const html = render({
        menuState: 'orb_item_focused' as OrbMenuState,
        focusedItemId: 'camera',
      });
      // The camera item should have data-focused="true"
      const cameraItemMatch = html.match(
        /data-testid="orb-menu-item-camera"[^>]*data-focused="true"/,
      );
      expect(cameraItemMatch).not.toBeNull();
    });

    it('sets data-focused=false on non-focused items', () => {
      const html = render({
        menuState: 'orb_item_focused' as OrbMenuState,
        focusedItemId: 'camera',
      });
      // The launcher item should have data-focused="false"
      const launcherItemMatch = html.match(
        /data-testid="orb-menu-item-launcher"[^>]*data-focused="false"/,
      );
      expect(launcherItemMatch).not.toBeNull();
    });

    it('applies highlight styles only to the focused item', () => {
      const html = render({
        menuState: 'orb_item_focused' as OrbMenuState,
        focusedItemId: 'music',
      });
      // The focused item should have the glow box-shadow
      expect(html).toContain('rgba(100, 200, 255, 0.5)');
    });

    it('no item is focused when focusedItemId is null', () => {
      const html = render({
        menuState: 'orb_menu_open' as OrbMenuState,
        focusedItemId: null,
      });
      // No item should have data-focused="true"
      expect(html).not.toContain('data-focused="true"');
    });
  });

  // ─── 需求 3.6: 毛玻璃背景样式 ───

  describe('毛玻璃背景 (需求 3.6)', () => {
    it('renders the backdrop element', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      expect(html).toContain('data-testid="orb-menu-backdrop"');
    });

    it('applies backdrop-filter blur style', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      expect(html).toContain('backdrop-filter:blur(12px)');
    });

    it('applies semi-transparent background', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      expect(html).toContain('rgba(0, 0, 0, 0.3)');
    });

    it('backdrop has opacity:1 when menu is open', () => {
      const html = render({ menuState: 'orb_menu_open' as OrbMenuState });
      // The backdrop should be visible
      const backdropSection = html.match(
        /data-testid="orb-menu-backdrop"[^>]*style="[^"]*"/,
      );
      expect(backdropSection).not.toBeNull();
      expect(backdropSection![0]).toContain('opacity:1');
    });

    it('backdrop has opacity:0 when menu is idle', () => {
      const html = render({ menuState: 'orb_idle' as OrbMenuState });
      const backdropSection = html.match(
        /data-testid="orb-menu-backdrop"[^>]*style="[^"]*"/,
      );
      expect(backdropSection).not.toBeNull();
      expect(backdropSection![0]).toContain('opacity:0');
    });
  });
});
