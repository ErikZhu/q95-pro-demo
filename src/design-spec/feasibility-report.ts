/**
 * Q95 Pro 技术可行性分析报告
 *
 * 评估各功能模块的实现难度、风险等级、技术依赖和缓解策略。
 * 为后续开发排期和资源分配提供决策依据。
 *
 * 需求: 21.6
 */

// ─── 类型定义 ────────────────────────────────────────────────

/** 实现难度评级：1=简单, 2=较易, 3=中等, 4=较难, 5=极难 */
export type DifficultyRating = 1 | 2 | 3 | 4 | 5;

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** 功能模块可行性评估 */
export interface ModuleFeasibility {
  /** 模块标识 */
  moduleId: string;
  /** 模块名称 */
  name: string;
  /** 模块描述 */
  description: string;
  /** 实现难度 (1-5) */
  difficulty: DifficultyRating;
  /** 风险等级 */
  riskLevel: RiskLevel;
  /** 关键技术依赖 */
  dependencies: string[];
  /** 风险描述 */
  riskDescription: string;
  /** 缓解策略 */
  mitigation: string;
}

/** 开发阶段建议 */
export interface DevelopmentPhase {
  phase: number;
  name: string;
  modules: string[];
  description: string;
}

/** 可行性分析总结 */
export interface FeasibilitySummary {
  totalModules: number;
  averageDifficulty: number;
  highRiskCount: number;
  keyTechnicalRisks: string[];
  recommendedPhases: DevelopmentPhase[];
}

// ─── 各模块可行性评估 ────────────────────────────────────────

