import type { InfoCard } from '../../types/data';
import { Icon } from '../icons/Icon';

/**
 * CalendarCard — 日程提醒卡片
 * 需求 20.5: 在事件开始前按用户设定的提前时间显示日程提醒
 */

export interface CalendarCardProps {
  card: InfoCard;
  data?: {
    title?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  };
}

const S = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  title: { fontSize: 13, fontWeight: 600 as const },
  timeRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(110, 54, 238, 0.8)' },
  location: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' },
};

export function CalendarCardView({ card, data }: CalendarCardProps) {
  return (
    <div style={S.root} data-testid="calendar-card">
      <div style={S.title}><Icon name="calendar" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{data?.title ?? card.title}</div>
      <div style={S.timeRow}>
        <span>{data?.startTime ?? '--:--'}</span>
        {data?.endTime && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
            <span>{data.endTime}</span>
          </>
        )}
      </div>
      {data?.location && (
        <div style={S.location}><Icon name="pin" size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />{data.location}</div>
      )}
    </div>
  );
}
