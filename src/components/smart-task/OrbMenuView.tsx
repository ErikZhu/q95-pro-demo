/**
 * OrbMenuView — Orb 环形菜单容器组件
 *
 * 围绕 AI_Status_Orb 渲染环形菜单面板：
 *   - 半透明毛玻璃背景
 *   - 根据 menuState 控制展开/收起
 *   - 使用极坐标算法计算菜单项位置
 *   - 展开动画：菜单项从 Orb 中心沿径向弹出，30ms 延迟递增
 *   - 收起动画：菜单项从外到内收回，20ms 延迟递增，250ms 内完成
 *
 * 需求: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 5.5, 7.1, 7.2, 7.4, 7.6
 */

import { calculateRadialPositions, clampToViewport } from '../../utils/radialLayout';
import { OrbMenuItem } from './OrbMenuItem';
import type { OrbMenuItemData } from './OrbMenuItem';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

export interface OrbMenuViewProps {
  menuState: OrbMenuState;
  menuItems: OrbMenuItemData[];
  focusedItemId: string | null;
  activeAppId: string | null;
  orbPosition: { x: number; y: number };
  onGazeItem?: (itemId: string) => void;
  onGazeItemEnd?: () => void;
  onConfirmSelect?: (source: 'nod' | 'emg_pinch' | 'side_touchpad') => void;
}

/** 菜单展开半径 */
const MENU_RADIUS = 80;
/** 展开时每项延迟增量 (ms) */
const EXPAND_DELAY_STEP = 30;
/** 收起时每项延迟增量 (ms) */
const COLLAPSE_DELAY_STEP = 20;

export function OrbMenuView({
  menuState,
  menuItems,
  focusedItemId,
  activeAppId,
  orbPosition,
}: OrbMenuViewProps) {
  const isVisible = menuState === 'orb_menu_open' || menuState === 'orb_item_focused';

  // 计算菜单项的径向位置 — 360° 均匀环绕 Orb
  const ITEM_SIZE = 42;
  const rawPositions = calculateRadialPositions({
    centerX: orbPosition.x,
    centerY: orbPosition.y,
    radius: MENU_RADIUS,
    startAngle: 0,
    endAngle: 360 - (360 / menuItems.length),
    itemCount: menuItems.length,
    viewportWidth: 800,
    viewportHeight: 600,
  });
  const positions = clampToViewport(rawPositions, ITEM_SIZE, { width: 800, height: 600 });

  /* ── 容器样式 ── */
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: isVisible ? 'auto' : 'none',
    zIndex: 1000,
  };

  /* ── 毛玻璃背景样式 ── */
  const backdropStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 250ms ease',
    pointerEvents: isVisible ? 'auto' : 'none',
  };

  return (
    <div data-testid="orb-menu-view" style={containerStyle}>
      <div data-testid="orb-menu-backdrop" style={backdropStyle} />
      {menuItems.map((item, index) => {
        const position = positions[index] ?? { x: orbPosition.x, y: orbPosition.y };
        const isExpanding = isVisible;
        const animationDelay = isExpanding
          ? index * EXPAND_DELAY_STEP
          : (menuItems.length - 1 - index) * COLLAPSE_DELAY_STEP;

        return (
          <OrbMenuItem
            key={item.id}
            item={item}
            position={position}
            isFocused={item.id === focusedItemId}
            isActive={item.id === activeAppId}
            animationDelay={animationDelay}
            menuState={menuState}
          />
        );
      })}
    </div>
  );
}
