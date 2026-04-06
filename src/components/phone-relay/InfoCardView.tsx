import { useState, useCallback } from 'react';
import type { InfoCard, InfoCardDetail } from '../../types/data';
import { DeliveryCardView } from './DeliveryCard';
import { FlightCardView } from './FlightCard';
import { RideCardView } from './RideCard';
import { MusicCardView } from './MusicCard';
import { CalendarCardView } from './CalendarCard';
import { WechatCardView } from './WechatCard';

/**
 * InfoCardView — 通用卡片容器
 *
 * 渲染水平可滚动的卡片列表（模拟侧边触控滑动浏览），
 * 根据 InfoCard.template 分发到对应的卡片子组件，
 * 支持卡片选择展开详情。
 *
 * 需求: 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.11
 */

export interface InfoCardViewProps {
  /** 已排序的信息卡片列表 */
  cards: InfoCard[];
  /** 当前展开详情的卡片（null 表示无展开） */
  expandedDetail?: InfoCardDetail | null;
  /** 选择卡片回调 — 需求 20.8 */
  onSelectCard?: (cardId: string) => void;
  /** 关闭详情回调 */
  onCloseDetail?: () => void;
  /** 音乐播放控制回调 — 需求 20.11 */
  onMusicTogglePlay?: () => void;
  onMusicNext?: () => void;
  onMusicPrev?: () => void;
}

