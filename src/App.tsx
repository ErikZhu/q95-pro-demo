import { useState, useCallback, useMemo } from 'react';
import './App.css';
import { Icon } from './components/icons/Icon';
import { Launcher } from './components/launcher/Launcher';
import { StatusBarView } from './components/status-bar/StatusBarView';
import { SmartTaskZoneView } from './components/smart-task/SmartTaskZoneView';
import { NotificationCenterView } from './components/notification/NotificationCenter';
import { MusicPlayerView } from './components/music/MusicPlayerView';
import { ARNavigationView } from './components/ar-nav/ARNavigationView';
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

  const launchApp = useCallback(async (id: string) => { setActiveView(id); }, []);
  const onInput = useCallback((_e: InputEvent) => {}, []);
  const toggleDemo = useCallback(() => setShowDemo((p) => !p), []);

  const content = () => {
    switch (activeView) {
      case 'home': return <Launcher deviceStatus={device} onLaunchApp={launchApp} />;
      case 'notifications': return <NotificationCenterView notifications={notifs} groupedNotifications={new Map()} mode="list" unreadCount={notifs.filter((n) => !n.isRead).length} />;
      case 'navigation': return <ARNavigationView navigationState={nav} route={route} />;
      case 'camera': return <CameraView recordingState={{ isRecording: false, duration: 0, startTime: null, resolution: { width: 1920, height: 1080 } }} storageInfo={{ total: 8192, used: 2048, remaining: 6144, isLow: false }} />;
      case 'music': return <MusicPlayerView playbackState={{ status: 'paused', currentTrack: null, progress: 0, volume: 70, pauseReason: null }} />;
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
            aiStatus="idle"
            tasks={[]}
            state="compact"
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
      <div className="main-task-area">{content()}</div>
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
