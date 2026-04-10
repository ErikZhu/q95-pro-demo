import { useState, useCallback, useMemo, useEffect } from 'react';
import './App.css';
import { Icon } from './components/icons/Icon';
import { Launcher } from './components/launcher/Launcher';
import { StatusBarView } from './components/status-bar/StatusBarView';
import { SmartTaskZoneView } from './components/smart-task/SmartTaskZoneView';
import { NotificationCenterView } from './components/notification/NotificationCenter';
import { MusicPlayerView } from './components/music/MusicPlayerView';
import { MiniPlayer } from './components/music/MiniPlayer';
import { ARNavigationView } from './components/ar-nav/ARNavigationView';
import { NavSearchResultsView } from './components/ar-nav/NavSearchResultsView';
import { NavDetailView } from './components/ar-nav/NavDetailView';
import type { POIResult } from './components/ar-nav/NavSearchResultsView';
import { CameraView } from './components/camera/CameraView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { TranslatorView } from './components/translator/TranslatorView';
import { TeleprompterView } from './components/teleprompter/TeleprompterView';
import { HealthMonitorView } from './components/health/HealthMonitorView';
import { MessagingView } from './components/messaging/MessagingView';
import { SettingsPanelView } from './components/settings/SettingsPanel';
import { DemoControlPanel } from './components/demo/DemoControlPanel';
import type { DeviceStatus, Notification } from './types/data';
import type { InputEvent } from './types/interaction';
import type { NavigationState, Route } from './types/navigation';
import type { UserSettings } from './types/settings';
import { SettingsPanel } from './services/SettingsPanel';
import { OrbMenuStateMachine } from './services/OrbMenuStateMachine';
import type { OrbMenuState } from './services/OrbMenuStateMachine';
import { SmartTaskZoneService } from './services/SmartTaskZone';
import { NavigationEngine } from './services/NavigationEngine';
import type { OrbMenuItemData } from './components/smart-task/OrbMenuItem';
import { OrbMenuView } from './components/smart-task/OrbMenuView';
import { sendChat } from './services/DeepSeekChat';
import type { AIStatus } from './types/ai';

/** Orb 菜单项数据：4 个应用导航入口 */
const ORB_MENU_ITEMS: OrbMenuItemData[] = [
  { id: 'notifications', icon: 'bell', label: '\u901A\u77E5', route: 'notification_center' },
  { id: 'camera', icon: 'camera', label: '\u76F8\u673A', route: 'camera' },
  { id: 'messaging', icon: 'chat', label: '\u6D88\u606F', route: 'messaging' },
  { id: 'settings', icon: 'gear', label: '\u8BBE\u7F6E', route: 'settings' },
];

const DEFAULT_DEVICE: DeviceStatus = {
  battery: { level: 85, isCharging: false, isLow: false, isCritical: false },
  bluetooth: { connected: true, deviceName: 'iPhone 15 Pro' },
  wifi: { connected: true, ssid: 'Home-5G', strength: 85 },
  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
};

const DEFAULT_SETTINGS: UserSettings = {
  displayBrightness: 70, fontSize: 14,
  notificationPrefs: { wechat: true, sms: true, call: true, email: true, system: true },
  interactionPriority: ['physical_button', 'voice', 'emg_band', 'side_touchpad', 'camera_gesture', 'head_tracking'],
  relayAllowedTypes: ['delivery', 'calendar', 'call', 'flight', 'ride', 'movie', 'wechat', 'music'],
  autoBrightness: true, wakeWord: '\u4F60\u597D\u5C0FQ',
};

const DEFAULT_NAV: NavigationState = {
  isActive: false,
  currentPosition: { lat: 31.2304, lng: 121.4737, name: '\u4E0A\u6D77' },
  nextTurn: { direction: 'straight', distance: 200 },
  remainingDistance: 1500, estimatedArrival: Date.now() + 600000, gpsSignal: 'strong',
};

