import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InfoCardView } from './InfoCardView';
import type { InfoCardViewProps } from './InfoCardView';
import type { InfoCard, InfoCardDetail, CardTemplate } from '../../types/data';

/**
 * InfoCardView 单元测试
 * 需求: 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.11
 */

function makeCard(overrides?: Partial<InfoCard>): InfoCard {
  return {
    cardId: 'card_1',
    type: 'delivery',
    title: '外卖 · 肯德基',
    summary: '骑手已取餐 · 预计15分钟',
    priority: 5,
    timestamp: Date.now(),
    template: 'delivery_progress',
    ...overrides,
  };
}

function makeDetail(card: InfoCard, data: Record<string, unknown> = {}): InfoCardDetail {
  return {
    ...card,
    data,
    isTimeSensitive: true,
  };
}

function makeProps(overrides?: Partial<InfoCardViewProps>): InfoCardViewProps {
  return {
    cards: [],
    ...overrides,
  };
}

function render(props: InfoCardViewProps): string {
  return renderToStaticMarkup(createElement(InfoCardView, props));
}

describe('InfoCardView', () => {
  describe('空状态', () => {
    it('renders empty state when no cards', () => {
      const html = render(makeProps());
      expect(html).toContain('data-mode="empty"');
      expect(html).toContain('暂无流转信息');
    });
  });

  describe('卡片列表 — 需求 20.7: 侧边触控滑动浏览', () => {
    it('renders scrollable card list', () => {
      const cards = [
        makeCard({ cardId: 'c1', title: '外卖 · 肯德基' }),
        makeCard({ cardId: 'c2', title: '航班 · CA1234', template: 'flight_board', type: 'flight' }),
      ];
      const html = render(makeProps({ cards }));
      expect(html).toContain('data-mode="list"');
      expect(html).toContain('card-scroll-container');
      expect(html).toContain('外卖 · 肯德基');
      expect(html).toContain('航班 · CA1234');
    });

    it('renders card indicator dots for multiple cards', () => {
      const cards = [
        makeCard({ cardId: 'c1' }),
        makeCard({ cardId: 'c2' }),
      ];
      const html = render(makeProps({ cards }));
      expect(html).toContain('card-indicator');
    });

    it('does not render indicator for single card', () => {
      const cards = [makeCard()];
      const html = render(makeProps({ cards }));
      expect(html).not.toContain('card-indicator');
    });

    it('renders cards with role=listitem for accessibility', () => {
      const cards = [makeCard()];
      const html = render(makeProps({ cards }));
      expect(html).toContain('role="listitem"');
      expect(html).toContain('role="list"');
    });

    it('renders card with aria-label', () => {
      const cards = [makeCard({ title: '外卖 · 肯德基' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('aria-label="外卖 · 肯德基"');
    });
  });

  describe('卡片模板分发 — 需求 20.3: 差异化布局', () => {
    it('renders delivery card template', () => {
      const cards = [makeCard({ template: 'delivery_progress' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('data-template="delivery_progress"');
      expect(html).toContain('delivery-card');
    });

    it('renders flight card template', () => {
      const cards = [makeCard({ template: 'flight_board', type: 'flight', title: '航班 · MU5678' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('data-template="flight_board"');
      expect(html).toContain('flight-card');
    });

    it('renders ride card template', () => {
      const cards = [makeCard({ template: 'ride_status', type: 'ride', title: '打车 · 等待接单' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('data-template="ride_status"');
      expect(html).toContain('ride-card');
    });

    it('renders music card template with controls', () => {
      const cards = [makeCard({ template: 'music_player', type: 'music', title: '音乐 · 晴天' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('data-template="music_player"');
      expect(html).toContain('music-card');
      expect(html).toContain('music-controls');
    });

    it('renders calendar card template', () => {
      const cards = [makeCard({ template: 'calendar_event', type: 'calendar', title: '日程 · 团队会议' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('data-template="calendar_event"');
      expect(html).toContain('calendar-card');
    });

    it('renders wechat card template', () => {
      const cards = [makeCard({ template: 'wechat_message', type: 'wechat', title: '微信 · 张三' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('data-template="wechat_message"');
      expect(html).toContain('wechat-card');
    });

    it('renders fallback for unknown template', () => {
      const cards = [makeCard({ template: 'movie_ticket' as CardTemplate, summary: '电影票信息' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('电影票信息');
    });
  });

  describe('展开详情 — 需求 20.8', () => {
    it('renders detail overlay when expandedDetail is provided', () => {
      const card = makeCard({ title: '外卖 · 肯德基' });
      const detail = makeDetail(card, { storeName: '肯德基', status: 'delivering', progress: 60 });
      const html = render(makeProps({
        cards: [card],
        expandedDetail: detail,
      }));
      expect(html).toContain('data-mode="detail"');
      expect(html).toContain('card-detail-overlay');
      expect(html).toContain('card-detail-panel');
      expect(html).toContain('外卖 · 肯德基');
    });

    it('shows time-sensitive indicator in detail', () => {
      const card = makeCard();
      const detail = makeDetail(card);
      detail.isTimeSensitive = true;
      const html = render(makeProps({
        cards: [card],
        expandedDetail: detail,
      }));
      expect(html).toContain('⏰ 时效性信息');
    });

    it('shows close button in detail panel', () => {
      const card = makeCard();
      const detail = makeDetail(card);
      const html = render(makeProps({
        cards: [card],
        expandedDetail: detail,
      }));
      expect(html).toContain('detail-close-btn');
    });

    it('does not render detail overlay when expandedDetail is null', () => {
      const cards = [makeCard()];
      const html = render(makeProps({ cards, expandedDetail: null }));
      expect(html).not.toContain('card-detail-overlay');
    });
  });

  describe('音乐卡片快捷控制 — 需求 20.11', () => {
    it('renders play/pause and skip controls', () => {
      const cards = [makeCard({ template: 'music_player', type: 'music' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('music-toggle');
      expect(html).toContain('music-prev');
      expect(html).toContain('music-next');
    });

    it('renders music progress bar', () => {
      const cards = [makeCard({ template: 'music_player', type: 'music' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('music-progress');
    });
  });

  describe('微信卡片 — 需求 20.6', () => {
    it('renders sender avatar placeholder', () => {
      const cards = [makeCard({ template: 'wechat_message', type: 'wechat' })];
      const html = render(makeProps({ cards }));
      expect(html).toContain('wechat-avatar');
    });
  });
});
