/**
 * Translator — 实时翻译服务
 *
 * 翻译处理（1秒内显示）、多语言支持（≥10种）、语音输入和摄像头文字识别、
 * 离线模式切换。Demo 中使用模拟数据。
 *
 * 需求: 14.1, 14.2, 14.3, 14.4, 14.5
 */

/** 在线翻译模拟延迟（ms） */
const ONLINE_TRANSLATE_DELAY = 400;
/** 离线翻译模拟延迟（ms） */
const OFFLINE_TRANSLATE_DELAY = 800;
/** 最大翻译延迟要求（ms） — 需求 14.1 */
const MAX_TRANSLATE_LATENCY = 1000;

/** 支持的语言 — 需求 14.2：不少于 10 种主流语言 */
export type SupportedLanguage =
  | 'zh-CN'  // 中文（简体）
  | 'en'     // 英语
  | 'ja'     // 日语
  | 'ko'     // 韩语
  | 'fr'     // 法语
  | 'de'     // 德语
  | 'es'     // 西班牙语
  | 'pt'     // 葡萄牙语
  | 'ru'     // 俄语
  | 'ar'     // 阿拉伯语
  | 'th'     // 泰语
  | 'vi';    // 越南语

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
  th: 'ไทย',
  vi: 'Tiếng Việt',
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = Object.keys(LANGUAGE_LABELS) as SupportedLanguage[];

/** 翻译输入方式 — 需求 14.3 */
export type TranslationInputMode = 'voice' | 'camera_ocr';

export interface TranslationResult {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  inputMode: TranslationInputMode;
  timestamp: number;
  latencyMs: number;
  isOffline: boolean;
}

export interface TranslatorState {
  isActive: boolean;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  inputMode: TranslationInputMode;
  isOnline: boolean;
  results: TranslationResult[];
  isTranslating: boolean;
}

export class Translator {
  private active = false;
  private sourceLang: SupportedLanguage = 'en';
  private targetLang: SupportedLanguage = 'zh-CN';
  private inputMode: TranslationInputMode = 'voice';
  private online = true;
  private results: TranslationResult[] = [];
  private translating = false;
  private resultCounter = 0;

  constructor(options?: {
    sourceLang?: SupportedLanguage;
    targetLang?: SupportedLanguage;
    inputMode?: TranslationInputMode;
  }) {
    if (options?.sourceLang) this.sourceLang = options.sourceLang;
    if (options?.targetLang) this.targetLang = options.targetLang;
    if (options?.inputMode) this.inputMode = options.inputMode;
  }

  // ─── 翻译模式控制 — 需求 14.1, 14.4 ───

  /** 启动翻译模式 */
  activate(): void {
    this.active = true;
  }

  /** 停止翻译模式 */
  deactivate(): void {
    this.active = false;
    this.translating = false;
  }

  /** 翻译模式是否激活 */
  isActive(): boolean {
    return this.active;
  }

  // ─── 翻译处理 — 需求 14.1 ───

  /**
   * 翻译文本 — 1秒内返回结果
   * Demo 中使用模拟翻译。
   */
  async translate(
    sourceText: string,
    inputMode?: TranslationInputMode,
  ): Promise<TranslationResult> {
    if (!this.active) {
      throw new Error('翻译模式未激活');
    }

    if (!sourceText.trim()) {
      throw new Error('输入文本不能为空');
    }

    this.translating = true;
    const startTime = Date.now();
    const mode = inputMode ?? this.inputMode;

    const delay = this.online ? ONLINE_TRANSLATE_DELAY : OFFLINE_TRANSLATE_DELAY;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const translatedText = this.simulateTranslation(
      sourceText,
      this.sourceLang,
      this.targetLang,
    );

    const latencyMs = Date.now() - startTime;
    this.resultCounter++;

    const result: TranslationResult = {
      id: `trans_${Date.now()}_${this.resultCounter}`,
      sourceText,
      translatedText,
      sourceLang: this.sourceLang,
      targetLang: this.targetLang,
      inputMode: mode,
      timestamp: Date.now(),
      latencyMs,
      isOffline: !this.online,
    };

    this.results.push(result);
    this.translating = false;

    return result;
  }

