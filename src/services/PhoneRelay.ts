import type {
  RelayInfo,
  RelayInfoType,
  InfoCard,
  InfoCardDetail,
  CardTemplate,
} from '../types/data';

/**
 * Mapping from RelayInfoType to CardTemplate.
 * 需求 20.3: 差异化 Info_Card 布局模板
 */
const TEMPLATE_MAP: Record<RelayInfoType, CardTemplate> = {
  delivery: 'delivery_progress',
  calendar: 'calendar_event',
  call: 'call_info',
  flight: 'flight_board',
  ride: 'ride_status',
  movie: 'movie_ticket',
  wechat: 'wechat_message',
  music: 'music_player',
};

/**
 * Default title generators per info type.
 */
const TITLE_MAP: Record<RelayInfoType, (data: Record<string, unknown>) => string> = {
  delivery: (d) => `外卖 · ${(d.storeName as string) ?? '配送中'}`,
  calendar: (d) => `日程 · ${(d.title as string) ?? '提醒'}`,
  call: (d) => `来电 · ${(d.callerName as string) ?? '未知号码'}`,
  flight: (d) => `航班 · ${(d.flightNo as string) ?? ''}`,
  ride: (d) => `打车 · ${(d.driverName as string) ?? '等待接单'}`,
  movie: (d) => `电影票 · ${(d.movieName as string) ?? ''}`,
  wechat: (d) => `微信 · ${(d.senderName as string) ?? '新消息'}`,
  music: (d) => `音乐 · ${(d.trackName as string) ?? '正在播放'}`,
};

/**
 * Default summary generators per info type.
 */
const SUMMARY_MAP: Record<RelayInfoType, (data: Record<string, unknown>) => string> = {
  delivery: (d) => {
    const status = d.status as string | undefined;
    const eta = d.estimatedTime as number | undefined;
    return status ? `${status}${eta ? ` · 预计${eta}分钟` : ''}` : '配送中';
  },
  calendar: (d) => {
    const time = d.startTime as string | undefined;
    return time ? `开始时间: ${time}` : '即将开始';
  },
  call: (d) => {
    const phone = d.phoneNumber as string | undefined;
    return phone ?? '来电中';
  },
  flight: (d) => {
    const dep = d.departure as Record<string, unknown> | undefined;
    const arr = d.arrival as Record<string, unknown> | undefined;
    return dep && arr ? `${dep.city} → ${arr.city}` : '航班信息';
  },
  ride: (d) => {
    const eta = d.estimatedArrival as number | undefined;
    return eta ? `预计${eta}分钟到达` : '等待中';
  },
  movie: (d) => {
    const cinema = d.cinema as string | undefined;
    const showtime = d.showtime as string | undefined;
    return [cinema, showtime].filter(Boolean).join(' · ') || '电影票信息';
  },
  wechat: (d) => {
    const msg = d.messageSummary as string | undefined;
    return msg ?? '新消息';
  },
  music: (d) => {
    const artist = d.artist as string | undefined;
    const isPlaying = d.isPlaying as boolean | undefined;
    return `${artist ?? '未知歌手'} · ${isPlaying ? '播放中' : '已暂停'}`;
  },
};

/** Callbacks for PhoneRelay events. */
export interface PhoneRelayCallbacks {
  onInfoReceived?: (card: InfoCard) => void;
  onConnectionChange?: (status: 'connected' | 'disconnected') => void;
}

let nextCardId = 1;
function generateCardId(): string {
  return `card_${Date.now()}_${nextCardId++}`;
}

/**
 * PhoneRelay 服务
 *
 * 接收手机流转信息，生成 Info_Card 并管理智能排序。
 * 支持 8 种信息类型的差异化模板映射、基于权重公式的排序、
 * 信息类型过滤和蓝牙断开时的信息保留。
 *
 * 需求: 20.1, 20.2, 20.3, 20.9, 20.10, 20.12
 */
export class PhoneRelayService {
  private cards: Map<string, InfoCard> = new Map();
  private cardDetails: Map<string, InfoCardDetail> = new Map();
  private allowedTypes: Set<RelayInfoType> = new Set([
    'delivery', 'calendar', 'call', 'flight', 'ride', 'movie', 'wechat', 'music',
  ]);
  private connectionStatus: 'connected' | 'disconnected' = 'connected';
  private callbacks: PhoneRelayCallbacks;

  constructor(callbacks: PhoneRelayCallbacks = {}) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: PhoneRelayCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 需求 20.1, 20.2: 接收流转信息并生成 InfoCard
   * 需求 20.9: 仅接收允许流转的类型
   */
  receiveInfo(info: RelayInfo): void {
    if (!this.allowedTypes.has(info.type)) {
      return;
    }

    const cardId = generateCardId();
    const template = TEMPLATE_MAP[info.type];
    const title = TITLE_MAP[info.type](info.data);
    const summary = SUMMARY_MAP[info.type](info.data);

    const card: InfoCard = {
      cardId,
      type: info.type,
      title,
      summary,
      priority: info.priority,
      timestamp: info.timestamp,
      template,
    };

    const detail: InfoCardDetail = {
      ...card,
      data: { ...info.data },
      isTimeSensitive: info.isTimeSensitive,
    };

    this.cards.set(cardId, card);
    this.cardDetails.set(cardId, detail);
    this.callbacks.onInfoReceived?.(card);
  }

  /**
   * 需求 20.12: 按权重公式智能排序返回所有 InfoCard
   * score = priority × 0.4 + timeSensitivity × 0.35 + recency × 0.25
   */
  getInfoCards(): InfoCard[] {
    const now = Date.now();
    const scored: Array<{ card: InfoCard; score: number }> = [];

    for (const card of this.cards.values()) {
      const detail = this.cardDetails.get(card.cardId);
      const timeSensitivity = detail?.isTimeSensitive ? 1 : 0;
      const ageMinutes = Math.max(0, (now - card.timestamp) / 60000);
      const recency = 1 / (ageMinutes + 1);

      const score =
        card.priority * 0.4 +
        timeSensitivity * 0.35 +
        recency * 0.25;

      scored.push({ card: { ...card }, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.card);
  }

  /**
   * 需求 20.8: 展开卡片详情
   */
  expandCard(cardId: string): InfoCardDetail | null {
    const detail = this.cardDetails.get(cardId);
    if (!detail) return null;
    return { ...detail, data: { ...detail.data } };
  }

  /**
   * 需求 20.9: 设置允许流转的信息类型
   */
  setAllowedTypes(types: RelayInfoType[]): void {
    this.allowedTypes = new Set(types);
  }

  /** Get the current set of allowed types. */
  getAllowedTypes(): RelayInfoType[] {
    return Array.from(this.allowedTypes);
  }

  /**
   * 需求 20.10: 获取连接状态
   */
  getConnectionStatus(): 'connected' | 'disconnected' {
    return this.connectionStatus;
  }

  /**
   * 需求 20.10: 设置连接状态
   * 蓝牙断开时保留最近同步的信息
   */
  setConnectionStatus(status: 'connected' | 'disconnected'): void {
    const prev = this.connectionStatus;
    this.connectionStatus = status;
    if (prev !== status) {
      this.callbacks.onConnectionChange?.(status);
    }
    // 需求 20.10: 断开时保留已有信息，不清除 cards
  }

  /** Get total card count. */
  getCardCount(): number {
    return this.cards.size;
  }

  /** Remove a card by ID. */
  removeCard(cardId: string): boolean {
    const deleted = this.cards.delete(cardId);
    this.cardDetails.delete(cardId);
    return deleted;
  }
}
