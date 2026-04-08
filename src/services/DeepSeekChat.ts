/**
 * DeepSeek Chat API 服务
 * 用于 Demo 中模拟 AI 语音助手的真实对话能力
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// API Key 从环境变量读取，或使用默认值（demo 用）
const getApiKey = (): string => {
  // Vite 环境变量
  const envKey = (import.meta as Record<string, Record<string, string>>).env?.VITE_DEEPSEEK_API_KEY;
  if (envKey) return envKey;
  // localStorage 备用（方便 demo 时动态设置）
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('DEEPSEEK_API_KEY') : null;
  return stored || '';
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  text: string;
  error?: string;
}

const SYSTEM_PROMPT = `你是 Q95 Pro 智能眼镜的 AI 助手。你运行在一副 AR 智能眼镜上，用户通过语音与你交互。
你的回复要求：
- 简洁精炼，不超过 2-3 句话（因为要在眼镜小屏幕上显示）
- 友好自然，像朋友一样对话
- 如果用户问设备相关问题，你知道这是一副支持 AR 显示、语音交互、手势控制、健康监测的智能眼镜
- 用中文回复`;

let conversationHistory: ChatMessage[] = [
  { role: 'system', content: SYSTEM_PROMPT },
];

/**
 * 发送消息到 DeepSeek API 并获取回复
 */
export async function sendChat(userMessage: string): Promise<ChatResponse> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      text: `[Demo 模式] 收到："${userMessage}"。请在 localStorage 中设置 DEEPSEEK_API_KEY 以启用真实 AI 对话。`,
    };
  }

  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: conversationHistory.slice(-10), // 保留最近 10 条上下文
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { text: `AI 服务暂时不可用 (${res.status})`, error: errText };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '抱歉，我没有理解你的意思。';

    conversationHistory.push({ role: 'assistant', content: reply });

    return { text: reply };
  } catch (err) {
    return { text: '网络连接失败，请检查网络后重试。', error: String(err) };
  }
}

/** 清空对话历史 */
export function resetChat(): void {
  conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
}
