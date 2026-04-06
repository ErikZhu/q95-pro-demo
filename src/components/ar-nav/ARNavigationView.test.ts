import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ARNavigationView } from './ARNavigationView';
import type { ARNavigationViewProps } from './ARNavigationView';
import type { NavigationState, Route } from '../../types/navigation';

/**
 * ARNavigationView 单元测试
 * 需求: 11.1, 11.2, 11.3, 11.5, 11.6
 */

function makeRoute(overrides?: Partial<Route>): Route {
  return {
    origin: { lat: 39.9042, lng: 116.4074, name: '当前位置' },
    destination: { lat: 39.92, lng: 116.42, name: '天安门广场' },
    waypoints: [{ lat: 39.91, lng: 116.41, name: '中山路' }],
    distance: 2000,
    estimatedTime: 1400,
    mode: 'walk',
    ...overrides,
  };
}

function makeState(overrides?: Partial<NavigationState>): NavigationState {
  return {
    isActive: true,
    currentPosition: { lat: 39.9042, lng: 116.4074 },
    nextTurn: { direction: 'left', distance: 150, streetName: '中山路' },
    remainingDistance: 2000,
    estimatedArrival: Date.now() + 1400000,
    gpsSignal: 'strong',
    ...overrides,
  };
}

function makeProps(overrides?: Partial<ARNavigationViewProps>): ARNavigationViewProps {
  return {
    navigationState: makeState(),
    route: makeRoute(),
    ...overrides,
  };
}

function render(props: ARNavigationViewProps): string {
  return renderToStaticMarkup(createElement(ARNavigationView, props));
}

