/**
 * AI Chat 服务
 * 优先使用 Google Gemini（免费），备选 DeepSeek，最后降级到本地回复
 */

const GEMINI_MODEL = 'gemini-2.5-flash-lite-preview-06-17';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const getGeminiKey = (): string => {
  const envKey = (import.meta as Record<string, Record<string, string>>).env?.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  if (stored) return stored;
  // DeepSeek 备选
  const dsKey = typeof localStorage !== 'undefined' ? localStorage.getItem('DEEPSEEK_API_KEY') : null;
  if (dsKey) return `deepseek:${dsKey}`;
  return '';
};

export interface ChatResponse {
  text: string;
  error?: string;
}

const SYSTEM_INSTRUCTION = `你是 Q95 Pro 智能眼镜的 AI 助手，名叫"小Q"。你运行在一副 AR 智能眼镜上，用户通过语音与你交互。
规则：
- 回复简洁，不超过2句话（眼镜小屏幕显示）
- 友好自然，像朋友聊天
- 你知道这副眼镜支持：AR显示、语音交互、EMG手势控制、眼动追踪、健康监测（心率/血氧）、AR导航、拍照录像、音乐播放、实时翻译、提词器、IoT智能家居控制、SU7车辆控制
- 用中文回复
- 如果用户让你做某件事，就假装你已经做了并告诉结果`;

let history: Array<{ role: string; parts: Array<{ text: string }> }> = [];

/** 调用 Gemini API */
async function callGemini(userMessage: string, apiKey: string): Promise<string> {
  history.push({ role: 'user', parts: [{ text: userMessage }] });

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: history.slice(-8),
      generationConfig: { maxOutputTokens: 120, temperature: 0.8 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '抱歉，我没听清。';
  history.push({ role: 'model', parts: [{ text: reply }] });
  return reply;
}

/** 调用 DeepSeek API */
async function callDeepSeek(userMessage: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 120,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '抱歉，我没听清。';
}

/** 本地智能回复（最终降级） */
function localReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('天气')) return '今天晴，22°C，适合户外活动。已开启墨镜模式。';
  if (t.includes('几点') || t.includes('时间')) return `现在${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}，您还有2个日程待处理。`;
  if (t.includes('导航') || t.includes('怎么走')) return '已规划路线，步行12分钟到达。AR箭头已显示。';
  if (t.includes('拍照') || t.includes('相机')) return '相机就绪，说"拍"或捏合手势即可拍照。';
  if (t.includes('音乐') || t.includes('播放')) return '正在播放「晴天 — 周杰伦」，音量70%。';
  if (t.includes('心率') || t.includes('健康')) return '心率72bpm，血氧98%，步数8500步，一切正常。';
  if (t.includes('通知') || t.includes('消息')) return '3条未读：2条微信、1条短信。要我读给您听吗？';
  if (t.includes('翻译')) return '翻译模式已开启，请说出内容，实时显示在视野中。';
  if (t.includes('开灯') || t.includes('空调') || t.includes('家')) return '已执行：客厅灯已开，空调26°C制冷。';
  if (t.includes('车') || t.includes('su7')) return 'SU7电量78%，车门已锁，28°C。要开空调吗？';
  if (t.includes('你好') || t.includes('hello')) return '你好！我是小Q，Q95 Pro的AI助手，有什么可以帮您？';
  if (t.includes('谢')) return '不客气，随时叫我！';
  return `好的，正在为您处理。`;
}

export async function sendChat(userMessage: string): Promise<ChatResponse> {
  const key = getGeminiKey();

  // 1. 尝试 Gemini
  if (key && !key.startsWith('deepseek:')) {
    try {
      const reply = await callGemini(userMessage, key);
      return { text: reply };
    } catch (e) {
      console.warn('Gemini failed, falling back:', e);
    }
  }

  // 2. 尝试 DeepSeek
  if (key?.startsWith('deepseek:')) {
    try {
      const reply = await callDeepSeek(userMessage, key.slice(9));
      return { text: reply };
    } catch (e) {
      console.warn('DeepSeek failed, falling back:', e);
    }
  }

  // 3. 本地降级
  await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
  return { text: localReply(userMessage) };
}

export function resetChat(): void {
  history = [];
}