/* ── Inline styles ── */
const S = {
  root: { position: 'relative' as const, fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(255, 255, 255, 0.92)', userSelect: 'none' as const },
  scrollContainer: { display: 'flex', gap: 12, overflowX: 'auto' as const, overflowY: 'hidden' as const, padding: '8px 4px', scrollSnapType: 'x mandatory' as const, WebkitOverflowScrolling: 'touch' as const, scrollbarWidth: 'none' as const },
  card: (isSelected: boolean): React.CSSProperties => ({
    minWidth: 240, maxWidth: 280, flexShrink: 0,
    background: isSelected ? 'rgba(100, 200, 255, 0.06)' : 'rgba(10, 15, 30, 0.85)',
    backdropFilter: 'blur(16px)', borderRadius: 12, padding: '12px 14px',
    border: isSelected ? '1px solid rgba(100, 200, 255, 0.3)' : '1px solid rgba(100, 200, 255, 0.06)',
    cursor: 'pointer', scrollSnapAlign: 'start' as const,
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    display: 'flex', flexDirection: 'column' as const, gap: 8,
    boxShadow: isSelected ? '0 0 16px rgba(100, 200, 255, 0.06)' : 'none',
  }),
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 12, fontWeight: 600 as const, color: 'rgba(100, 200, 255, 0.8)', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, flex: 1 },
  cardTime: { fontSize: 10, color: 'rgba(255, 255, 255, 0.3)', flexShrink: 0, marginLeft: 8, fontFamily: "'SF Mono', 'Fira Code', monospace" },
  cardBody: { fontSize: 12 },
  detailOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detailPanel: { width: '88vw', maxWidth: 400, maxHeight: '80vh', background: 'rgba(10, 15, 30, 0.96)', backdropFilter: 'blur(24px)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' as const, gap: 12, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(100, 200, 255, 0.04)', border: '1px solid rgba(100, 200, 255, 0.1)', overflowY: 'auto' as const },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailTitle: { fontSize: 16, fontWeight: 600 as const, lineHeight: 1.3 },
  closeBtn: { background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(100, 200, 255, 0.12)', color: 'rgba(255, 255, 255, 0.6)', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer', transition: 'background 0.15s' },
  detailBody: { fontSize: 13, lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.75)', borderTop: '1px solid rgba(100, 200, 255, 0.06)', paddingTop: 12 },
  detailMeta: { fontSize: 11, color: 'rgba(255, 255, 255, 0.35)', fontFamily: "'SF Mono', 'Fira Code', monospace" },
  emptyState: { textAlign: 'center' as const, padding: '24px 16px', color: 'rgba(255, 255, 255, 0.3)', fontSize: 13 },
  indicator: { display: 'flex', justifyContent: 'center', gap: 6, padding: '6px 0' },
  dot: (active: boolean): React.CSSProperties => ({ width: 5, height: 5, borderRadius: '50%', background: active ? 'rgba(100, 200, 255, 0.9)' : 'rgba(255, 255, 255, 0.15)', transition: 'background 0.2s', boxShadow: active ? '0 0 6px rgba(100, 200, 255, 0.3)' : 'none' }),
};

/** Format timestamp to readable time */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Render card body based on template type */
function renderCardContent(
  card: InfoCard,
  detail: InfoCardDetail | null | undefined,
  musicCallbacks: {
    onTogglePlay?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
  },
): React.ReactNode {
  const data = detail?.data ?? {};

  switch (card.template) {
    case 'delivery_progress':
      return <DeliveryCardView card={card} data={data as any} />;
    case 'flight_board':
      return <FlightCardView card={card} data={data as any} />;
    case 'ride_status':
      return <RideCardView card={card} data={data as any} />;
    case 'music_player':
      return (
        <MusicCardView
          card={card}
          data={data as any}
          onTogglePlay={musicCallbacks.onTogglePlay}
          onNext={musicCallbacks.onNext}
          onPrev={musicCallbacks.onPrev}
        />
      );
    case 'calendar_event':
      return <CalendarCardView card={card} data={data as any} />;
    case 'wechat_message':
      return <WechatCardView card={card} data={data as any} />;
    default:
      return <div style={{ fontSize: 12 }}>{card.summary}</div>;
  }
}


/* ── Main component ── */
export function InfoCardView({
  cards,
  expandedDetail,
  onSelectCard,
  onCloseDetail,
  onMusicTogglePlay,
  onMusicNext,
  onMusicPrev,
}: InfoCardViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleSelectCard = useCallback(
    (cardId: string) => {
      setSelectedCardId(cardId);
      onSelectCard?.(cardId);
    },
    [onSelectCard],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedCardId(null);
    onCloseDetail?.();
  }, [onCloseDetail]);

  if (cards.length === 0) {
    return (
      <div style={S.root} data-testid="info-card-view" data-mode="empty">
        <div style={S.emptyState}>暂无流转信息</div>
      </div>
    );
  }

  return (
    <div style={S.root} data-testid="info-card-view" data-mode={expandedDetail ? 'detail' : 'list'}>
      {/* 水平滚动卡片列表 — 需求 20.7 */}
      <div style={S.scrollContainer} data-testid="card-scroll-container" role="list">
        {cards.map((card) => (
          <div
            key={card.cardId}
            style={S.card(selectedCardId === card.cardId)}
            onClick={() => handleSelectCard(card.cardId)}
            data-testid="info-card"
            data-card-id={card.cardId}
            data-template={card.template}
            role="listitem"
            tabIndex={0}
            aria-label={card.title}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleSelectCard(card.cardId);
            }}
          >
            <div style={S.cardHeader}>
              <span style={S.cardTitle}>{card.title}</span>
              <span style={S.cardTime}>{formatTime(card.timestamp)}</span>
            </div>
            <div style={S.cardBody}>
              {renderCardContent(card, null, {
                onTogglePlay: onMusicTogglePlay,
                onNext: onMusicNext,
                onPrev: onMusicPrev,
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 卡片数量指示器 */}
      {cards.length > 1 && (
        <div style={S.indicator} data-testid="card-indicator">
          {cards.map((card) => (
            <div
              key={card.cardId}
              style={S.dot(selectedCardId === card.cardId)}
            />
          ))}
        </div>
      )}

      {/* 展开详情浮层 — 需求 20.8 */}
      {expandedDetail && (
        <div
          style={S.detailOverlay}
          data-testid="card-detail-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetail();
          }}
        >
          <div style={S.detailPanel} data-testid="card-detail-panel">
            <div style={S.detailHeader}>
              <div style={S.detailTitle}>{expandedDetail.title}</div>
              <button
                style={S.closeBtn}
                onClick={handleCloseDetail}
                data-testid="detail-close-btn"
              >
                ✕
              </button>
            </div>
            <div style={S.detailBody}>
              {renderCardContent(expandedDetail, expandedDetail, {
                onTogglePlay: onMusicTogglePlay,
                onNext: onMusicNext,
                onPrev: onMusicPrev,
              })}
            </div>
            <div style={S.detailMeta}>
              类型: {expandedDetail.type} · {formatTime(expandedDetail.timestamp)}
              {expandedDetail.isTimeSensitive && ' · ⏰ 时效性信息'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
