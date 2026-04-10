/**
 * NavDetailView — 导航详情页（POI 确认后展示）
 *
 * 参考设计稿：左侧大字距离，中间方向箭头+进度条，右侧转弯指令
 * 底部：剩余距离 + 预计到达时间
 * 毛玻璃液态材质背景
 */

export interface NavDetailProps {
  /** 到下一转弯的距离 */
  nextDistance: string;
  /** 转弯方向文字，如"左转进入永初路" */
  turnText: string;
  /** 剩余总距离 */
  totalDistance: string;
  /** 预计到达时间 */
  eta: string;
  /** 目的地名称 */
  destination: string;
}

const S = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)',
    padding: '20px 24px',
    gap: 0,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    background: 'rgba(20, 16, 40, 0.75)',
    backdropFilter: 'blur(28px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
    border: '1.5px solid rgba(127, 73, 232, 0.15)',
    padding: '28px 32px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  mainRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  distBlock: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
  },
  distNum: {
    fontSize: 42,
    fontWeight: 700 as const,
    color: '#7F49E8',
    lineHeight: 1,
    letterSpacing: -1,
  },
  distUnit: {
    fontSize: 18,
    fontWeight: 400 as const,
    color: 'rgba(127, 73, 232, 0.7)',
  },
  arrowBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
  },
  arrowSvg: {
    width: 48,
    height: 48,
    color: '#7F49E8',
    filter: 'drop-shadow(0 0 8px rgba(127, 73, 232, 0.4))',
  },
  progressBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    background: 'linear-gradient(to bottom, rgba(127,73,232,0.6), rgba(127,73,232,0.1))',
  },
  turnText: {
    fontSize: 20,
    fontWeight: 700 as const,
    color: '#7F49E8',
    textAlign: 'right' as const,
    maxWidth: 160,
    lineHeight: 1.3,
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    borderTop: '1px solid rgba(127, 73, 232, 0.08)',
    paddingTop: 14,
  },
  bottomItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  bottomText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
  },
  separator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 3px, transparent 3px, transparent 6px)',
  },
  destLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center' as const,
    marginTop: -8,
  },
};

/** 右转箭头 SVG */
function TurnArrow() {
  return (
    <svg viewBox="0 0 48 48" style={S.arrowSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 36V20C14 14.477 18.477 10 24 10H30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26 6L34 10L26 14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function NavDetailView({ nextDistance, turnText, totalDistance, eta, destination }: NavDetailProps) {
  // 拆分距离数字和单位
  const numMatch = nextDistance.match(/^([\d.]+)\s*(.+)$/);
  const num = numMatch ? numMatch[1] : nextDistance;
  const unit = numMatch ? numMatch[2] : '';

  return (
    <div style={S.root} data-testid="nav-detail-view">
      <div style={S.card as React.CSSProperties}>
        <div style={S.destLabel}>导航至 {destination}</div>
        <div style={S.mainRow}>
          {/* 左：距离大字 */}
          <div style={S.distBlock}>
            <span style={S.distNum}>{num}</span>
            <span style={S.distUnit}>{unit}</span>
          </div>

          {/* 中：方向箭头 + 进度条 */}
          <div style={S.arrowBlock}>
            <TurnArrow />
            <div style={S.progressBar} />
          </div>

          {/* 右：转弯指令 */}
          <div style={S.turnText as React.CSSProperties}>{turnText}</div>
        </div>

        {/* 底部：剩余距离 + 到达时间 */}
        <div style={S.bottomRow}>
          <div style={S.bottomItem}>
            <span style={S.bottomText}>{totalDistance}</span>
          </div>
          <div style={S.separator} />
          <div style={S.bottomItem}>
            <span style={S.bottomText}>{eta} 到达</span>
          </div>
        </div>
      </div>
    </div>
  );
}