export const MODULE_FEASIBILITY: ModuleFeasibility[] = [
  {
    moduleId: 'display_panel',
    name: 'Display Panel（显示面板）',
    description: 'Micro-OLED/MicroLED 双目显示驱动，亮度控制与自动调节',
    difficulty: 4,
    riskLevel: 'high',
    dependencies: [
      'Micro-OLED 或 MicroLED 硬件供应链',
      '双目显示驱动 SDK',
      '环境光传感器 HAL',
      'Android Display HAL',
    ],
    riskDescription: 'Micro-OLED 供应商有限（Sony、BOE），MicroLED 量产良率不稳定；双目光学对齐精度要求高',
    mitigation: '同时评估 Micro-OLED 和 MicroLED 两条路线，与多家供应商建立合作；预留 LCoS 作为降级方案',
  },
  {
    moduleId: 'layout_manager',
    name: 'Layout Manager（布局管理器）',
    description: '三分区屏幕布局系统，管理 Main_Task_Area、Smart_Task_Zone、Status_Bar',
    difficulty: 2,
    riskLevel: 'low',
    dependencies: [
      '自定义 Compose 渲染引擎',
      'Display Panel 分辨率参数',
    ],
    riskDescription: '布局逻辑本身复杂度不高，但需适配不同分辨率的显示面板',
    mitigation: '采用响应式布局设计，基于百分比和约束系统而非固定像素值',
  },
  {
    moduleId: 'smart_task_zone',
    name: 'Smart Task Zone（智能任务区）',
    description: '注视检测触发展开、状态机管理、AI 状态球动效',
    difficulty: 4,
    riskLevel: 'high',
    dependencies: [
      '眼动追踪硬件/算法',
      'EMG 手环 SDK',
      'Head Tracking 传感器',
      'AI Assistant 服务',
    ],
    riskDescription: '注视检测精度受限于眼动追踪硬件；1秒注视判定阈值可能导致误触发或漏触发',
    mitigation: '结合头部朝向和眼动数据做融合判定；提供灵敏度可调参数；增加确认步骤降低误操作',
  },
  {
    moduleId: 'status_bar',
    name: 'Status Bar（设备状态栏）',
    description: '电量、蓝牙、Wi-Fi、时间等设备状态实时显示',
    difficulty: 1,
    riskLevel: 'low',
    dependencies: [
      'Android System API',
      'BLE 状态广播',
      'Wi-Fi Manager API',
    ],
    riskDescription: '功能成熟，风险极低；主要关注低电量场景下的显示策略',
    mitigation: '复用 Android 标准系统 API，重点测试边界电量阈值',
  },
  {
    moduleId: 'interaction_manager',
    name: 'Interaction Manager（交互管理器）',
    description: '六种交互方式统一管理、优先级冲突解决、<100ms 响应延迟',
    difficulty: 5,
    riskLevel: 'critical',
    dependencies: [
      '侧边触控板驱动',
      '语音 ASR 引擎',
      'EMG 手环 BLE SDK',
      '摄像头手势识别模型',
      'IMU 头部追踪算法',
      '物理按键 GPIO 驱动',
    ],
    riskDescription: '六种异构输入源的实时冲突解决极具挑战；各传感器延迟差异大，难以统一保证 <100ms 响应；摄像头手势识别功耗高',
    mitigation: '分阶段实现：先支持物理按键+语音+侧边触控，再逐步接入 EMG/摄像头/头部追踪；建立输入事件统一抽象层',
  },
  {
    moduleId: 'launcher',
    name: 'Launcher（主界面）',
    description: '主界面展示、应用快捷入口、500ms 内启动应用',
    difficulty: 2,
    riskLevel: 'low',
    dependencies: [
      'Layout Manager',
      'Navigation Engine',
      'Android Activity Manager',
    ],
    riskDescription: '功能相对标准；主要风险在于冷启动性能优化',
    mitigation: '预加载常用应用进程；使用应用启动优化策略（预热、缓存）',
  },
  {
    moduleId: 'notification_center',
    name: 'Notification Center（通知中心）',
    description: '通知聚合、时间排序、分组显示、自动归档',
    difficulty: 2,
    riskLevel: 'low',
    dependencies: [
      'Android NotificationListenerService',
      'Layout Manager',
      'Phone Relay 服务',
    ],
    riskDescription: '通知系统成熟度高；需关注大量通知时的性能和视觉干扰',
    mitigation: '实现智能过滤和优先级排序；限制同时显示的通知数量',
  },
  {
    moduleId: 'ai_assistant',
    name: 'AI Assistant（AI 语音助手）',
    description: '唤醒词检测、语音识别、NLU 意图解析、多轮对话',
    difficulty: 5,
    riskLevel: 'critical',
    dependencies: [
      '端侧 ASR 引擎（如 Sherpa-ONNX）',
      '云端 LLM API（如 GPT/文心）',
      '唤醒词检测模型',
      '麦克风阵列硬件',
      '降噪算法',
    ],
    riskDescription: '端侧 ASR 精度与功耗平衡困难；云端 LLM 延迟不可控（网络依赖）；户外噪声环境下识别率下降严重',
    mitigation: '端侧仅做唤醒词+短指令识别，复杂语义交给云端；集成多麦克风波束成形降噪；提供离线基础指令集',
  },
  {
    moduleId: 'task_center',
    name: 'Task Center（任务中心）',
    description: '跨设备 Intent 路由、复合任务拆解、设备可达性检查',
    difficulty: 4,
    riskLevel: 'high',
    dependencies: [
      'AI Assistant NLU 输出',
      'IoT Control / Vehicle Link / Watch Link 服务',
      'BLE 5.0 / Wi-Fi Direct 通信',
      'Third Party Control API',
    ],
    riskDescription: '跨设备通信可靠性难以保证；复合任务拆解需要高质量 NLU；设备离线场景处理复杂',
    mitigation: '实现任务队列和重试机制；为每种设备定义明确的能力清单；离线时缓存任务待设备上线后执行',
  },
  {
    moduleId: 'iot_control',
    name: 'IoT Control（IoT 设备控制）',
    description: '智能家居状态查询、场景自动化、设备动作执行',
    difficulty: 3,
    riskLevel: 'medium',
    dependencies: [
      'IoT 平台 SDK（米家/HomeKit/Matter）',
      'BLE/Wi-Fi 通信',
      'Task Center 路由',
    ],
    riskDescription: 'IoT 生态碎片化严重，不同品牌协议不统一；Matter 协议尚未完全普及',
    mitigation: '优先支持 Matter 协议作为统一层；同时适配主流平台（米家、HomeKit）；提供设备发现和配对引导',
  },
  {
    moduleId: 'vehicle_link',
    name: 'Vehicle Link（车机互联）',
    description: '车辆状态查询、车机协同、远程车辆控制',
    difficulty: 4,
    riskLevel: 'high',
    dependencies: [
      '车厂开放 API / 车联网平台',
      'BLE / 蜂窝网络通信',
      '车辆安全认证体系',
    ],
    riskDescription: '车厂 API 开放程度有限且标准不统一；车辆控制涉及安全认证要求高；网络延迟影响体验',
    mitigation: '先与 1-2 家车厂深度合作打通 API；车辆控制操作增加二次确认；支持离线状态查询缓存',
  },
  {
    moduleId: 'watch_link',
    name: 'Watch Link（手表互联）',
    description: '手表数据查询和动作执行',
    difficulty: 2,
    riskLevel: 'low',
    dependencies: [
      '手表 BLE SDK',
      'Health Connect API',
      'Wear OS / 自研手表平台 SDK',
    ],
    riskDescription: '自有生态手表对接相对可控；第三方手表兼容性需额外适配',
    mitigation: '优先支持自有品牌手表；通过 Health Connect 标准 API 兼容第三方设备',
  },
  {
    moduleId: 'third_party_control',
    name: 'Third Party Control（三方应用控制）',
    description: '社交/娱乐/办公类应用语音控制、Voice Intent API',
    difficulty: 4,
    riskLevel: 'high',
    dependencies: [
      'Voice Intent API 标准定义',
      '三方应用适配合作',
      'Android Accessibility Service',
      'Intent 路由引擎',
    ],
    riskDescription: '三方应用接入意愿和适配进度不可控；Voice Intent API 标准需要生态推广；未适配应用的降级体验差',
    mitigation: '先通过 Accessibility Service 实现基础控制；同步推广 Voice Intent API 标准；提供应用适配 SDK 降低接入成本',
  },
  {
    moduleId: 'ar_navigation',
    name: 'AR Navigation（AR 导航）',
    description: 'AR 路线叠加显示、实时位置更新、偏离重新规划',
    difficulty: 5,
    riskLevel: 'critical',
    dependencies: [
      '高德/百度 AR SDK',
      'GPS + IMU 融合定位',
      'SLAM 视觉定位（可选）',
      '3D 渲染引擎',
      '地图数据服务',
    ],
    riskDescription: 'AR 叠加精度依赖定位精度，室内/遮挡场景 GPS 信号差；AR SDK 在眼镜端的性能和功耗优化困难；渲染帧率需保持流畅',
    mitigation: '采用 GPS+IMU+视觉融合定位方案；与地图厂商合作优化 AR SDK 轻量版；降级为 2D HUD 导航作为备选',
  },
  {
    moduleId: 'camera_module',
    name: 'Camera Module（拍照与录像）',
    description: '300ms 快速拍照、录像状态管理、存储空间监控',
    difficulty: 3,
    riskLevel: 'medium',
    dependencies: [
      '摄像头硬件模组',
      'Camera2 / CameraX API',
      '图像处理 ISP',
      '存储管理',
    ],
    riskDescription: '眼镜端摄像头模组尺寸受限，成像质量与手机有差距；300ms 拍照延迟需要 ISP 优化',
    mitigation: '选用高性能小尺寸 CMOS 传感器；优化 ISP pipeline 缩短处理延迟；支持 RAW 格式后期处理',
  },
  {
    moduleId: 'music_player',
    name: 'Music Player（音乐播放）',
    description: '播放控制、侧边触控切换、来电自动暂停',
    difficulty: 1,
    riskLevel: 'low',
    dependencies: [
      'Android MediaSession API',
      '蓝牙音频协议（A2DP/LE Audio）',
      'Side Touchpad 事件',
    ],
    riskDescription: '功能成熟，风险极低；主要关注蓝牙音频延迟',
    mitigation: '优先支持 LE Audio 低延迟协议；实现音频焦点管理确保来电暂停',
  },
  {
    moduleId: 'translator',
    name: 'Translator（实时翻译）',
    description: '1秒内实时翻译显示、多语言支持、离线模式',
    difficulty: 4,
    riskLevel: 'high',
    dependencies: [
      '端侧/云端翻译引擎',
      '语音识别（ASR）',
      'OCR 文字识别（可选）',
      '离线翻译模型',
    ],
    riskDescription: '实时语音翻译延迟控制在 1 秒内极具挑战；离线翻译模型体积大、精度低；多语言支持增加模型复杂度',
    mitigation: '采用流式 ASR + 增量翻译降低感知延迟；离线模型仅支持高频语言对；提供翻译质量置信度提示',
  },
  {
    moduleId: 'teleprompter',
    name: 'Teleprompter（提词器）',
    description: '文本加载、自动滚动速度控制、暂停/恢复',
    difficulty: 1,
    riskLevel: 'low',
    dependencies: [
      'Layout Manager 渲染',
      'Side Touchpad 速度控制',
      '蓝牙文件传输',
    ],
    riskDescription: '功能简单，风险极低；需关注长文本渲染性能和半透明显示效果',
    mitigation: '使用虚拟滚动优化长文本渲染；调优半透明度确保文字清晰且不遮挡视线',
  },
  {
    moduleId: 'health_monitor',
    name: 'Health Monitor（健康监测）',
    description: '健康数据显示、运动类型识别、心率异常检测',
    difficulty: 3,
    riskLevel: 'medium',
    dependencies: [
      '心率传感器（PPG）',
      'IMU 运动传感器',
      'Health Connect API',
      '运动识别算法',
    ],
    riskDescription: '眼镜端 PPG 传感器佩戴位置不理想，心率数据精度受限；运动类型自动识别需要训练数据',
    mitigation: '主要依赖配对手环/手表的健康数据同步；眼镜端仅做数据展示和异常提醒；运动识别使用 IMU 加速度特征',
  },
  {
    moduleId: 'messaging_module',
    name: 'Messaging Module（消息与通话）',
    description: '消息接收预览、语音回复、来电处理',
    difficulty: 2,
    riskLevel: 'medium',
    dependencies: [
      'Android SMS/MMS API',
      '蓝牙 HFP 通话协议',
      '麦克风 + 扬声器硬件',
      'ASR 语音输入',
    ],
    riskDescription: '通话音质受限于眼镜端扬声器和麦克风；嘈杂环境下通话体验差',
    mitigation: '支持蓝牙耳机音频路由；集成降噪算法；提供振动提醒作为补充',
  },
  {
    moduleId: 'settings_panel',
    name: 'Settings Panel（设置面板）',
    description: '系统设置分类管理、即时应用更改',
    difficulty: 1,
    riskLevel: 'low',
    dependencies: [
      'Android Settings Provider',
      'Layout Manager',
      'Interaction Manager',
    ],
    riskDescription: '功能标准化程度高，风险极低',
    mitigation: '复用 Android 设置框架，自定义 UI 适配眼镜显示',
  },
  {
    moduleId: 'app_store_bridge',
    name: 'App Store Bridge（应用商店桥接）',
    description: '通过配对手机浏览和安装眼镜应用',
    difficulty: 3,
    riskLevel: 'medium',
    dependencies: [
      '应用商店后端服务',
      '应用签名和安全验证',
      'BLE/Wi-Fi 应用传输',
      '存储空间管理',
    ],
    riskDescription: '需要建设眼镜专属应用生态；应用兼容性审核机制待建立；大体积应用传输耗时',
    mitigation: '初期通过手机端应用商店代理安装；建立应用兼容性测试框架；支持 Wi-Fi Direct 加速传输',
  },
  {
    moduleId: 'phone_relay',
    name: 'Phone Relay（手机信息流转）',
    description: '8 种信息类型差异化卡片、智能排序算法、蓝牙断开保留',
    difficulty: 3,
    riskLevel: 'medium',
    dependencies: [
      'BLE 5.0 持续连接',
      '手机端 Relay Agent 应用',
      'Android Notification Access',
      '各类信息源 API 适配',
    ],
    riskDescription: '手机端信息源多样，适配工作量大；蓝牙连接稳定性影响实时性；排序算法需要用户反馈迭代',
    mitigation: '优先适配高频信息类型（外卖、日程、微信）；实现断线重连和数据缓存；排序权重支持用户自定义',
  },
] as const;


