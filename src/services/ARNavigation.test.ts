import { describe, it, expect, beforeEach } from 'vitest';
import { ARNavigation } from './ARNavigation';
import type { Location } from '../types/navigation';

/**
 * ARNavigation 单元测试
 * 需求: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

const DEST: Location = { lat: 39.92, lng: 116.42, name: '天安门广场' };

describe('ARNavigation', () => {
  let nav: ARNavigation;

  beforeEach(() => {
    nav = new ARNavigation();
  });

  // ─── 初始状态 ───

  describe('初始状态', () => {
    it('navigation is inactive by default', () => {
      const state = nav.getNavigationState();
      expect(state.isActive).toBe(false);
    });

    it('has no current route by default', () => {
      expect(nav.getCurrentRoute()).toBeNull();
    });

    it('GPS signal defaults to strong', () => {
      expect(nav.getNavigationState().gpsSignal).toBe('strong');
    });
  });

  // ─── planRoute — 需求 11.1 ───

  describe('planRoute (需求 11.1)', () => {
    it('returns a route with correct origin and destination', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      expect(route.destination).toEqual(DEST);
      expect(route.origin.name).toBe('当前位置');
    });

    it('returns a route with waypoints', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      expect(route.waypoints.length).toBeGreaterThan(0);
    });

    it('returns a route with positive distance', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      expect(route.distance).toBeGreaterThan(0);
    });

    it('returns a route with positive estimated time', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      expect(route.estimatedTime).toBeGreaterThan(0);
    });

    it('respects the mode parameter', async () => {
      const walkRoute = await nav.planRoute(DEST, 'walk');
      const bikeRoute = await nav.planRoute(DEST, 'bike');
      expect(walkRoute.mode).toBe('walk');
      expect(bikeRoute.mode).toBe('bike');
      // Bike should have shorter estimated time
      expect(bikeRoute.estimatedTime).toBeLessThan(walkRoute.estimatedTime);
    });
  });

  // ─── startNavigation — 需求 11.2 ───

  describe('startNavigation (需求 11.2)', () => {
    it('activates navigation', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      expect(nav.getNavigationState().isActive).toBe(true);
    });

    it('sets current position to route origin', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      expect(nav.getNavigationState().currentPosition).toEqual(route.origin);
    });

    it('provides next turn instruction', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      const state = nav.getNavigationState();
      expect(state.nextTurn).toBeDefined();
      expect(state.nextTurn.distance).toBeGreaterThan(0);
      expect(['left', 'right', 'straight', 'uturn']).toContain(state.nextTurn.direction);
    });

    it('sets remaining distance', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      expect(nav.getNavigationState().remainingDistance).toBe(route.distance);
    });

    it('sets estimated arrival in the future', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      expect(nav.getNavigationState().estimatedArrival).toBeGreaterThan(Date.now() - 1000);
    });

    it('stores the current route', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      expect(nav.getCurrentRoute()).toEqual(route);
    });
  });

  // ─── stopNavigation ───

  describe('stopNavigation', () => {
    it('deactivates navigation', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      nav.stopNavigation();
      expect(nav.getNavigationState().isActive).toBe(false);
    });

    it('clears current route', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      nav.stopNavigation();
      expect(nav.getCurrentRoute()).toBeNull();
    });
  });

  // ─── updatePosition — 需求 11.3 ───

  describe('updatePosition (需求 11.3)', () => {
    it('updates current position', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      const newPos: Location = { lat: 39.91, lng: 116.41 };
      nav.updatePosition(newPos);
      expect(nav.getNavigationState().currentPosition).toEqual(newPos);
    });

    it('updates remaining distance', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      const initialDist = nav.getNavigationState().remainingDistance;
      // Move closer to destination
      nav.updatePosition({ lat: 39.915, lng: 116.415 });
      const newDist = nav.getNavigationState().remainingDistance;
      expect(newDist).not.toBe(initialDist);
    });

    it('returns false when not deviated', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      // Move to a waypoint (on route)
      const deviated = nav.updatePosition(route.waypoints[0]);
      expect(deviated).toBe(false);
    });

    it('returns true when deviated far from route', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      // Move far away from route
      const deviated = nav.updatePosition({ lat: 40.0, lng: 117.0 });
      expect(deviated).toBe(true);
    });

    it('returns false when navigation is not active', () => {
      const deviated = nav.updatePosition({ lat: 39.91, lng: 116.41 });
      expect(deviated).toBe(false);
    });
  });

  // ─── reroute — 需求 11.4 ───

  describe('reroute (需求 11.4)', () => {
    it('returns a new route from current position', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      nav.updatePosition({ lat: 39.91, lng: 116.41 });
      const newRoute = await nav.reroute();
      expect(newRoute.origin.lat).toBe(39.91);
      expect(newRoute.destination).toEqual(DEST);
    });

    it('updates remaining distance after reroute', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      nav.updatePosition({ lat: 39.91, lng: 116.41 });
      await nav.reroute();
      const state = nav.getNavigationState();
      expect(state.remainingDistance).toBeGreaterThan(0);
    });

    it('throws when no active navigation', async () => {
      await expect(nav.reroute()).rejects.toThrow('No active navigation to reroute');
    });

    it('preserves the navigation mode', async () => {
      const route = await nav.planRoute(DEST, 'bike');
      nav.startNavigation(route);
      const newRoute = await nav.reroute();
      expect(newRoute.mode).toBe('bike');
    });
  });

  // ─── setGpsSignal — 需求 11.6 ───

  describe('setGpsSignal (需求 11.6)', () => {
    it('updates GPS signal to weak', () => {
      nav.setGpsSignal('weak');
      expect(nav.getNavigationState().gpsSignal).toBe('weak');
    });

    it('updates GPS signal to lost', () => {
      nav.setGpsSignal('lost');
      expect(nav.getNavigationState().gpsSignal).toBe('lost');
    });

    it('can restore GPS signal to strong', () => {
      nav.setGpsSignal('lost');
      nav.setGpsSignal('strong');
      expect(nav.getNavigationState().gpsSignal).toBe('strong');
    });
  });

  // ─── getNavigationState 不可变性 ───

  describe('getNavigationState immutability', () => {
    it('returns a copy, not the internal state', async () => {
      const route = await nav.planRoute(DEST, 'walk');
      nav.startNavigation(route);
      const state = nav.getNavigationState();
      state.isActive = false;
      expect(nav.getNavigationState().isActive).toBe(true);
    });
  });
});
