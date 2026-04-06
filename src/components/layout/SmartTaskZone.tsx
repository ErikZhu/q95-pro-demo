import type { ReactNode } from 'react';

/**
 * SmartTaskZone — 左上角智能任务区占位组件
 *
 * 默认以紧凑模式展示 AI_Status_Orb 和当前任务摘要的占位区域。
 * 接受 children 以便后续注入实际内容（AIStatusOrb、任务摘要等）。
 *
 * 需求: 2.1, 2.3, 2.5
 */

interface SmartTaskZoneProps {
  children?: ReactNode;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    userSelect: 'none',
    overflow: 'hidden',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  orb: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(100,200,255,0.8) 0%, rgba(60,140,220,0.4) 100%)',
    boxShadow: '0 0 8px rgba(100,200,255,0.5)',
  },
};

export function SmartTaskZone({ children }: SmartTaskZoneProps) {
  return (
    <div style={styles.container} data-testid="smart-task-zone">
      {children ?? (
        <div style={styles.placeholder}>
          <div style={styles.orb} aria-label="AI Status Orb" />
          <span>智能任务区</span>
        </div>
      )}
    </div>
  );
}