describe('ARNavigationView', () => {
  // ─── 可见性 ───

  describe('可见性', () => {
    it('returns null when navigation is inactive', () => {
      const html = render(makeProps({ navigationState: makeState({ isActive: false }) }));
      expect(html).toBe('');
    });

    it('returns null when route is null', () => {
      const html = render(makeProps({ route: null }));
      expect(html).toBe('');
    });

    it('renders when navigation is active with route', () => {
      const html = render(makeProps());
      expect(html).toContain('ar-navigation-view');
    });
  });

  // ─── 导航模式显示 ───

  describe('导航模式', () => {
    it('shows walk mode label', () => {
      const html = render(makeProps({ route: makeRoute({ mode: 'walk' }) }));
      expect(html).toContain('步行导航');
    });

    it('shows bike mode label', () => {
      const html = render(makeProps({ route: makeRoute({ mode: 'bike' }) }));
      expect(html).toContain('骑行导航');
    });
  });

  // ─── 方向箭头 — 需求 11.2 ───

  describe('方向箭头 (需求 11.2)', () => {
    it('shows left turn arrow', () => {
      const html = render(makeProps({
        navigationState: makeState({ nextTurn: { direction: 'left', distance: 100 } }),
      }));
      // Direction icon rendered as SVG
      expect(html).toContain('<svg');
      expect(html).toContain('左转');
    });

    it('shows right turn arrow', () => {
      const html = render(makeProps({
        navigationState: makeState({ nextTurn: { direction: 'right', distance: 100 } }),
      }));
      // Direction icon rendered as SVG
      expect(html).toContain('<svg');
      expect(html).toContain('右转');
    });

    it('shows straight arrow', () => {
      const html = render(makeProps({
        navigationState: makeState({ nextTurn: { direction: 'straight', distance: 100 } }),
      }));
      // Direction icon rendered as SVG
      expect(html).toContain('<svg');
      expect(html).toContain('直行');
    });

    it('shows uturn arrow', () => {
      const html = render(makeProps({
        navigationState: makeState({ nextTurn: { direction: 'uturn', distance: 100 } }),
      }));
      // Direction icon rendered as SVG
      expect(html).toContain('<svg');
      expect(html).toContain('掉头');
    });
  });

  // ─── 距离显示 — 需求 11.2 ───

  describe('距离显示 (需求 11.2)', () => {
    it('shows turn distance in meters', () => {
      const html = render(makeProps({
        navigationState: makeState({ nextTurn: { direction: 'left', distance: 150 } }),
      }));
      expect(html).toContain('150 m');
    });

    it('shows remaining distance in km when >= 1000m', () => {
      const html = render(makeProps({
        navigationState: makeState({ remainingDistance: 2500 }),
      }));
      expect(html).toContain('2.5 km');
    });

    it('shows remaining distance in meters when < 1000m', () => {
      const html = render(makeProps({
        navigationState: makeState({ remainingDistance: 800 }),
      }));
      expect(html).toContain('800 m');
    });
  });

  // ─── 街道名称 ───

  describe('街道名称', () => {
    it('shows street name when available', () => {
      const html = render(makeProps({
        navigationState: makeState({
          nextTurn: { direction: 'left', distance: 100, streetName: '中山路' },
        }),
      }));
      expect(html).toContain('中山路');
    });

    it('does not show street name when not available', () => {
      const html = render(makeProps({
        navigationState: makeState({
          nextTurn: { direction: 'left', distance: 100 },
        }),
      }));
      expect(html).not.toContain('street-name');
    });
  });

  // ─── 预计到达时间 — 需求 11.2 ───

  describe('预计到达时间 (需求 11.2)', () => {
    it('shows ETA', () => {
      const html = render(makeProps());
      expect(html).toContain('到达时间');
    });

    it('shows remaining time', () => {
      const html = render(makeProps());
      expect(html).toContain('预计用时');
    });

    it('shows remaining distance label', () => {
      const html = render(makeProps());
      expect(html).toContain('剩余距离');
    });
  });

  // ─── GPS 信号状态 — 需求 11.6 ───

  describe('GPS 信号状态 (需求 11.6)', () => {
    it('shows strong GPS signal', () => {
      const html = render(makeProps({
        navigationState: makeState({ gpsSignal: 'strong' }),
      }));
      expect(html).toContain('GPS 信号良好');
    });

    it('shows weak GPS signal', () => {
      const html = render(makeProps({
        navigationState: makeState({ gpsSignal: 'weak' }),
      }));
      expect(html).toContain('GPS 信号弱');
    });

    it('shows GPS lost banner', () => {
      const html = render(makeProps({
        navigationState: makeState({ gpsSignal: 'lost' }),
      }));
      expect(html).toContain('GPS 信号丢失');
      expect(html).toContain('gps-lost-banner');
      expect(html).toContain('使用最近已知位置继续导航');
    });

    it('does not show lost banner when signal is strong', () => {
      const html = render(makeProps({
        navigationState: makeState({ gpsSignal: 'strong' }),
      }));
      expect(html).not.toContain('gps-lost-banner');
    });

    it('shows reroute button in lost banner when callback provided', () => {
      const html = render(makeProps({
        navigationState: makeState({ gpsSignal: 'lost' }),
        onReroute: () => {},
      }));
      expect(html).toContain('reroute-btn');
      expect(html).toContain('重新规划');
    });
  });

  // ─── 停止导航按钮 ───

  describe('停止导航按钮', () => {
    it('renders stop button when callback provided', () => {
      const html = render(makeProps({ onStopNavigation: () => {} }));
      expect(html).toContain('stop-nav-btn');
      expect(html).toContain('结束');
    });

    it('does not render stop button when no callback', () => {
      const html = render(makeProps({ onStopNavigation: undefined }));
      expect(html).not.toContain('stop-nav-btn');
    });
  });

  // ─── 无障碍 — 需求 11.5 ───

  describe('无障碍 (需求 11.5)', () => {
    it('has region role', () => {
      const html = render(makeProps());
      expect(html).toContain('role="region"');
    });

    it('has aria-label', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="AR 导航"');
    });

    it('stop button has aria-label', () => {
      const html = render(makeProps({ onStopNavigation: () => {} }));
      expect(html).toContain('aria-label="停止导航"');
    });
  });
});
