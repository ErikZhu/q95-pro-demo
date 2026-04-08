/**
 * AI Chat 服务
 * 优先调用 DeepSeek API（如果有 Key），否则使用内置智能回复引擎
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const getApiKey = (): string => {
  const envKey = (import.meta as Record<string, Record<string, string>>).env?.VITE_DEEPSEEK_API_KEY;
  if (envKey) return envKey;
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

/** 内置智能回复引擎 — 无需 API Key 即可使用 */
function localReply(text: string): string {
  const t = text.toLowerCase();

  // 天气
  if (t.includes('天气') || t.includes('weather'))
    return '今天晴，气温 22°C，适合户外活动。紫外线中等，建议佩戴墨镜模式。';

  // 时间
  if (t.includes('几点') || t.includes('时间') || t.includes('time'))
    return `现在是 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}，您今天还有 2 个日程待处理。`;

  // 导航
  if (t.includes('导航') || t.includes('怎么走') || t.includes('路线'))
    return '已为您规划路线，预计步行 12 分钟到达。AR 导航箭头已在视野中显示。';

  // 拍照
  if (t.includes('拍照') || t.includes('照片') || t.includes('相机'))
    return '相机已就绪，说"拍"或捏合手势即可拍照。当前分辨率 1080p。';

  // 音乐
  if (t.includes('音乐') || t.includes('播放') || t.includes('歌'))
    return '正在播放「晴天 — 周杰伦」，音量 70%。可以说"下一首"或"暂停"。';

  // 健康
  if (t.includes('心率') || t.includes('健康') || t.includes('血氧') || t.includes('步数'))
    return '当前心率 72bpm，血氧 98%，今日步数 8,500 步。各项指标正常。';

  // 通知
  if (t.includes('通知') || t.includes('消息') || t.includes('未读'))
    return '您有 3 条未读消息：2 条微信、1 条短信。需要我读给您听吗？';

  // 翻译
  if (t.includes('翻译') || t.includes('translate'))
    return '翻译模式已开启，请说出需要翻译的内容，我会实时显示在视野中。';

  // 设置/亮度
  if (t.includes('亮度') || t.includes('设置') || t.includes('音量'))
    return '已将显示亮度调至 80%。您也可以说"自动亮度"让我根据环境自动调节。';

  // IoT/智能家居
  if (t.includes('开灯') || t.includes('关灯') || t.includes('空调') || t.includes('家'))
    return '已执行：客厅灯已打开，空调设为 26°C 制冷模式。还需要调整其他设备吗？';

  // 车辆
  if (t.includes('车') || t.includes('su7') || t.includes('锁车'))
    return 'SU7 当前状态：电量 78%，车门已锁，车内温度 28°C。需要远程开启空调吗？';

  // 闹钟/提醒
  if (t.includes('闹钟') || t.includes('提醒') || t.includes('叫我'))
    return '好的，已设置提醒。到时间我会通过振动和语音提醒您。';

  // 你好/打招呼
  if (t.includes('你好') || t.includes('hello') || t.includes('hi') || t.includes('嗨'))
    return '你好！我是 Q95 Pro 的 AI 助手，随时为您服务。有什么可以帮您的？';

  // 你是谁
  if (t.includes('你是谁') || t.includes('介绍') || t.includes('什么'))
    return '我是 Q95 Pro 智能眼镜的 AI 助手，支持语音交互、AR 导航、健康监测、智能家居控制等功能。';

  // 谢谢
  if (t.includes('谢') || t.includes('thanks'))
    return '不客气！有需要随时叫我。';

  // 默认回复
  const defaults = [
    `收到，正在为您处理"${text}"。请稍候...`,
    `好的，我来帮您处理。"${text}"已记录。`,
    `明白了。关于"${text}"，我正在查询相关信息。`,
    `了解，"${text}"。让我想想最佳方案...`,
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export async function sendChat(userMessage: string): Promise<ChatResponse> {
  const apiKey = getApiKey();

  // 无 API Key 时使用本地智能回复
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 700)); // 模拟延迟
    return { text: localReply(userMessage) };
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
        messages: conversationHistory.slice(-10),
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

export function resetChat(): void {
  conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
}
