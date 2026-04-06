import type { InfoCard } from '../../types/data';

/**
 * FlightCard — 机票航班信息卡片
 * 需求 20.3: 显示航班号、登机口和起飞时间
 */

export interface FlightCardProps {
  card: InfoCard;
  data?: {
    flightNo?: string;
    airline?: string;
    departure?: { city?: string; airport?: string; time?: string; gate?: string };
    arrival?: { city?: string; airport?: string; time?: string };
    status?: 'on_time' | 'delayed' | 'boarding' | 'departed';
  };
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  on_time: { text: '准点', color: 'rgba(100, 220, 160, 0.95)' },
  delayed: { text: '延误', color: 'rgba(255, 160, 80, 0.95)' },
  boarding: { text: '登机中', color: 'rgba(80, 195, 247, 0.95)' },
  departed: { text: '已起飞', color: 'rgba(255, 255, 255, 0.5)' },
};

const S = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 },
  flightNo: { fontWeight: 600 as const, fontSize: 12, color: 'rgba(100, 200, 255, 0.9)' },
  routeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  city: { fontSize: 14, fontWeight: 600 as const, textAlign: 'center' as const },
  time: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' as const, fontFamily: "'SF Mono', 'Fira Code', monospace" },
  arrow: { fontSize: 14, color: 'rgba(100, 200, 255, 0.3)' },
  gate: { fontSize: 11, color: 'rgba(255, 180, 60, 0.9)' },
};

export function FlightCardView({ card, data }: FlightCardProps) {
  const statusInfo = STATUS_LABELS[data?.status ?? 'on_time'] ?? STATUS_LABELS.on_time;

  return (
    <div style={S.root} data-testid="flight-card">
      <div style={S.headerRow}>
        <span style={S.flightNo}>✈ {data?.flightNo ?? card.title}</span>
        <span style={{ fontSize: 11, color: statusInfo.color }}>{statusInfo.text}</span>
      </div>
      <div style={S.routeRow}>
        <div>
          <div style={S.city}>{data?.departure?.city ?? '--'}</div>
          <div style={S.time}>{data?.departure?.time ?? ''}</div>
        </div>
        <span style={S.arrow}>→</span>
        <div>
          <div style={S.city}>{data?.arrival?.city ?? '--'}</div>
          <div style={S.time}>{data?.arrival?.time ?? ''}</div>
        </div>
      </div>
      {data?.departure?.gate && (
        <div style={S.gate}>登机口: {data.departure.gate}</div>
      )}
    </div>
  );
}
