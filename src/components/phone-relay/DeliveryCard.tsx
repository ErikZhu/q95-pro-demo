import type { InfoCard } from '../../types/data';

/**
 * DeliveryCard — 外卖配送进度卡片
 * 需求 20.3, 20.4: 差异化布局，实时更新配送进度
 */

export interface DeliveryCardProps {
  card: InfoCard;
  data?: {
    storeName?: string;
    status?: 'preparing' | 'picked_up' | 'delivering' | 'arrived';
    riderName?: string;
    estimatedTime?: number;
    progress?: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  preparing: '准备中',
  picked_up: '骑手已取餐',
  delivering: '配送中',
  arrived: '已送达',
};

const S = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 },
  statusLabel: { color: 'rgba(80, 220, 160, 0.95)', fontWeight: 600 as const },
  eta: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontFamily: "'SF Mono', 'Fira Code', monospace" },
  progressBar: { height: 3, borderRadius: 2, background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' as const },
  progressFill: (pct: number): React.CSSProperties => ({
    height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`,
    background: 'linear-gradient(90deg, rgba(100, 200, 255, 0.8), rgba(80, 220, 160, 0.8))', borderRadius: 2, transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  rider: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' },
};

export function DeliveryCardView({ card: _card, data }: DeliveryCardProps) {
  const status = data?.status ?? 'preparing';
  const progress = data?.progress ?? 0;

  return (
    <div style={S.root} data-testid="delivery-card">
      <div style={S.statusRow}>
        <span style={S.statusLabel}>{STATUS_LABELS[status] ?? status}</span>
        {data?.estimatedTime != null && (
          <span style={S.eta}>预计 {data.estimatedTime} 分钟</span>
        )}
      </div>
      <div style={S.progressBar}>
        <div style={S.progressFill(progress)} data-testid="delivery-progress" />
      </div>
      {data?.riderName && <div style={S.rider}>骑手: {data.riderName}</div>}
    </div>
  );
}
