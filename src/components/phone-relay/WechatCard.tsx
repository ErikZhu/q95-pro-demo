import type { InfoCard } from '../../types/data';
import { Icon } from '../icons/Icon';

/**
 * WechatCard — 微信消息卡片（含发送者头像、昵称、摘要）
 * 需求 20.6: 显示消息预览（发送者头像、昵称和消息摘要）
 */

export interface WechatCardProps {
  card: InfoCard;
  data?: {
    senderName?: string;
    senderAvatar?: string;
    messageSummary?: string;
  };
}

const S = {
  root: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 6, background: 'rgba(80, 220, 160, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, overflow: 'hidden' as const, border: '1px solid rgba(80, 220, 160, 0.15)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: 6 },
  content: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 3 },
  senderName: { fontSize: 13, fontWeight: 600 as const },
  messageSummary: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const },
};

export function WechatCardView({ card, data }: WechatCardProps) {
  return (
    <div style={S.root} data-testid="wechat-card">
      <div style={S.avatar} data-testid="wechat-avatar">
        {data?.senderAvatar ? (
          <img src={data.senderAvatar} alt="" style={S.avatarImg} />
        ) : (
          <Icon name="chat" size={16} />
        )}
      </div>
      <div style={S.content}>
        <div style={S.senderName}>{data?.senderName ?? '未知联系人'}</div>
        <div style={S.messageSummary}>{data?.messageSummary ?? card.summary}</div>
      </div>
    </div>
  );
}
