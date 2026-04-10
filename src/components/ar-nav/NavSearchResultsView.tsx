import { useState, useEffect } from 'react';

/**
 * NavSearchResultsView — 导航 POI 搜索结果列表
 *
 * 支持三种选择方式：
 * 1. 点击列表项（鼠标/触控）
 * 2. 外部控制 selectedIndex（上滑/下滑手势）
 * 3. 语音指令"第X个"（外部设置 selectedIndex）
 */

export interface POIResult {
  id: string;
  name: string;
  status: string;
  distance: string;
  duration: string;
}

export interface NavSearchResultsViewProps {
  query: string;
  results: POIResult[];
  /** 外部控制的选中索引（-1 表示无选中） */
  selectedIndex?: number;
  onSelect?: (poi: POIResult, index: number) => void;
  onConfirm?: (poi: POIResult) => void;
  onDismiss?: () => void;
}

const S = {
  container: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    padding: '24px 32px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)', gap: 16,
  },
  title: {
    fontSize: 16, fontWeight: 500 as const,
    color: 'rgba(255, 255, 255, 0.88)',
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 12, padding: '10px 24px',
    textAlign: 'center' as const, width: '100%', maxWidth: 480,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  list: {
    display: 'flex', flexDirection: 'column' as const,
    gap: 8, width: '100%', maxWidth: 480,
  },
  item: (selected: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '12px 16px', borderRadius: 12,
    background: selected
      ? 'rgba(127, 73, 232, 0.08)'
      : 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
    /* 非选中: inside stroke 2px; 选中: 透明 border 让 outline 主导 */
    border: selected
      ? '2px solid transparent'
      : '2px solid rgba(255, 255, 255, 0.08)',
    /* 选中: outside stroke 6px #7F49E8 */
    outline: selected ? '3px solid #7F49E8' : 'none',
    outlineOffset: selected ? '0px' : undefined,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: selected
      ? '0 0 20px rgba(127, 73, 232, 0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
  }),
  radio: (selected: boolean): React.CSSProperties => ({
    width: 18, height: 18, borderRadius: '50%',
    border: selected ? '2px solid #7F49E8' : '2px solid rgba(255, 255, 255, 0.2)',
    background: selected ? 'radial-gradient(circle, #7F49E8 40%, transparent 41%)' : 'transparent',
    flexShrink: 0, transition: 'all 0.2s ease',
  }),
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: 500 as const, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 2 },
  status: (text: string): React.CSSProperties => ({
    fontSize: 11,
    color: text.includes('打烊') ? 'rgba(255, 180, 60, 0.8)' : 'rgba(140, 200, 100, 0.8)',
  }),
  distCol: { textAlign: 'right' as const, flexShrink: 0 },
  distance: { fontSize: 14, fontWeight: 600 as const, color: 'rgba(255, 255, 255, 0.85)' },
  duration: { fontSize: 11, color: 'rgba(255, 255, 255, 0.45)', marginTop: 2 },
  subtitle: {
    fontSize: 12, color: 'rgba(127, 73, 232, 0.85)',
    textAlign: 'center' as const, marginTop: -8,
    letterSpacing: 0.3, fontWeight: 500 as const,
    animation: 'sensible-fade-in 0.3s ease-out',
  },
};

export function NavSearchResultsView({
  results, selectedIndex = -1, onSelect,
}: NavSearchResultsViewProps) {
  const [localIdx, setLocalIdx] = useState(selectedIndex);

  useEffect(() => {
    if (selectedIndex >= 0) setLocalIdx(selectedIndex);
  }, [selectedIndex]);

  const handleClick = (idx: number) => {
    setLocalIdx(idx);
    onSelect?.(results[idx], idx);
  };

  const selectedPoi = localIdx >= 0 && localIdx < results.length ? results[localIdx] : null;

  return (
    <div style={S.container} data-testid="nav-search-results">
      <div style={S.title}>
        搜索到附近{results.length}个结果，去第几个？
      </div>
      {selectedPoi && (
        <div style={S.subtitle}>
          导航到 {selectedPoi.name.split('（')[0]}，捏合 / 点击确认
        </div>
      )}
      <div style={S.list}>
        {results.map((poi, i) => {
          const sel = i === localIdx;
          return (
            <div key={poi.id} style={S.item(sel)} onClick={() => handleClick(i)}
              data-testid={`poi-item-${poi.id}`} role="radio" aria-checked={sel}>
              <div style={S.radio(sel)} />
              <div style={S.info}>
                <div style={S.name}>{poi.name}</div>
                <div style={S.status(poi.status)}>{poi.status}</div>
              </div>
              <div style={S.distCol}>
                <div style={S.distance}>{poi.distance}</div>
                <div style={S.duration}>{poi.duration}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
