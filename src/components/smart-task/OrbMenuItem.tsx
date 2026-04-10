/**
 * OrbMenuItem — Orb 环形菜单项组件
 *
 * 渲染单个菜单项：图标 + 名称标签，支持聚焦高亮、活跃指示、展开/收起动画。
 *
 * 动画设计：
 *   - 展开：从 Orb 中心沿径向弹出，30ms 间隔递增
 *   - 收起：从外到内收回，20ms 间隔递增
 *   - 缓动曲线：cubic-bezier(0.34, 1.56, 0.64, 1)
 *
 * 需求: 3.3, 4.1, 4.5, 7.1, 7.2, 7.4, 7.5, 8.1, 8.3
 */

import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/Icon';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

/** 菜单项数据 */
export interface OrbMenuItemData {
  id: string;
  icon: IconName;
  label: string;
  route: string;
}

/** 菜单项组件 Props */
export interface OrbMenuItemProps {
  item: OrbMenuItemData;
  position: { x: number; y: number };
  isFocused: boolean;
  isActive: boolean;
  animationDelay: number;
  menuState: OrbMenuState;
  onClick?: (item: OrbMenuItemData) => void;
}

/** 弹性缓动曲线 */
const ELASTIC_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** 菜单项统一尺寸 */
const ITEM_SIZE = 42;
const ICON_SIZE = 18;
const ACTIVE_DOT_SIZE = 4;

export function OrbMenuItem({
  item,
  position,
  isFocused,
  isActive,
  animationDelay,
  menuState,
  onClick,
}: OrbMenuItemProps) {
  const isVisible = menuState === 'orb_menu_open' || menuState === 'orb_item_focused';

  /* ── 容器样式：绝对定位 + 展开/收起动画 ── */
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    transform: isVisible
      ? 'translate(-50%, -50%) scale(1)'
      : 'translate(-50%, -50%) scale(0)',
    opacity: isVisible ? 1 : 0,
    width: ITEM_SIZE,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    cursor: 'pointer',
    userSelect: 'none',
    transition: `transform 300ms ${ELASTIC_EASING}, opacity 300ms ease`,
    transitionDelay: `${animationDelay}ms`,
    pointerEvents: isVisible ? 'auto' : 'none',
  };

  /* ── 图标容器样式：聚焦高亮 ── */
  const iconContainerStyle: React.CSSProperties = {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isFocused
      ? 'rgba(110, 54, 238, 0.2)'
      : 'rgba(255, 255, 255, 0.08)',
    border: isFocused
      ? '1.5px solid rgba(110, 54, 238, 0.7)'
      : '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: isFocused
      ? '0 0 12px rgba(110, 54, 238, 0.5), 0 0 24px rgba(110, 54, 238, 0.2)'
      : 'none',
    transition: `transform 200ms ease, box-shadow 200ms ease, border 200ms ease, background 200ms ease`,
    transform: isFocused ? 'scale(1.15)' : 'scale(1)',
  };

  /* ── 标签样式 ── */
  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: isFocused ? 'rgba(110, 54, 238, 1)' : 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
    transition: 'color 200ms ease',
  };

  /* ── 活跃指示小圆点 ── */
  const activeDotStyle: React.CSSProperties = {
    width: ACTIVE_DOT_SIZE,
    height: ACTIVE_DOT_SIZE,
    borderRadius: '50%',
    background: 'rgba(110, 54, 238, 0.9)',
    boxShadow: '0 0 4px rgba(110, 54, 238, 0.6)',
  };

  return (
    <div
      data-testid={`orb-menu-item-${item.id}`}
      data-focused={isFocused}
      data-active={isActive}
      data-menu-state={menuState}
      style={containerStyle}
      onClick={() => onClick?.(item)}
    >
      <div data-testid={`orb-menu-item-icon-${item.id}`} style={iconContainerStyle}>
        <Icon
          name={item.icon}
          size={ICON_SIZE}
          color={isFocused ? 'rgba(110, 54, 238, 1)' : 'rgba(255, 255, 255, 0.8)'}
        />
      </div>
      <span data-testid={`orb-menu-item-label-${item.id}`} style={labelStyle}>
        {item.label}
      </span>
      {isActive && (
        <div
          data-testid={`orb-menu-item-active-dot-${item.id}`}
          style={activeDotStyle}
        />
      )}
    </div>
  );
}
