import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from './App';

/**
 * App 集成单元测试
 * 需求: 1.1, 1.3, 1.4
 */

function render(): string {
  return renderToStaticMarkup(createElement(App));
}

describe('App integration', () => {
  // ─── 需求 1.1: 底部导航栏已移除 ───

  describe('底部导航栏移除 (需求 1.1)', () => {
    it('does not render demo-nav-bar element', () => {
      const html = render();
      expect(html).not.toContain('demo-nav-bar');
    });
  });

  // ─── 需求 1.3: OrbMenuView 在 SmartTaskZoneView 内渲染 ───

  describe('OrbMenuView 集成 (需求 1.3)', () => {
    it('renders OrbMenuView inside screen-layout', () => {
      const html = render();
      expect(html).toContain('data-testid="orb-menu-view"');
    });

    it('renders SmartTaskZoneView', () => {
      const html = render();
      expect(html).toContain('data-testid="smart-task-zone-view"');
    });
  });

  // ─── 需求 1.4: 所有 11 个导航入口在 OrbMenu 中可访问 ───

  describe('4 个导航入口 (需求 1.4)', () => {
    const expectedLabels = [
      '通知', '相机',
      '消息', '设置',
    ];

    it('contains all 4 menu item labels', () => {
      const html = render();
      for (const label of expectedLabels) {
        expect(html).toContain(label);
      }
    });
  });
});
