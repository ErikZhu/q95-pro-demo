import type { ReactNode } from 'react';

/**
 * MainTaskArea — 中央主任务区组件
 *
 * 占据屏幕中央主要区域，用于显示当前活跃应用或功能的核心内容。
 * 接受 children 作为应用内容注入点。
 *
 * 需求: 2.1, 2.2, 2.5
 */

interface MainTaskAreaProps {
  children?: ReactNode;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'system-ui, sans-serif',
    overflow: 'auto',
  },
};

export function MainTaskArea({ children }: MainTaskAreaProps) {
  return (
    <div style={styles.container} data-testid="main-task-area">
      {children ?? <span>主任务区</span>}
    </div>
  );
}
