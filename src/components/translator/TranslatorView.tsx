import { useMemo } from 'react';
import { Icon } from '../icons/Icon';
import type {
  TranslatorState,
  TranslationResult,
  SupportedLanguage,
  TranslationInputMode,
} from '../../services/Translator';
import { LANGUAGE_LABELS } from '../../services/Translator';

/**
 * TranslatorView — 实时翻译界面组件
 *
 * 显示：
 * - 视野下方翻译结果 — 需求 14.4
 * - 源语言/目标语言选择 — 需求 14.2
 * - 输入方式切换（语音/摄像头OCR） — 需求 14.3
 * - 离线模式提示 — 需求 14.5
 * - 翻译中状态指示 — 需求 14.1
 *
 * 需求: 14.1, 14.2, 14.3, 14.4, 14.5
 */

export interface TranslatorViewProps {
  /** 翻译器状态 */
  state: TranslatorState;
  /** 语言切换回调 */
  onSourceLangChange?: (lang: SupportedLanguage) => void;
  onTargetLangChange?: (lang: SupportedLanguage) => void;
  /** 交换语言回调 */
  onSwapLanguages?: () => void;
  /** 输入方式切换回调 */
  onInputModeChange?: (mode: TranslationInputMode) => void;
  /** 激活/停用回调 */
  onToggleActive?: () => void;
}

