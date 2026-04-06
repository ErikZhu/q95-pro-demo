import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrbMenuItem } from './OrbMenuItem';
import type { OrbMenuItemData, OrbMenuItemProps } from './OrbMenuItem';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

/**
 * OrbMenuItem 单元测试
 * 需求: 3.3, 4.1, 7.1, 8.1
 */

const testItem: OrbMenuItemData = {
  id: 'camera',
  icon: 'camera',
  label: '相机',
  route: 'camera',
};

function makeProps(overrides?: Partial<OrbMenuItemProps>): OrbMenuItemProps {
  return {
    item: testItem,
    position: { x: 100, y: 100 },
    isFocused: false,
    isActive: false,
    animationDelay: 0,
    menuState: 'orb_menu_open' as OrbMenuState,
    ...overrides,
  };
}

function render(props: OrbMenuItemProps): string {
  return renderToStaticMarkup(createElement(OrbMenuItem, props));
}

describe('OrbMenuItem', () => {
  // ─── 默认渲染：图标和标签 — 需求 3.3 ───

  describe('默认渲染 (需求 3.3)', () => {
    it('renders the menu item container with correct test id', () => {
      const html = render(makeProps());
      expect(html).toContain(`data-testid="orb-menu-item-${testItem.id}"`);
    });

    it('renders the icon container', () => {
      const html = render(makeProps());
      expect(html).toContain(`data-testid="orb-menu-item-icon-${testItem.id}"`);
    });

    it('renders an SVG icon inside the icon container', () => {
      const html = render(makeProps());
      expect(html).toContain('<svg');
    });

    it('renders the label with correct text', () => {
      const html = render(makeProps());
      expect(html).toContain(`data-testid="orb-menu-item-label-${testItem.id}"`);
      expect(html).toContain('相机');
    });

    it('does not render active dot by default', () => {
      const html = render(makeProps());
      expect(html).not.toContain(`orb-menu-item-active-dot-${testItem.id}`);
    });
  });

  // ─── 聚焦高亮样式 — 需求 4.1 ───

  describe('聚焦高亮 (需求 4.1)', () => {
    it('sets data-focused=true when isFocused is true', () => {
      const html = render(makeProps({ isFocused: true }));
      expect(html).toContain('data-focused="true"');
    });

    it('sets data-focused=false when isFocused is false', () => {
      const html = render(makeProps({ isFocused: false }));
      expect(html).toContain('data-focused="false"');
    });

    it('applies highlight background when focused', () => {
      const html = render(makeProps({ isFocused: true }));
      // Focused icon container uses brighter background
      expect(html).toContain('rgba(100, 200, 255, 0.2)');
    });

    it('applies glow box-shadow when focused', () => {
      const html = render(makeProps({ isFocused: true }));
      expect(html).toContain('box-shadow');
      expect(html).toContain('rgba(100, 200, 255, 0.5)');
    });

    it('applies scale(1.15) transform when focused', () => {
      const html = render(makeProps({ isFocused: true }));
      expect(html).toContain('scale(1.15)');
    });

    it('does not apply glow when not focused', () => {
      const html = render(makeProps({ isFocused: false }));
      expect(html).not.toContain('rgba(100, 200, 255, 0.5)');
    });
  });

  // ─── 活跃指示标记 — 需求 8.1 ───

  describe('活跃指示标记 (需求 8.1)', () => {
    it('renders active dot when isActive is true', () => {
      const html = render(makeProps({ isActive: true }));
      expect(html).toContain(`data-testid="orb-menu-item-active-dot-${testItem.id}"`);
    });

    it('does not render active dot when isActive is false', () => {
      const html = render(makeProps({ isActive: false }));
      expect(html).not.toContain(`orb-menu-item-active-dot-${testItem.id}`);
    });

    it('sets data-active=true when isActive is true', () => {
      const html = render(makeProps({ isActive: true }));
      expect(html).toContain('data-active="true"');
    });

    it('sets data-active=false when isActive is false', () => {
      const html = render(makeProps({ isActive: false }));
      expect(html).toContain('data-active="false"');
    });
  });

  // ─── animationDelay 应用到 CSS transition-delay — 需求 7.1 ───

  describe('animationDelay (需求 7.1)', () => {
    it('applies 0ms delay when animationDelay is 0', () => {
      const html = render(makeProps({ animationDelay: 0 }));
      expect(html).toContain('transition-delay:0ms');
    });

    it('applies 30ms delay for first item in expand sequence', () => {
      const html = render(makeProps({ animationDelay: 30 }));
      expect(html).toContain('transition-delay:30ms');
    });

    it('applies 90ms delay for third item in expand sequence', () => {
      const html = render(makeProps({ animationDelay: 90 }));
      expect(html).toContain('transition-delay:90ms');
    });
  });

  // ─── 菜单状态 data 属性 ───

  describe('菜单状态属性', () => {
    it('sets data-menu-state to current menu state', () => {
      const html = render(makeProps({ menuState: 'orb_menu_open' as OrbMenuState }));
      expect(html).toContain('data-menu-state="orb_menu_open"');
    });

    it('renders visible (scale 1, opacity 1) when menu is open', () => {
      const html = render(makeProps({ menuState: 'orb_menu_open' as OrbMenuState }));
      expect(html).toContain('scale(1)');
      expect(html).toContain('opacity:1');
    });

    it('renders hidden (scale 0, opacity 0) when menu is idle', () => {
      const html = render(makeProps({ menuState: 'orb_idle' as OrbMenuState }));
      expect(html).toContain('scale(0)');
      expect(html).toContain('opacity:0');
    });
  });
});
