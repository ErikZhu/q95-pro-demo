import { describe, it, expect, beforeEach } from 'vitest';
import { PhoneRelayService } from './PhoneRelay';
import type { RelayInfo, RelayInfoType } from '../types/data';

/**
 * 信息流转属性测试
 * 任务 13.3
 *
 * 属性 13: 排序算法稳定性 — 相同输入的 InfoCard 排序结果始终一致
 * 属性 14: 信息类型过滤正确性 — 设置过滤后只有允许的类型出现在 getInfoCards 结果中
 */

function makeRelayInfo(overrides: Partial<RelayInfo> = {}): RelayInfo {
  return {
    type: overrides.type ?? 'delivery',
    data: overrides.data ?? { storeName: '测试', status: '配送中', estimatedTime: 10 },
    timestamp: overrides.timestamp ?? Date.now(),
    priority: overrides.priority ?? 5,
    isTimeSensitive: overrides.isTimeSensitive ?? false,
  };
}

const ALL_TYPES: RelayInfoType[] = ['delivery', 'calendar', 'call', 'flight', 'ride', 'movie', 'wechat', 'music'];

describe('PhoneRelay 属性测试', () => {
  let relay: PhoneRelayService;

  beforeEach(() => {
    relay = new PhoneRelayService();
  });

  // ── 属性 13: 排序算法稳定性 (需求 20.12) ──
  describe('属性 13: 排序算法稳定性', () => {
    it('相同输入多次调用 getInfoCards 结果顺序一致', () => {
      const now = Date.now();
      relay.receiveInfo(makeRelayInfo({ type: 'delivery', priority: 8, timestamp: now - 1000 }));
      relay.receiveInfo(makeRelayInfo({ type: 'flight', priority: 3, isTimeSensitive: true, timestamp: now }));
      relay.receiveInfo(makeRelayInfo({ type: 'wechat', priority: 5, timestamp: now - 500 }));

      const order1 = relay.getInfoCards().map((c) => c.type);
      const order2 = relay.getInfoCards().map((c) => c.type);
      const order3 = relay.getInfoCards().map((c) => c.type);

      expect(order1).toEqual(order2);
      expect(order2).toEqual(order3);
    });

    it('高优先级始终排在低优先级前面', () => {
      const now = Date.now();
      relay.receiveInfo(makeRelayInfo({ type: 'delivery', priority: 10, timestamp: now }));
      relay.receiveInfo(makeRelayInfo({ type: 'wechat', priority: 1, timestamp: now }));

      const cards = relay.getInfoCards();
      expect(cards[0].type).toBe('delivery');
      expect(cards[1].type).toBe('wechat');
    });

    it('时间敏感项在同优先级中排名更高', () => {
      const now = Date.now();
      relay.receiveInfo(makeRelayInfo({ type: 'calendar', priority: 5, isTimeSensitive: true, timestamp: now }));
      relay.receiveInfo(makeRelayInfo({ type: 'movie', priority: 5, isTimeSensitive: false, timestamp: now }));

      const cards = relay.getInfoCards();
      expect(cards[0].type).toBe('calendar');
    });

    it('更新鲜的项在同优先级同敏感度中排名更高', () => {
      const now = Date.now();
      relay.receiveInfo(makeRelayInfo({ type: 'call', priority: 5, isTimeSensitive: false, timestamp: now }));
      relay.receiveInfo(makeRelayInfo({ type: 'ride', priority: 5, isTimeSensitive: false, timestamp: now - 60000 }));

      const cards = relay.getInfoCards();
      expect(cards[0].type).toBe('call');
    });

    it('大量卡片排序稳定', () => {
      const now = Date.now();
      for (let i = 0; i < 20; i++) {
        relay.receiveInfo(makeRelayInfo({
          type: ALL_TYPES[i % ALL_TYPES.length],
          priority: Math.floor(Math.random() * 10) + 1,
          isTimeSensitive: Math.random() > 0.5,
          timestamp: now - Math.floor(Math.random() * 3600000),
        }));
      }
      const order1 = relay.getInfoCards().map((c) => c.cardId);
      const order2 = relay.getInfoCards().map((c) => c.cardId);
      expect(order1).toEqual(order2);
    });
  });

  // ── 属性 14: 信息类型过滤正确性 (需求 20.9) ──
  describe('属性 14: 信息类型过滤正确性', () => {
    it('默认允许所有类型', () => {
      for (const type of ALL_TYPES) {
        relay.receiveInfo(makeRelayInfo({ type }));
      }
      expect(relay.getCardCount()).toBe(ALL_TYPES.length);
    });

    it('设置过滤后只有允许的类型出现', () => {
      const allowed: RelayInfoType[] = ['delivery', 'flight'];
      relay.setAllowedTypes(allowed);

      for (const type of ALL_TYPES) {
        relay.receiveInfo(makeRelayInfo({ type }));
      }

      const cards = relay.getInfoCards();
      for (const card of cards) {
        expect(allowed).toContain(card.type);
      }
      expect(cards).toHaveLength(2);
    });

    it('空允许列表阻止所有类型', () => {
      relay.setAllowedTypes([]);
      for (const type of ALL_TYPES) {
        relay.receiveInfo(makeRelayInfo({ type }));
      }
      expect(relay.getCardCount()).toBe(0);
    });

    it('单一类型过滤', () => {
      for (const allowedType of ALL_TYPES) {
        const r = new PhoneRelayService();
        r.setAllowedTypes([allowedType]);
        for (const type of ALL_TYPES) {
          r.receiveInfo(makeRelayInfo({ type }));
        }
        const cards = r.getInfoCards();
        expect(cards).toHaveLength(1);
        expect(cards[0].type).toBe(allowedType);
      }
    });

    it('更改过滤不影响已有卡片', () => {
      relay.receiveInfo(makeRelayInfo({ type: 'delivery' }));
      relay.receiveInfo(makeRelayInfo({ type: 'wechat' }));
      expect(relay.getCardCount()).toBe(2);

      // 更改过滤后，已有卡片仍在
      relay.setAllowedTypes(['delivery']);
      expect(relay.getCardCount()).toBe(2); // existing cards not removed

      // 但新卡片受过滤影响
      relay.receiveInfo(makeRelayInfo({ type: 'wechat' }));
      // wechat 被过滤，不会增加
      relay.receiveInfo(makeRelayInfo({ type: 'delivery' }));
      expect(relay.getCardCount()).toBe(3); // only delivery added
    });
  });
});