const S = {
  container: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 25, 45, 0.96), rgba(10, 10, 26, 0.98))',
    display: 'flex', flexDirection: 'column' as const,
    fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(255, 255, 255, 0.92)', zIndex: 1400,
  },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(100, 200, 255, 0.06)' },
  title: { fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)' },
  offlineBadge: { fontSize: 11, color: 'rgba(255, 180, 60, 0.9)', background: 'rgba(255, 180, 60, 0.08)', borderRadius: 10, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(255, 180, 60, 0.15)' },
  langBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 16px' },
  langSelect: { background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(100, 200, 255, 0.12)', borderRadius: 8, color: 'rgba(255, 255, 255, 0.92)', fontSize: 13, padding: '6px 10px', cursor: 'pointer', outline: 'none', minWidth: 90, transition: 'border-color 0.15s' },
  swapBtn: { width: 32, height: 32, borderRadius: '50%', background: 'rgba(100, 200, 255, 0.08)', border: '1px solid rgba(100, 200, 255, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'rgba(100, 200, 255, 0.9)', transition: 'background 0.15s, border-color 0.15s' },
  inputModeBar: { display: 'flex', justifyContent: 'center', gap: 8, padding: '0 16px 10px' },
  modeBtn: { fontSize: 12, padding: '4px 14px', borderRadius: 14, border: '1px solid rgba(100, 200, 255, 0.1)', background: 'transparent', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', transition: 'all 0.15s' },
  modeBtnActive: { fontSize: 12, padding: '4px 14px', borderRadius: 14, border: '1px solid rgba(100, 200, 255, 0.4)', background: 'rgba(100, 200, 255, 0.08)', color: 'rgba(100, 200, 255, 0.95)', cursor: 'pointer' },
  resultsArea: { flex: 1, overflowY: 'auto' as const, padding: '8px 16px', display: 'flex', flexDirection: 'column' as const, gap: 10 },
  resultCard: { background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(100, 200, 255, 0.06)' },
  sourceText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.4)', marginBottom: 6, lineHeight: 1.4 },
  translatedText: { fontSize: 16, fontWeight: 500, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.5 },
  resultMeta: { display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'rgba(255, 255, 255, 0.25)', fontFamily: "'SF Mono', 'Fira Code', monospace" },
  translatingIndicator: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, fontSize: 14, color: 'rgba(100, 200, 255, 0.7)' },
  bottomBar: { padding: '12px 16px', borderTop: '1px solid rgba(100, 200, 255, 0.06)', display: 'flex', flexDirection: 'column' as const, gap: 8 },
  latestResult: { background: 'rgba(100, 200, 255, 0.04)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(100, 200, 255, 0.1)' },
  latestLabel: { fontSize: 10, color: 'rgba(100, 200, 255, 0.5)', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: 0.8, fontWeight: 600 },
  latestTranslation: { fontSize: 18, fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.4 },
  noResults: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255, 255, 255, 0.25)' },
  offlineWarning: { background: 'rgba(255, 180, 60, 0.06)', border: '1px solid rgba(255, 180, 60, 0.15)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'rgba(255, 180, 60, 0.9)', textAlign: 'center' as const },
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export function TranslatorView({
  state,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages,
  onInputModeChange,
}: TranslatorViewProps) {
  const { sourceLang, targetLang, inputMode, isOnline, results, isTranslating } = state;

  const latestResult = useMemo<TranslationResult | null>(
    () => (results.length > 0 ? results[results.length - 1] : null),
    [results],
  );

  const reversedResults = useMemo(
    () => [...results].reverse(),
    [results],
  );

  const supportedLangs = Object.entries(LANGUAGE_LABELS) as [SupportedLanguage, string][];

  return (
    <div
      data-testid="translator-view"
      role="region"
      aria-label="实时翻译"
      style={S.container}
    >
      {/* Top bar */}
      <div style={S.topBar} data-testid="translator-top-bar">
        <span style={S.title}>实时翻译</span>
        {/* Offline badge — 需求 14.5 */}
        {!isOnline && (
          <span style={S.offlineBadge} data-testid="offline-badge" role="status">
            <Icon name="warning" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />离线模式
          </span>
        )}
      </div>

      {/* Language selector — 需求 14.2 */}
      <div style={S.langBar} data-testid="lang-bar">
        <select
          style={S.langSelect}
          value={sourceLang}
          onChange={(e) => onSourceLangChange?.(e.target.value as SupportedLanguage)}
          data-testid="source-lang-select"
          aria-label="源语言"
        >
          {supportedLangs.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        <button
          style={S.swapBtn}
          onClick={onSwapLanguages}
          data-testid="swap-lang-btn"
          aria-label="交换语言"
        >
          ⇄
        </button>

        <select
          style={S.langSelect}
          value={targetLang}
          onChange={(e) => onTargetLangChange?.(e.target.value as SupportedLanguage)}
          data-testid="target-lang-select"
          aria-label="目标语言"
        >
          {supportedLangs.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* Input mode toggle — 需求 14.3 */}
      <div style={S.inputModeBar} data-testid="input-mode-bar">
        <button
          style={inputMode === 'voice' ? S.modeBtnActive : S.modeBtn}
          onClick={() => onInputModeChange?.('voice')}
          data-testid="mode-voice-btn"
          aria-pressed={inputMode === 'voice'}
        >
          <Icon name="mic" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />语音输入
        </button>
        <button
          style={inputMode === 'camera_ocr' ? S.modeBtnActive : S.modeBtn}
          onClick={() => onInputModeChange?.('camera_ocr')}
          data-testid="mode-camera-btn"
          aria-pressed={inputMode === 'camera_ocr'}
        >
          <Icon name="camera" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />文字识别
        </button>
      </div>

      {/* Offline warning — 需求 14.5 */}
      {!isOnline && (
        <div style={S.offlineWarning} data-testid="offline-warning" role="alert">
          当前处于离线翻译模式，翻译质量可能下降
        </div>
      )}

      {/* Translation results area — 需求 14.4 */}
      {results.length === 0 && !isTranslating ? (
        <div style={S.noResults} data-testid="no-results">
          等待翻译输入…
        </div>
      ) : (
        <div style={S.resultsArea} data-testid="results-area">
          {isTranslating && (
            <div style={S.translatingIndicator} data-testid="translating-indicator">
              <Icon name="loader" size={12} style={{ display: 'inline', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} /> 正在翻译…
            </div>
          )}
          {reversedResults.map((r) => (
            <div key={r.id} style={S.resultCard} data-testid="result-card">
              <div style={S.sourceText} data-testid="result-source">
                {r.sourceText}
              </div>
              <div style={S.translatedText} data-testid="result-translated">
                {r.translatedText}
              </div>
              <div style={S.resultMeta}>
                <span>{r.inputMode === 'voice' ? '语音' : 'OCR'}</span>
                <span>{r.latencyMs}ms</span>
                <span>{formatTime(r.timestamp)}</span>
                {r.isOffline && <span>离线</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom bar: latest translation highlight — 需求 14.4 */}
      <div style={S.bottomBar} data-testid="translator-bottom-bar">
        {latestResult ? (
          <div style={S.latestResult} data-testid="latest-result">
            <div style={S.latestLabel}>最新翻译</div>
            <div style={S.latestTranslation} data-testid="latest-translation">
              {latestResult.translatedText}
            </div>
          </div>
        ) : (
          <div style={{ ...S.latestResult, opacity: 0.4 }} data-testid="latest-result-empty">
            <div style={S.latestLabel}>翻译结果</div>
            <div style={{ ...S.latestTranslation, fontSize: 14, fontWeight: 400 }}>
              翻译结果将显示在此处
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
