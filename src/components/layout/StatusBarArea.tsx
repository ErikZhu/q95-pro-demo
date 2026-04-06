import type { ReactNode } from 'react';
import { Icon } from '../icons/Icon';

/**
 * StatusBarArea — 右上角设备状态栏占位组件
 *
 * 持续展示电量、蓝牙连接状态、Wi-Fi 状态和当前时间的占位区域。
 * 接受 children 以便后续注入实际状态栏内容。
 *
 * 需求: 2.1, 2.4, 2.5
 */

interface StatusBarAreaProps {
  children?: ReactNode;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
    gap: 8,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    userSelect: 'none',
    overflow: 'hidden',
  },
  icon: {
    fontSize: 14,
    opacity: 0.8,
  },
};

export function StatusBarArea({ children }: StatusBarAreaProps) {
  return (
    <div style={styles.container} data-testid="status-bar-area">
      {children ?? (
        <>
          <span style={styles.icon} aria-label="Wi-Fi"><Icon name="wifi" size={14} /></span>
          <span style={styles.icon} aria-label="Bluetooth"><Icon name="bluetooth" size={14} /></span>
          <span style={styles.icon} aria-label="Battery"><Icon name="battery" size={14} /></span>
          <span>12:00</span>
        </>
      )}
    </div>
  );
}