// ─── 可行性分析总结 ──────────────────────────────────────────

export const FEASIBILITY_SUMMARY: FeasibilitySummary = {
  totalModules: MODULE_FEASIBILITY.length,
  averageDifficulty: +(
    MODULE_FEASIBILITY.reduce((sum, m) => sum + m.difficulty, 0) /
    MODULE_FEASIBILITY.length
  ).toFixed(1),
  highRiskCount: MODULE_FEASIBILITY.filter(
    (m) => m.riskLevel === 'high' || m.riskLevel === 'critical',
  ).length,
  keyTechnicalRisks: [
    '多模态交互六种输入源的实时冲突解决和统一 <100ms 延迟保证',
    'AI 语音助手端侧 ASR 精度与功耗平衡，云端 LLM 网络延迟不可控',
    'AR 导航定位精度依赖 GPS+IMU+视觉融合，室内场景退化严重',
    'Micro-OLED/MicroLED 供应链稳定性和双目光学对齐精度',
    '三方应用语音控制生态建设周期长，Voice Intent API 推广不确定',
    '实时翻译 1 秒延迟目标在端侧算力受限条件下难以达成',
    '跨设备通信（IoT/车机/手表）协议碎片化和连接可靠性',
  ],
  recommendedPhases: [
    {
      phase: 1,
      name: '基础框架与核心交互',
      modules: [
        'display_panel',
        'layout_manager',
        'status_bar',
        'launcher',
        'settings_panel',
        'interaction_manager',
      ],
      description:
        '搭建显示和布局基础设施，实现物理按键+语音+侧边触控三种核心交互方式，完成主界面和设置面板',
    },
    {
      phase: 2,
      name: 'AI 助手与通知系统',
      modules: [
        'ai_assistant',
        'smart_task_zone',
        'notification_center',
        'messaging_module',
      ],
      description:
        '实现 AI 语音助手核心能力（唤醒+ASR+NLU），搭建智能任务区状态机，完成通知和消息模块',
    },
    {
      phase: 3,
      name: '应用功能模块',
      modules: [
        'camera_module',
        'music_player',
        'teleprompter',
        'health_monitor',
        'phone_relay',
      ],
      description:
        '实现拍照录像、音乐播放、提词器、健康监测等独立应用模块，以及手机信息流转系统',
    },
    {
      phase: 4,
      name: '跨设备控制与高级功能',
      modules: [
        'task_center',
        'iot_control',
        'vehicle_link',
        'watch_link',
        'third_party_control',
      ],
      description:
        '实现跨设备任务路由和控制能力，接入 IoT/车机/手表生态，推广三方应用 Voice Intent API',
    },
    {
      phase: 5,
      name: 'AR 与翻译高级能力',
      modules: ['ar_navigation', 'translator', 'app_store_bridge'],
      description:
        '集成 AR 导航 SDK，实现实时翻译能力，建设应用商店生态；这些模块技术风险最高，放在最后以获得更多技术验证时间',
    },
  ],
};
