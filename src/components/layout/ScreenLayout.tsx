import { useMemo, type ReactNode } from 'react';
import { LayoutManager } from '../../services/LayoutManager';
import { SmartTaskZone } from './SmartTaskZone';
import { StatusBarArea } from './StatusBarArea';
import { MainTaskArea } from './MainTaskArea';

/**
 * ScreenLayout — 三分区容器组件
 *
 * 使用 LayoutManager 的 getZoneBounds() 计算各分区位置，
 * 通过 CSS absolute positioning 实现三分区布局。
 * 分区常驻可见且不遮挡核心内容。
 *
 * 需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

interface ScreenLayoutProps {
  /** 主任务区内容 */
  children?: ReactNode;
  /** 智能任务区自定义内容 */
  smartTaskContent?: ReactNode;
  /** 状态栏自定义内容 */
  statusBarContent?: ReactNode;
  /** 屏幕宽度（默认 1280） */
  screenWidth?: number;
  /** 屏幕高度（默认 720） */
  screenHeight?: number;
}

export function ScreenLayout({
  children,
  smartTaskContent,
  statusBarContent,
  screenWidth = 1280,
  screenHeight = 720,
}: ScreenLayoutProps) {
  const layout = useMemo(
    () => new LayoutManager(screenWidth, screenHeight),
    [screenWidth, screenHeight],
  );

  const smartTaskBounds = layout.getZoneBounds('smart_task_zone');
  const statusBarBounds = layout.getZoneBounds('status_bar');
  const mainTaskBounds = layout.getZoneBounds('main_task_area');

  // Convert pixel bounds to percentage-based positioning for responsive scaling
  const pct = (px: number, base: number) => `${(px / base) * 100}%`;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: screenWidth,
    aspectRatio: `${screenWidth} / ${screenHeight}`,
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)',
    borderRadius: 8,
    overflow: 'hidden',
    margin: '0 auto',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
  };

  const zoneStyle = (bounds: { x: number; y: number; width: number; height: number }): React.CSSProperties => ({
    position: 'absolute',
    left: pct(bounds.x, screenWidth),
    top: pct(bounds.y, screenHeight),
    width: pct(bounds.width, screenWidth),
    height: pct(bounds.height, screenHeight),
    boxSizing: 'border-box',
  });

  const zoneBorderStyle: React.CSSProperties = {
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
    backdropFilter: 'blur(4px)',
    background: 'rgba(255, 255, 255, 0.04)',
  };

  return (
    <div style={containerStyle} data-testid="screen-layout">
      {/* 需求 2.3: Smart_Task_Zone 固定显示在屏幕左上角 */}
      <div
        style={{ ...zoneStyle(smartTaskBounds), ...zoneBorderStyle, zIndex: 10 }}
        data-testid="zone-smart-task"
      >
        <SmartTaskZone>{smartTaskContent}</SmartTaskZone>
      </div>

      {/* 需求 2.4: Status_Bar 固定显示在屏幕右上角 */}
      <div
        style={{ ...zoneStyle(statusBarBounds), ...zoneBorderStyle, zIndex: 10 }}
        data-testid="zone-status-bar"
      >
        <StatusBarArea>{statusBarContent}</StatusBarArea>
      </div>

      {/* 需求 2.2: Main_Task_Area 占据屏幕中央主要区域 */}
      <div
        style={{ ...zoneStyle(mainTaskBounds), zIndex: 1 }}
        data-testid="zone-main-task"
      >
        <MainTaskArea>{children}</MainTaskArea>
      </div>
    </div>
  );
}
