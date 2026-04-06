/**
 * NavigationEngine — 全局导航与路由管理
 *
 * 管理页面跳转路由逻辑，维护路由历史栈，
 * 支持从任意应用一键返回主界面（launcher）。
 *
 * 需求: 5.5, 21.4
 */

/** 所有可用路由 */
export const AVAILABLE_ROUTES = [
  'launcher',
  'notification_center',
  'ar_navigation',
  'camera',
  'music',
  'translator',
  'teleprompter',
  'health',
  'messaging',
  'settings',
  'app_store',
  'ai_assistant',
  'phone_relay',
] as const;

export type AppRoute = (typeof AVAILABLE_ROUTES)[number];

export type RouteChangeCallback = (route: string, previousRoute: string) => void;

export class NavigationEngine {
  private stack: string[] = ['launcher'];
  private routeChangeCallbacks: RouteChangeCallback[] = [];

  /** 获取当前路由 */
  getCurrentRoute(): string {
    return this.stack[this.stack.length - 1];
  }

  /** 获取路由历史（栈的副本） */
  getHistory(): string[] {
    return [...this.stack];
  }

  /**
   * 导航到指定路由 — 需求 21.4
   * 将新路由压入栈顶。如果目标路由与当前路由相同则忽略。
   */
  navigate(route: string): void {
    if (!AVAILABLE_ROUTES.includes(route as AppRoute)) {
      throw new Error(`Unknown route: ${route}`);
    }
    const previous = this.getCurrentRoute();
    if (route === previous) return;
    this.stack.push(route);
    this.emitRouteChange(route, previous);
  }

  /**
   * 返回上一页 — 需求 21.4
   * 弹出栈顶路由。如果栈中只剩 launcher 则不做任何操作。
   */
  goBack(): void {
    if (this.stack.length <= 1) return;
    const previous = this.stack.pop()!;
    this.emitRouteChange(this.getCurrentRoute(), previous);
  }

  /**
   * 一键返回主界面 — 需求 5.5
   * 清空栈并回到 launcher。
   */
  goHome(): void {
    const previous = this.getCurrentRoute();
    if (previous === 'launcher' && this.stack.length === 1) return;
    this.stack = ['launcher'];
    this.emitRouteChange('launcher', previous);
  }

  /** 注册路由变化回调 */
  onRouteChange(callback: RouteChangeCallback): void {
    this.routeChangeCallbacks.push(callback);
  }

  /** 移除路由变化回调 */
  offRouteChange(callback: RouteChangeCallback): void {
    this.routeChangeCallbacks = this.routeChangeCallbacks.filter((cb) => cb !== callback);
  }

  /** 销毁实例，清理回调 */
  destroy(): void {
    this.routeChangeCallbacks = [];
    this.stack = ['launcher'];
  }

  private emitRouteChange(route: string, previousRoute: string): void {
    for (const cb of this.routeChangeCallbacks) {
      cb(route, previousRoute);
    }
  }
}
