import type { InfoCard } from '../../types/data';
import { Icon } from '../icons/Icon';

/**
 * RideCard — 打车订单卡片
 * 需求 20.3: 显示司机位置和预计到达时间
 */

export interface RideCardProps {
  card: InfoCard;
  data?: {
    driverName?: string;
    carInfo?: string;
    estimatedArrival?: number;
  };
}

const S = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  driverRow: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'rgba(100, 200, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, border: '1px solid rgba(100, 200, 255, 0.15)' },
  driverInfo: { flex: 1, minWidth: 0 },
  driverName: { fontSize: 13, fontWeight: 600 as const },
  carInfo: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const },
  eta: { fontSize: 12, color: 'rgba(80, 220, 160, 0.95)', fontWeight: 600 as const },
};

export function RideCardView({ card: _card, data }: RideCardProps) {
  return (
    <div style={S.root} data-testid="ride-card">
      <div style={S.driverRow}>
        <div style={S.avatar}><Icon name="car" size={14} /></div>
        <div style={S.driverInfo}>
          <div style={S.driverName}>{data?.driverName ?? '等待接单'}</div>
          {data?.carInfo && <div style={S.carInfo}>{data.carInfo}</div>}
        </div>
      </div>
      {data?.estimatedArrival != null && (
        <div style={S.eta}>预计 {data.estimatedArrival} 分钟到达</div>
      )}
    </div>
  );
}
