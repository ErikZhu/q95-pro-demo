import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhoneRelayService } from './PhoneRelay';
import type { RelayInfo, RelayInfoType } from '../types/data';

function makeRelayInfo(overrides: Partial<RelayInfo> = {}): RelayInfo {
  return {
    type: overrides.type ?? 'delivery',
    data: overrides.data ?? { storeName: '测试餐厅', status: 'delivering', estimatedTime: 15 },
    timestamp: overrides.timestamp ?? Date.now(),
    priority: overrides.priority ?? 5,
    isTimeSensitive: overrides.isTimeSensitive ?? false,
  };
}

describe('PhoneRelayService', () => {
  let relay: PhoneRelayService;

  beforeEach(() => {
    relay = new PhoneRelayService();
  });

  describe('receiveInfo (需求 20.1, 20.2)', () => {
    it('receives info and creates an InfoCard', () => {
      relay.receiveInfo(makeRelayInfo());
      expect(relay.getCardCount()).toBe(1);
    });

    it('fires onInfoReceived callback', () => {
      const onInfo = vi.fn();
      relay.setCallbacks({ onInfoReceived: onInfo });
      relay.receiveInfo(makeRelayInfo());
      expect(onInfo).toHaveBeenCalledTimes(1);
      expect(onInfo.mock.calls[0][0].type).toBe('delivery');
    });

    it('generates correct title and summary for delivery', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'delivery',
        data: { storeName: '肯德基', status: '配送中', estimatedTime: 10 },
      }));
      const cards = relay.getInfoCards();
      expect(cards[0].title).toContain('肯德基');
      expect(cards[0].summary).toContain('配送中');
    });

    it('assigns unique card IDs', () => {
      relay.receiveInfo(makeRelayInfo());
      relay.receiveInfo(makeRelayInfo());
      const cards = relay.getInfoCards();
      expect(cards[0].cardId).not.toBe(cards[1].cardId);
    });
  });

  describe('CardTemplate mapping (需求 20.3)', () => {
    const typeTemplateMap: Array<[RelayInfoType, string]> = [
      ['delivery', 'delivery_progress'],
      ['calendar', 'calendar_event'],
      ['call', 'call_info'],
      ['flight', 'flight_board'],
      ['ride', 'ride_status'],
      ['movie', 'movie_ticket'],
      ['wechat', 'wechat_message'],
      ['music', 'music_player'],
    ];

    it.each(typeTemplateMap)(
      'maps %s to %s template',
      (type, expectedTemplate) => {
        relay.receiveInfo(makeRelayInfo({ type }));
        const cards = relay.getInfoCards();
        expect(cards[0].template).toBe(expectedTemplate);
      },
    );
  });

  describe('sorting algorithm (需求 20.12)', () => {
    it('sorts by score: priority×0.4 + timeSensitivity×0.35 + recency×0.25', () => {
      const now = Date.now();
      // High priority, not time-sensitive, old
      relay.receiveInfo(makeRelayInfo({
        type: 'delivery',
        priority: 10,
        isTimeSensitive: false,
        timestamp: now - 60 * 60000, // 60 min ago
      }));
      // Low priority, time-sensitive, recent
      relay.receiveInfo(makeRelayInfo({
        type: 'flight',
        priority: 1,
        isTimeSensitive: true,
        timestamp: now,
      }));

      const cards = relay.getInfoCards();
      // flight: 1*0.4 + 1*0.35 + 1/(0+1)*0.25 = 0.4 + 0.35 + 0.25 = 1.0
      // delivery: 10*0.4 + 0*0.35 + 1/(60+1)*0.25 ≈ 4.0 + 0 + 0.004 ≈ 4.004
      // delivery should be first due to high priority
      expect(cards[0].type).toBe('delivery');
      expect(cards[1].type).toBe('flight');
    });

    it('time-sensitive items rank higher than non-sensitive with same priority', () => {
      const now = Date.now();
      relay.receiveInfo(makeRelayInfo({
        type: 'calendar',
        priority: 5,
        isTimeSensitive: true,
        timestamp: now,
      }));
      relay.receiveInfo(makeRelayInfo({
        type: 'movie',
        priority: 5,
        isTimeSensitive: false,
        timestamp: now,
      }));

      const cards = relay.getInfoCards();
      expect(cards[0].type).toBe('calendar');
      expect(cards[1].type).toBe('movie');
    });

    it('more recent items rank higher with same priority and sensitivity', () => {
      const now = Date.now();
      relay.receiveInfo(makeRelayInfo({
        type: 'wechat',
        priority: 5,
        isTimeSensitive: false,
        timestamp: now - 30 * 60000, // 30 min ago
      }));
      relay.receiveInfo(makeRelayInfo({
        type: 'call',
        priority: 5,
        isTimeSensitive: false,
        timestamp: now, // just now
      }));

      const cards = relay.getInfoCards();
      expect(cards[0].type).toBe('call');
      expect(cards[1].type).toBe('wechat');
    });

    it('returns empty array when no cards', () => {
      expect(relay.getInfoCards()).toEqual([]);
    });

    it('returns copies, not references', () => {
      relay.receiveInfo(makeRelayInfo());
      const cards = relay.getInfoCards();
      cards[0].title = 'Hacked';
      expect(relay.getInfoCards()[0].title).not.toBe('Hacked');
    });
  });

  describe('expandCard (需求 20.8)', () => {
    it('returns detail for existing card', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'flight',
        data: { flightNo: 'CA1234', departure: { city: '北京' }, arrival: { city: '上海' } },
      }));
      const cards = relay.getInfoCards();
      const detail = relay.expandCard(cards[0].cardId);
      expect(detail).not.toBeNull();
      expect(detail!.data.flightNo).toBe('CA1234');
      expect(detail!.type).toBe('flight');
    });

    it('returns null for non-existent card', () => {
      expect(relay.expandCard('non-existent')).toBeNull();
    });

    it('returns a copy, not a reference', () => {
      relay.receiveInfo(makeRelayInfo({ data: { storeName: 'Original' } }));
      const cards = relay.getInfoCards();
      const detail = relay.expandCard(cards[0].cardId);
      detail!.data.storeName = 'Modified';
      const detail2 = relay.expandCard(cards[0].cardId);
      expect(detail2!.data.storeName).toBe('Original');
    });
  });

  describe('setAllowedTypes / type filtering (需求 20.9)', () => {
    it('filters out disallowed types', () => {
      relay.setAllowedTypes(['delivery', 'flight']);
      relay.receiveInfo(makeRelayInfo({ type: 'delivery' }));
      relay.receiveInfo(makeRelayInfo({ type: 'wechat' }));
      relay.receiveInfo(makeRelayInfo({ type: 'flight' }));
      expect(relay.getCardCount()).toBe(2);
      const types = relay.getInfoCards().map((c) => c.type);
      expect(types).toContain('delivery');
      expect(types).toContain('flight');
      expect(types).not.toContain('wechat');
    });

    it('allows all types by default', () => {
      const allTypes: RelayInfoType[] = [
        'delivery', 'calendar', 'call', 'flight', 'ride', 'movie', 'wechat', 'music',
      ];
      expect(relay.getAllowedTypes().sort()).toEqual(allTypes.sort());
    });

    it('can set empty allowed types to block all', () => {
      relay.setAllowedTypes([]);
      relay.receiveInfo(makeRelayInfo({ type: 'delivery' }));
      expect(relay.getCardCount()).toBe(0);
    });
  });

  describe('connection status (需求 20.10)', () => {
    it('defaults to connected', () => {
      expect(relay.getConnectionStatus()).toBe('connected');
    });

    it('can be set to disconnected', () => {
      relay.setConnectionStatus('disconnected');
      expect(relay.getConnectionStatus()).toBe('disconnected');
    });

    it('fires onConnectionChange callback on status change', () => {
      const onChange = vi.fn();
      relay.setCallbacks({ onConnectionChange: onChange });
      relay.setConnectionStatus('disconnected');
      expect(onChange).toHaveBeenCalledWith('disconnected');
    });

    it('does not fire callback when status unchanged', () => {
      const onChange = vi.fn();
      relay.setCallbacks({ onConnectionChange: onChange });
      relay.setConnectionStatus('connected'); // same as default
      expect(onChange).not.toHaveBeenCalled();
    });

    it('retains cards when bluetooth disconnects', () => {
      relay.receiveInfo(makeRelayInfo());
      relay.receiveInfo(makeRelayInfo({ type: 'flight' }));
      expect(relay.getCardCount()).toBe(2);

      relay.setConnectionStatus('disconnected');
      expect(relay.getCardCount()).toBe(2);
      expect(relay.getInfoCards()).toHaveLength(2);
    });
  });

  describe('removeCard', () => {
    it('removes an existing card', () => {
      relay.receiveInfo(makeRelayInfo());
      const cards = relay.getInfoCards();
      expect(relay.removeCard(cards[0].cardId)).toBe(true);
      expect(relay.getCardCount()).toBe(0);
    });

    it('returns false for non-existent card', () => {
      expect(relay.removeCard('non-existent')).toBe(false);
    });
  });

  describe('title/summary generation for all types', () => {
    it('generates correct title for calendar', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'calendar',
        data: { title: '团队周会' },
      }));
      expect(relay.getInfoCards()[0].title).toContain('团队周会');
    });

    it('generates correct title for call', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'call',
        data: { callerName: '张三' },
      }));
      expect(relay.getInfoCards()[0].title).toContain('张三');
    });

    it('generates correct title for wechat', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'wechat',
        data: { senderName: '李四', messageSummary: '你好' },
      }));
      const card = relay.getInfoCards()[0];
      expect(card.title).toContain('李四');
      expect(card.summary).toContain('你好');
    });

    it('generates correct title for music', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'music',
        data: { trackName: '晴天', artist: '周杰伦', isPlaying: true },
      }));
      const card = relay.getInfoCards()[0];
      expect(card.title).toContain('晴天');
      expect(card.summary).toContain('周杰伦');
      expect(card.summary).toContain('播放中');
    });

    it('generates correct title for ride', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'ride',
        data: { driverName: '王师傅', estimatedArrival: 5 },
      }));
      const card = relay.getInfoCards()[0];
      expect(card.title).toContain('王师傅');
      expect(card.summary).toContain('5分钟');
    });

    it('generates correct title for movie', () => {
      relay.receiveInfo(makeRelayInfo({
        type: 'movie',
        data: { movieName: '流浪地球', cinema: '万达影城', showtime: '19:30' },
      }));
      const card = relay.getInfoCards()[0];
      expect(card.title).toContain('流浪地球');
      expect(card.summary).toContain('万达影城');
    });
  });

  describe('constructor with callbacks', () => {
    it('accepts callbacks in constructor', () => {
      const onInfo = vi.fn();
      const r = new PhoneRelayService({ onInfoReceived: onInfo });
      r.receiveInfo(makeRelayInfo());
      expect(onInfo).toHaveBeenCalledTimes(1);
    });
  });
});
