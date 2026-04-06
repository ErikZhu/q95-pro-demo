/**
 * ARNavigation — AR 导航服务
 *
 * 路线规划、导航状态管理、偏离重新规划、GPS 信号丢失处理。
 * Demo 中使用模拟数据。
 *
 * 需求: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import type { Location, Route, NavigationState, TurnInstruction } from '../types/navigation';

/** 模拟路线规划延迟（ms） */
const PLAN_ROUTE_DELAY = 800;
/** 偏离重新规划延迟（ms） */
const REROUTE_DELAY = 600;
/** 偏离阈值（米） */
const DEVIATION_THRESHOLD = 50;

/** 模拟街道名称 */
const STREET_NAMES = ['中山路', '人民大道', '解放路', '建设路', '和平街', '科技大道'];

/** 生成模拟路线航点 */
function generateWaypoints(origin: Location, destination: Location, count: number): Location[] {
  const waypoints: Location[] = [];
  for (let i = 1; i <= count; i++) {
    const ratio = i / (count + 1);
    waypoints.push({
      lat: origin.lat + (destination.lat - origin.lat) * ratio,
      lng: origin.lng + (destination.lng - origin.lng) * ratio,
      name: STREET_NAMES[i % STREET_NAMES.length],
    });
  }
  return waypoints;
}

/** 计算两点间的简化距离（米） */
function calcDistance(a: Location, b: Location): number {
  const dlat = (b.lat - a.lat) * 111320;
  const dlng = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

/** 生成下一个转弯指令 */
function generateNextTurn(_waypoints: Location[], waypointIndex: number): TurnInstruction {
  const directions: TurnInstruction['direction'][] = ['left', 'right', 'straight', 'uturn'];
  return {
    direction: directions[waypointIndex % directions.length],
    distance: 80 + waypointIndex * 30,
    streetName: STREET_NAMES[waypointIndex % STREET_NAMES.length],
  };
}

export class ARNavigation {
  private state: NavigationState;
  private currentRoute: Route | null = null;
  private waypointIndex = 0;

  constructor() {
    this.state = {
      isActive: false,
      currentPosition: { lat: 0, lng: 0 },
      nextTurn: { direction: 'straight', distance: 0 },
      remainingDistance: 0,
      estimatedArrival: 0,
      gpsSignal: 'strong',
    };
  }

  /**
   * 规划路线 — 需求 11.1
   * 在 3 秒内规划路线并返回。Demo 模拟延迟约 800ms。
   */
  async planRoute(destination: Location, mode: 'walk' | 'bike'): Promise<Route> {
    const origin = this.state.currentPosition.lat !== 0
      ? this.state.currentPosition
      : { lat: 39.9042, lng: 116.4074, name: '当前位置' };

    await new Promise((resolve) => setTimeout(resolve, PLAN_ROUTE_DELAY));

    const waypoints = generateWaypoints(origin, destination, 4);
    const distance = calcDistance(origin, destination);
    const speed = mode === 'walk' ? 1.4 : 4.2; // m/s
    const estimatedTime = Math.round(distance / speed);

    const route: Route = {
      origin,
      destination,
      waypoints,
      distance: Math.round(distance),
      estimatedTime,
      mode,
    };

    return route;
  }

  /**
   * 开始导航 — 需求 11.2, 11.3
   * 在视野中叠加显示方向箭头、距离和预计到达时间。
   */
  startNavigation(route: Route): void {
    this.currentRoute = route;
    this.waypointIndex = 0;

    this.state = {
      isActive: true,
      currentPosition: route.origin,
      nextTurn: generateNextTurn(route.waypoints, 0),
      remainingDistance: route.distance,
      estimatedArrival: Date.now() + route.estimatedTime * 1000,
      gpsSignal: 'strong',
    };
  }

  /** 停止导航 */
  stopNavigation(): void {
    this.state.isActive = false;
    this.currentRoute = null;
    this.waypointIndex = 0;
  }

  /** 获取当前导航状态 — 需求 11.2, 11.3 */
  getNavigationState(): NavigationState {
    return { ...this.state };
  }

  /**
   * 重新规划路线 — 需求 11.4
   * 用户偏离规划路线时，在 2 秒内重新规划。Demo 模拟延迟约 600ms。
   */
  async reroute(): Promise<Route> {
    if (!this.currentRoute) {
      throw new Error('No active navigation to reroute');
    }

    await new Promise((resolve) => setTimeout(resolve, REROUTE_DELAY));

    const newWaypoints = generateWaypoints(
      this.state.currentPosition,
      this.currentRoute.destination,
      3,
    );
    const newDistance = calcDistance(this.state.currentPosition, this.currentRoute.destination);
    const speed = this.currentRoute.mode === 'walk' ? 1.4 : 4.2;
    const estimatedTime = Math.round(newDistance / speed);

    const newRoute: Route = {
      origin: this.state.currentPosition,
      destination: this.currentRoute.destination,
      waypoints: newWaypoints,
      distance: Math.round(newDistance),
      estimatedTime,
      mode: this.currentRoute.mode,
    };

    this.currentRoute = newRoute;
    this.waypointIndex = 0;
    this.state.remainingDistance = newRoute.distance;
    this.state.estimatedArrival = Date.now() + estimatedTime * 1000;
    this.state.nextTurn = generateNextTurn(newWaypoints, 0);

    return newRoute;
  }

  /**
   * 更新当前位置 — 需求 11.3
   * 根据用户位置实时更新导航指引。
   * 返回是否偏离路线。
   */
  updatePosition(position: Location): boolean {
    this.state.currentPosition = position;

    if (!this.state.isActive || !this.currentRoute) return false;

    // 更新剩余距离
    this.state.remainingDistance = Math.round(
      calcDistance(position, this.currentRoute.destination),
    );

    // 检查是否到达下一个航点
    const waypoints = this.currentRoute.waypoints;
    if (this.waypointIndex < waypoints.length) {
      const nextWp = waypoints[this.waypointIndex];
      if (calcDistance(position, nextWp) < 20) {
        this.waypointIndex++;
        if (this.waypointIndex < waypoints.length) {
          this.state.nextTurn = generateNextTurn(waypoints, this.waypointIndex);
        } else {
          this.state.nextTurn = {
            direction: 'straight',
            distance: this.state.remainingDistance,
            streetName: this.currentRoute.destination.name,
          };
        }
      }
    }

    // 检查偏离 — 需求 11.4
    const isDeviated = this.checkDeviation(position);
    return isDeviated;
  }

  /**
   * 设置 GPS 信号状态 — 需求 11.6
   * GPS 信号丢失时显示提示并使用最近已知位置继续导航。
   */
  setGpsSignal(signal: NavigationState['gpsSignal']): void {
    this.state.gpsSignal = signal;
  }

  /** 获取当前路线 */
  getCurrentRoute(): Route | null {
    return this.currentRoute ? { ...this.currentRoute } : null;
  }

  /** 检查是否偏离路线 */
  private checkDeviation(position: Location): boolean {
    if (!this.currentRoute) return false;

    const allPoints = [
      this.currentRoute.origin,
      ...this.currentRoute.waypoints,
      this.currentRoute.destination,
    ];

    // 找到距离路线最近的点
    let minDist = Infinity;
    for (const point of allPoints) {
      const dist = calcDistance(position, point);
      if (dist < minDist) minDist = dist;
    }

    return minDist > DEVIATION_THRESHOLD;
  }
}