  // ─── 语言设置 — 需求 14.2 ───

  /** 设置源语言 */
  setSourceLanguage(lang: SupportedLanguage): void {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      throw new Error(`不支持的语言: ${lang}`);
    }
    this.sourceLang = lang;
  }

  /** 设置目标语言 */
  setTargetLanguage(lang: SupportedLanguage): void {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      throw new Error(`不支持的语言: ${lang}`);
    }
    this.targetLang = lang;
  }

  /** 获取源语言 */
  getSourceLanguage(): SupportedLanguage {
    return this.sourceLang;
  }

  /** 获取目标语言 */
  getTargetLanguage(): SupportedLanguage {
    return this.targetLang;
  }

  /** 交换源语言和目标语言 */
  swapLanguages(): void {
    const temp = this.sourceLang;
    this.sourceLang = this.targetLang;
    this.targetLang = temp;
  }

  /** 获取支持的语言列表 — 需求 14.2 */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }

  // ─── 输入方式 — 需求 14.3 ───

  /** 设置翻译输入方式 */
  setInputMode(mode: TranslationInputMode): void {
    this.inputMode = mode;
  }

  /** 获取当前输入方式 */
  getInputMode(): TranslationInputMode {
    return this.inputMode;
  }

  // ─── 离线模式 — 需求 14.5 ───

  /** 设置网络状态 */
  setOnlineStatus(online: boolean): void {
    this.online = online;
  }

  /** 获取网络状态 */
  isOnline(): boolean {
    return this.online;
  }

  // ─── 翻译历史 ───

  /** 获取翻译结果历史 */
  getResults(): TranslationResult[] {
    return [...this.results];
  }

  /** 获取最新翻译结果 */
  getLatestResult(): TranslationResult | null {
    return this.results.length > 0
      ? { ...this.results[this.results.length - 1] }
      : null;
  }

  /** 清除翻译历史 */
  clearResults(): void {
    this.results = [];
  }

  // ─── 状态查询 ───

  /** 获取完整翻译器状态 */
  getState(): TranslatorState {
    return {
      isActive: this.active,
      sourceLang: this.sourceLang,
      targetLang: this.targetLang,
      inputMode: this.inputMode,
      isOnline: this.online,
      results: this.getResults(),
      isTranslating: this.translating,
    };
  }

  /** 获取最大翻译延迟要求（ms） */
  getMaxLatency(): number {
    return MAX_TRANSLATE_LATENCY;
  }

  /** 清理资源 */
  dispose(): void {
    this.deactivate();
    this.results = [];
  }

  // ─── 模拟翻译 ───

  private simulateTranslation(
    text: string,
    _sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage,
  ): string {
    // Demo 模拟翻译：根据目标语言返回模拟结果
    const simulations: Partial<Record<SupportedLanguage, (t: string) => string>> = {
      'zh-CN': (t) => `[中文翻译] ${t}`,
      en: (t) => `[English] ${t}`,
      ja: (t) => `[日本語] ${t}`,
      ko: (t) => `[한국어] ${t}`,
      fr: (t) => `[Français] ${t}`,
      de: (t) => `[Deutsch] ${t}`,
      es: (t) => `[Español] ${t}`,
      pt: (t) => `[Português] ${t}`,
      ru: (t) => `[Русский] ${t}`,
      ar: (t) => `[العربية] ${t}`,
      th: (t) => `[ไทย] ${t}`,
      vi: (t) => `[Tiếng Việt] ${t}`,
    };

    const fn = simulations[targetLang];
    if (fn) return fn(text);

    return `[${targetLang}] ${text}`;
  }
}