const settingsSvc = new SettingsPanel(DEFAULT_SETTINGS);
const smartTaskZoneSvc = new SmartTaskZoneService();
const navigationEngine = new NavigationEngine();

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [dualMode, setDualMode] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [device] = useState<DeviceStatus>(DEFAULT_DEVICE);
  const [notifs] = useState<Notification[]>([]);
  const [nav] = useState<NavigationState>(DEFAULT_NAV);
  const [route] = useState<Route | null>(null);
  const sState = useMemo(() => settingsSvc.getState(), []);

  // Orb Menu 状态管理
  const [orbMenuState, setOrbMenuState] = useState<OrbMenuState>('orb_idle');
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  // 模拟眼动光标位置 (百分比)
  const [gazePos, setGazePos] = useState<{ x: number; y: number } | null>(null);

  // AI 对话状态
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [aiFeedbackText, setAiFeedbackText] = useState<string>('');
  const [aiConversation, setAiConversation] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  // 导航 POI 搜索结果
  const [navPoiResults, setNavPoiResults] = useState<POIResult[] | null>(null);
  const [navPoiQuery, setNavPoiQuery] = useState('');
  const [navSelectedIdx, setNavSelectedIdx] = useState(-1);
  const [navConfirmedPoi, setNavConfirmedPoi] = useState<POIResult | null>(null);

  const orbMenuSM = useMemo(() => {
    return new OrbMenuStateMachine(
      {
        onStateChange: (_from, to) => setOrbMenuState(to),
        onItemFocused: (itemId) => setFocusedItemId(itemId),
        onItemUnfocused: () => setFocusedItemId(null),
        onAppLaunch: (appId) => {
          const menuItem = ORB_MENU_ITEMS.find(item => item.route === appId);
          if (menuItem) {
            setActiveView(menuItem.id);
            setActiveAppId(menuItem.id);
          }
        },
        onMenuClose: () => setFocusedItemId(null),
      },
      smartTaskZoneSvc,
      navigationEngine,
    );
  }, []);

  // 音乐播放状态（语音指令可触发）
  const [musicState, setMusicState] = useState({
    status: 'paused' as 'playing' | 'paused' | 'stopped',
    currentTrack: null as { id: string; name: string; artist: string; album: string; duration: number } | null,
    progress: 0,
    volume: 70,
    pauseReason: null as string | null,
  });

  const launchApp = useCallback(async (id: string) => { setActiveView(id); }, []);

  /** 确认 POI 选择 → 跳转导航详情 */
  const confirmNavPoi = useCallback((poi: POIResult) => {
    setNavPoiResults(null);
    setNavSelectedIdx(-1);
    setNavConfirmedPoi(poi);
    setAiFeedbackText(`正在导航到 ${poi.name.split('（')[0]}...`);
    setAiStatus('responding');
    setActiveView('nav-detail');
    setTimeout(() => { setAiStatus('idle'); }, 4000);
  }, []);

  /** 意图路由：根据语音内容判断是否需要切换场景
   *  返回值: 'none' | 'routed' | 'poi-search' */
  const routeIntent = useCallback((text: string): string => {
    const t = text.toLowerCase();

    // 音乐场景：播放/音乐/歌/周杰伦等关键词
    if (t.includes('播放') || t.includes('音乐') || t.includes('歌') || t.includes('周杰伦') || t.includes('听') || t.includes('play') || t.includes('music')) {
      // 从文本中提取歌曲和歌手信息
      let trackName = '稻香';
      let artist = '周杰伦';
      if (t.includes('稻香')) trackName = '稻香';
      else if (t.includes('晴天')) trackName = '晴天';
      else if (t.includes('七里香')) trackName = '七里香';
      else if (t.includes('简单爱')) trackName = '简单爱';
      if (t.includes('周杰伦') || t.includes('jay')) artist = '周杰伦';
      else if (t.includes('林俊杰') || t.includes('jj')) artist = '林俊杰';
      else if (t.includes('陈奕迅') || t.includes('eason')) artist = '陈奕迅';

      setMusicState({
        status: 'playing',
        currentTrack: { id: 'track-1', name: trackName, artist, album: `${artist}精选`, duration: 234 },
        progress: 0,
        volume: 70,
        pauseReason: null,
      });
      setActiveView('music');
      return 'routed';
    }

    // 导航场景：检测"导航去+地点"模式
    if (t.includes('导航') || t.includes('怎么走') || t.includes('路线') || t.includes('navigate')) {
      // 提取目的地关键词（支持"导航去xxx"、"导航到xxx"、"帮我导航去xxx"）
      const destMatch = text.match(/导航[去到](.+)/);
      const dest = destMatch ? destMatch[1].replace(/[，。,.!！？?]/g, '').trim() : '';

      // 也支持直接包含地点关键词的情况（如"帮我导航 最近的药店"）
      const hasDest = dest.length > 0;
      const fullText = text;

      // 如果有明确目的地 → 显示 POI 搜索结果
      if ((hasDest && (dest.includes('药店') || dest.includes('药房'))) ||
          (!hasDest && (fullText.includes('药店') || fullText.includes('药房')))) {
        const label = hasDest ? dest : '药店';
        setNavPoiQuery(label);
        setNavSelectedIdx(-1);
        setNavPoiResults([
          { id: 'poi-1', name: '益丰大药房（科技园店）', status: '营业中', distance: '126 米', duration: '步行 2 分钟' },
          { id: 'poi-2', name: '海王星辰健康药房（高新南店）', status: '营业中', distance: '358 米', duration: '步行 5 分钟' },
          { id: 'poi-3', name: '国大药房（科兴科学园店）', status: '即将打烊', distance: '1.2 公里', duration: '骑行 6 分钟' },
        ]);
        setActiveView('nav-search');
        return 'poi-search';
      } else if (hasDest) {
        // 其他目的地 → 通用 POI 结果
        setNavPoiQuery(dest);
        setNavSelectedIdx(-1);
        setNavPoiResults([
          { id: 'poi-1', name: `${dest}（附近推荐）`, status: '营业中', distance: '200 米', duration: '步行 3 分钟' },
          { id: 'poi-2', name: `${dest}（次选）`, status: '营业中', distance: '500 米', duration: '步行 7 分钟' },
          { id: 'poi-3', name: `${dest}（备选）`, status: '营业中', distance: '1.0 公里', duration: '骑行 5 分钟' },
        ]);
        setActiveView('nav-search');
        return 'poi-search';
      }

      setActiveView('navigation');
      return 'routed';
    }

    // 拍照场景
    if (t.includes('拍照') || t.includes('相机') || t.includes('照片') || t.includes('camera')) {
      setActiveView('camera');
      return 'routed';
    }

    // 翻译场景
    if (t.includes('翻译') || t.includes('translate')) {
      setActiveView('translator');
      return 'routed';
    }

    // 健康场景
    if (t.includes('心率') || t.includes('健康') || t.includes('血氧') || t.includes('步数')) {
      setActiveView('health');
      return 'routed';
    }

    // 通知场景
    if (t.includes('通知') || t.includes('消息') || t.includes('未读')) {
      setActiveView('notifications');
      return 'routed';
    }

    // 设置场景
    if (t.includes('设置') || t.includes('亮度') || t.includes('音量')) {
      setActiveView('settings');
      return 'routed';
    }

    return 'none'; // 不匹配任何场景
  }, []);

  const onInput = useCallback(async (e: InputEvent) => {
    // 返回按钮 → 回到首页
    if (e.type === 'back') {
      setActiveView('home');
      setNavPoiResults(null);
      setNavSelectedIdx(-1);
      return;
    }

    // ── nav-search 模式：手势控制 POI 列表 ──
    if (navPoiResults && navPoiResults.length > 0) {
      const count = navPoiResults.length;

      // 上滑 → 选中上一项
      if (e.source === 'side_touchpad' && e.type === 'swipe' && e.data?.direction === 'up') {
        setNavSelectedIdx(prev => prev <= 0 ? count - 1 : prev - 1);
        return;
      }
      // 下滑 → 选中下一项
      if (e.source === 'side_touchpad' && e.type === 'swipe' && e.data?.direction === 'down') {
        setNavSelectedIdx(prev => prev < 0 ? 0 : (prev + 1) % count);
        return;
      }
      // 点击/确认/捏合 → 确认当前选中项
      if ((e.source === 'side_touchpad' && e.type === 'tap') ||
          (e.source === 'physical_button' && e.type === 'confirm') ||
          (e.source === 'emg_band' && e.type === 'pinch')) {
        if (navSelectedIdx >= 0 && navSelectedIdx < count) {
          confirmNavPoi(navPoiResults[navSelectedIdx]);
        }
        return;
      }

      // 语音"第X个" → 直接选中并确认；语音"确认" → 确认当前选中
      if (e.source === 'voice' && e.type === 'command' && e.data?.text) {
        const vt = String(e.data.text);

        // 语音"确认"/"确定"/"好的"/"出发" → 确认当前选中项
        if ((vt.includes('确认') || vt.includes('确定') || vt.includes('好的') || vt.includes('出发')) &&
            navSelectedIdx >= 0 && navSelectedIdx < count) {
          confirmNavPoi(navPoiResults[navSelectedIdx]);
          return;
        }

        const numMap: Record<string, number> = {
          '一': 0, '1': 0, '第一': 0, '第一个': 0, '第1个': 0,
          '二': 1, '2': 1, '第二': 1, '第二个': 1, '第2个': 1,
          '三': 2, '3': 2, '第三': 2, '第三个': 2, '第3个': 2,
        };
        for (const [key, idx] of Object.entries(numMap)) {
          if (vt.includes(key) && idx < count) {
            setNavSelectedIdx(idx);
            // 短暂高亮后自动确认
            setTimeout(() => confirmNavPoi(navPoiResults[idx]), 600);
            return;
          }
        }
        // 其他语音 → 不拦截，走正常流程
      }
    }

    // 处理语音/文本输入 → Sensible Response System
    if (e.source === 'voice' && e.type === 'command' && e.data?.text) {
      const userText = String(e.data.text);

      // Phase 1: 用户输入确认（L1 → L2）— 0-0.3s
      setAiStatus('listening');
      setAiFeedbackText(userText); // 纯文本，不加 emoji
      setAiConversation(prev => [...prev, { role: 'user', text: userText }]);

      // Phase 2: 意图路由 + 思考（L1 Orb 状态变化）— 0.3s
      const routeResult = routeIntent(userText);

      // POI 搜索结果场景 → 跳过 AI 对话，直接显示结果
      if (routeResult === 'poi-search') {
        setTimeout(() => { setAiStatus('idle'); setAiFeedbackText(''); }, 1500);
        return;
      }

      const routed = routeResult === 'routed';
      await new Promise(r => setTimeout(r, 300));
      setAiStatus('thinking');
      setAiFeedbackText(''); // 思考时清空文字，只靠 Orb 传达状态

      // Phase 3: 调用 AI — 0.3s-2s
      const response = await sendChat(userText);

      // Phase 4: AI 回复（L2 字幕流）— 显示 5s
      setAiStatus('responding');
      setAiFeedbackText(response.text);
      setAiConversation(prev => [...prev, { role: 'assistant', text: response.text }]);

      // Phase 5: 时间衰减 — 回复后 5s 淡出
      const fadeDelay = routed ? 4000 : 6000;
      setTimeout(() => {
        setAiStatus('idle');
        setAiFeedbackText('');
      }, fadeDelay);
    }
  }, [routeIntent, navPoiResults, navSelectedIdx, confirmNavPoi]);

  const toggleDemo = useCallback(() => setShowDemo((p) => !p), []);

  // 根据当前视图设置持久任务提示
  const VIEW_HINTS: Record<string, string> = {
    'nav-detail': '小Q正在帮你导航中...',
    'nav-search': '小Q正在帮你搜索附近地点...',
    'navigation': '小Q正在帮你导航中...',
    'music': '小Q正在帮你播放音乐...',
    'camera': '小Q正在帮你拍照...',
    'translator': '小Q正在帮你翻译...',
    'health': '小Q正在帮你查看健康数据...',
    'notifications': '小Q正在帮你查看通知...',
    'settings': '小Q正在帮你调整设置...',
    'messaging': '小Q正在帮你处理消息...',
    'teleprompter': '小Q正在帮你提词...',
  };
  // 当 aiStatus 回到 idle 且不在首页时，设置任务提示
  useEffect(() => {
    if (aiStatus === 'idle' && activeView !== 'home') {
      const hint = VIEW_HINTS[activeView] || '';
      if (hint) setAiFeedbackText(hint);
    } else if (aiStatus === 'idle' && activeView === 'home') {
      setAiFeedbackText('');
    }
  }, [aiStatus, activeView]);

  const content = () => {
    switch (activeView) {
      case 'home': return <Launcher deviceStatus={device} onLaunchApp={launchApp} />;
      case 'notifications': return <NotificationCenterView notifications={notifs} groupedNotifications={new Map()} mode="list" unreadCount={notifs.filter((n) => !n.isRead).length} />;
      case 'navigation': return <ARNavigationView navigationState={nav} route={route} />;
      case 'nav-search': return navPoiResults ? (
        <NavSearchResultsView
          query={navPoiQuery}
          results={navPoiResults}
          selectedIndex={navSelectedIdx}
          onSelect={(_poi, idx) => setNavSelectedIdx(idx)}
        />
      ) : <Launcher deviceStatus={device} onLaunchApp={launchApp} />;
      case 'nav-detail': return navConfirmedPoi ? (
        <NavDetailView
          nextDistance={navConfirmedPoi.distance}
          turnText="左转进入永初路"
          totalDistance="1.2 公里"
          eta={new Date(Date.now() + 300000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          destination={navConfirmedPoi.name.split('（')[0]}
        />
      ) : <Launcher deviceStatus={device} onLaunchApp={launchApp} />;
      case 'camera': return <CameraView recordingState={{ isRecording: false, duration: 0, startTime: null, resolution: { width: 1920, height: 1080 } }} storageInfo={{ total: 8192, used: 2048, remaining: 6144, isLow: false }} />;
      case 'music': return <MusicPlayerView playbackState={musicState} />;
      case 'ai': return <AIAssistantView status="idle" conversation={[]} />;
      case 'translator': return <TranslatorView state={{ isActive: false, sourceLang: 'zh-CN', targetLang: 'en', inputMode: 'voice', isOnline: true, results: [], isTranslating: false }} />;
      case 'teleprompter': return <TeleprompterView state={{ status: 'idle', text: '', scrollPosition: 0, scrollSpeed: 2, fontSize: 24, opacity: 0.85, phoneConnected: false }} />;
      case 'health': return <HealthMonitorView state={{ status: 'idle', healthData: { steps: 8500, heartRate: 72, calories: 320, lastUpdated: Date.now() }, currentWorkout: null, alerts: [], deviceConnected: true, deviceName: 'Apple Watch Ultra' }} />;
      case 'messaging': return <MessagingView state={{ messages: [], callState: { status: 'idle', callerName: null, callerNumber: null, duration: 0, useMic: true, useSpeaker: true }, bluetoothStatus: 'connected', bluetoothWarning: null }} />;
      case 'settings': return <SettingsPanelView state={sState} />;
      default: return <Launcher deviceStatus={device} onLaunchApp={launchApp} />;
    }
  };

  const layout = () => (
    <div className="screen-layout">
      <div className="top-bar-row">
        <div className="smart-task-zone-slot">
          <SmartTaskZoneView
            aiStatus={aiStatus}
            tasks={aiConversation.length > 0 ? [{
              taskId: 'ai-chat',
              source: 'ai_assistant',
              title: 'AI 对话',
              statusText: aiConversation[aiConversation.length - 1]?.text || '',
              priority: 1,
              timestamp: Date.now(),
            }] : []}
            state="compact"
            aiFeedbackText={aiFeedbackText}
            orbMenuState={orbMenuState}
            orbMenuItems={ORB_MENU_ITEMS}
            focusedItemId={focusedItemId}
            activeAppId={activeAppId}
            onGazeItem={(itemId) => orbMenuSM.send({ type: 'GAZE_ITEM', itemId })}
            onGazeItemEnd={() => orbMenuSM.send({ type: 'GAZE_ITEM_END' })}
            onConfirmSelect={(source) => orbMenuSM.send({ type: 'CONFIRM_SELECT', source })}
            onOrbGazeStart={() => orbMenuSM.send({ type: 'GAZE_ORB_START' })}
            onOrbGazeEnd={() => orbMenuSM.send({ type: 'GAZE_ORB_END' })}
          />
        </div>
        <div className="status-bar-slot"><StatusBarView status={device} isExpanded={false} /></div>
      </div>
      <div className="main-task-area">
        {content()}
        {musicState.status === 'playing' && activeView === 'home' && musicState.currentTrack && (
          <MiniPlayer
            trackName={musicState.currentTrack.name}
            artist={musicState.currentTrack.artist}
            isPlaying={true}
            onClick={() => setActiveView('music')}
          />
        )}
      </div>
      <OrbMenuView
        menuState={orbMenuState}
        menuItems={ORB_MENU_ITEMS}
        focusedItemId={focusedItemId}
        activeAppId={activeAppId}
        orbPosition={{ x: 400, y: 300 }}
        onGazeItem={(itemId) => orbMenuSM.send({ type: 'GAZE_ITEM', itemId })}
        onGazeItemEnd={() => orbMenuSM.send({ type: 'GAZE_ITEM_END' })}
        onConfirmSelect={(source) => orbMenuSM.send({ type: 'CONFIRM_SELECT', source })}
      />
    </div>
  );

  return (
    <div className="resolution-viewport">
      <div className="glasses-frame-wrapper">
        <div className={`glasses-lens-container ${dualMode ? '' : 'single-mode'}`}>
          {dualMode ? (
            <>
              <div className="lens-viewport left-lens"><div className="eye-label">L</div><div className="eye-content">{layout()}</div></div>
              <div className="lens-viewport right-lens"><div className="eye-label">R</div><div className="eye-content">{layout()}</div></div>
            </>
          ) : (
            <div className="lens-viewport"><div className="eye-content">{layout()}</div></div>
          )}
        </div>
        {gazePos && (
          <div
            className="gaze-cursor"
            style={{ left: `${gazePos.x}%`, top: `${gazePos.y}%` }}
            data-testid="gaze-cursor"
          />
        )}
      </div>
      <div className="demo-controls">
        <button className={`toggle-btn ${dualMode ? 'active' : ''}`} onClick={() => setDualMode((p) => !p)} aria-label={dualMode ? '\u5207\u6362\u5355\u76EE\u6A21\u5F0F' : '\u5207\u6362\u53CC\u76EE\u6A21\u5F0F'}>
          <Icon name={dualMode ? 'glasses' : 'eye'} size={14} /> {dualMode ? '\u53CC\u76EE' : '\u5355\u76EE'}
        </button>
        <button className={`toggle-btn ${showDemo ? 'active' : ''}`} onClick={toggleDemo} aria-label="\u4EA4\u4E92\u6A21\u62DF\u9762\u677F">
          <Icon name="gamepad" size={14} /> {'\u6A21\u62DF'}
        </button>
      </div>
      <DemoControlPanel visible={showDemo} onToggle={toggleDemo} onInput={onInput} onGazeCursorMove={setGazePos} />
    </div>
  );
}
