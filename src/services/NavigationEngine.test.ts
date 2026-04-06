import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationEngine, AVAILABLE_ROUTES } from './NavigationEngine';

describe('NavigationEngine', () => {
  let nav: NavigationEngine;

  beforeEach(() => {
    nav = new NavigationEngine();
  });

  // ─── 默认状态 ───

  describe('初始状态', () => {
    it('defaults to launcher route', () => {
      expect(nav.getCurrentRoute()).toBe('launcher');
    });

    it('history contains only launcher initially', () => {
      expect(nav.getHistory()).toEqual(['launcher']);
    });
  });

  // ─── navigate — 需求 21.4 ───

  describe('navigate (需求 21.4)', () => {
    it('navigates to a valid route', () => {
      nav.navigate('camera');
      expect(nav.getCurrentRoute()).toBe('camera');
    });

    it('pushes route onto history stack', () => {
      nav.navigate('music');
      nav.navigate('settings');
      expect(nav.getHistory()).toEqual(['launcher', 'music', 'settings']);
    });

    it('ignores navigation to the same route', () => {
      nav.navigate('camera');
      nav.navigate('camera');
      expect(nav.getHistory()).toEqual(['launcher', 'camera']);
    });

    it('throws on unknown route', () => {
      expect(() => nav.navigate('unknown_app')).toThrow('Unknown route: unknown_app');
    });

    it('supports all available routes', () => {
      for (const route of AVAILABLE_ROUTES) {
        const engine = new NavigationEngine();
        if (route !== 'launcher') {
          engine.navigate(route);
          expect(engine.getCurrentRoute()).toBe(route);
        }
      }
    });
  });

  // ─── goBack — 需求 21.4 ───

  describe('goBack (需求 21.4)', () => {
    it('returns to previous route', () => {
      nav.navigate('camera');
      nav.goBack();
      expect(nav.getCurrentRoute()).toBe('launcher');
    });

    it('pops routes in LIFO order', () => {
      nav.navigate('music');
      nav.navigate('settings');
      nav.navigate('health');
      nav.goBack();
      expect(nav.getCurrentRoute()).toBe('settings');
      nav.goBack();
      expect(nav.getCurrentRoute()).toBe('music');
    });

    it('does nothing when already at launcher (stack bottom)', () => {
      nav.goBack();
      expect(nav.getCurrentRoute()).toBe('launcher');
      expect(nav.getHistory()).toEqual(['launcher']);
    });

    it('does not go below launcher after multiple goBack calls', () => {
      nav.navigate('camera');
      nav.goBack();
      nav.goBack();
      nav.goBack();
      expect(nav.getCurrentRoute()).toBe('launcher');
      expect(nav.getHistory()).toEqual(['launcher']);
    });
  });

  // ─── goHome — 需求 5.5 ───

  describe('goHome (需求 5.5)', () => {
    it('returns to launcher from any route', () => {
      nav.navigate('ar_navigation');
      nav.goHome();
      expect(nav.getCurrentRoute()).toBe('launcher');
    });

    it('clears the entire history stack', () => {
      nav.navigate('music');
      nav.navigate('settings');
      nav.navigate('health');
      nav.goHome();
      expect(nav.getHistory()).toEqual(['launcher']);
    });

    it('is a no-op when already at launcher with clean stack', () => {
      const cb = vi.fn();
      nav.onRouteChange(cb);
      nav.goHome();
      expect(cb).not.toHaveBeenCalled();
      expect(nav.getHistory()).toEqual(['launcher']);
    });
  });

  // ─── onRouteChange callback ───

  describe('onRouteChange', () => {
    it('fires callback on navigate', () => {
      const cb = vi.fn();
      nav.onRouteChange(cb);
      nav.navigate('camera');
      expect(cb).toHaveBeenCalledWith('camera', 'launcher');
    });

    it('fires callback on goBack', () => {
      nav.navigate('music');
      const cb = vi.fn();
      nav.onRouteChange(cb);
      nav.goBack();
      expect(cb).toHaveBeenCalledWith('launcher', 'music');
    });

    it('fires callback on goHome', () => {
      nav.navigate('settings');
      nav.navigate('health');
      const cb = vi.fn();
      nav.onRouteChange(cb);
      nav.goHome();
      expect(cb).toHaveBeenCalledWith('launcher', 'health');
    });

    it('does not fire when navigate is a no-op (same route)', () => {
      nav.navigate('camera');
      const cb = vi.fn();
      nav.onRouteChange(cb);
      nav.navigate('camera');
      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      nav.onRouteChange(cb1);
      nav.onRouteChange(cb2);
      nav.navigate('translator');
      expect(cb1).toHaveBeenCalledWith('translator', 'launcher');
      expect(cb2).toHaveBeenCalledWith('translator', 'launcher');
    });

    it('removes callback with offRouteChange', () => {
      const cb = vi.fn();
      nav.onRouteChange(cb);
      nav.offRouteChange(cb);
      nav.navigate('camera');
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ─── getHistory immutability ───

  describe('getHistory immutability', () => {
    it('returns a copy, not the internal stack', () => {
      const history = nav.getHistory();
      history.push('hacked');
      expect(nav.getHistory()).toEqual(['launcher']);
    });
  });

  // ─── destroy ───

  describe('destroy', () => {
    it('clears callbacks and resets stack', () => {
      nav.navigate('camera');
      const cb = vi.fn();
      nav.onRouteChange(cb);
      nav.destroy();
      expect(nav.getCurrentRoute()).toBe('launcher');
      expect(nav.getHistory()).toEqual(['launcher']);
      // Callback should be cleared
      nav.navigate('music');
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ─── AVAILABLE_ROUTES ───

  describe('AVAILABLE_ROUTES', () => {
    it('contains launcher as the first route', () => {
      expect(AVAILABLE_ROUTES[0]).toBe('launcher');
    });

    it('contains 13 routes', () => {
      expect(AVAILABLE_ROUTES).toHaveLength(13);
    });

    it('all routes are unique', () => {
      expect(new Set(AVAILABLE_ROUTES).size).toBe(AVAILABLE_ROUTES.length);
    });
  });
});
