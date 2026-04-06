# Q95 Pro 智能眼镜系统交互预研 Demo

基于 React + TypeScript + Vite 构建的 Q95 Pro 智能眼镜系统交互可视化 Demo，用于展示产品概念和交互设计方案。

## 技术栈

- **框架**: React 19 + TypeScript 5.9
- **构建工具**: Vite 8
- **3D 渲染**: Three.js + @react-three/fiber + @react-three/drei
- **测试**: Vitest
- **代码规范**: ESLint + Prettier

## 核心功能

- 🔲 双目显示视觉效果模拟（Three.js 双视口渲染）
- 📱 11 个场景视图：Launcher、通知中心、AR 导航、相机、音乐、AI 助手、翻译、提词器、健康、消息、设置
- 🎮 多模态交互模拟面板（侧边触控、语音、EMG 手势、摄像头手势、头部追踪、物理按键）
- 📐 三分区布局：智能任务区（Smart Task Zone）、设备状态栏（Status Bar）、主任务区（Main Task Area）
- 🤖 AI 语音助手与跨设备任务中心（IoT、车机、手表、手机信息流转）
- 📋 系统交互设计规范文档（视觉语言、动效规范、手势映射、布局规范、导航流程、可行性分析）

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后在浏览器中打开 `http://localhost:5173` 即可访问 Demo。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 跨设备访问

Demo 支持在 PC 和手机浏览器上运行：

- **PC 浏览器**: 推荐使用 Chrome / Edge / Firefox 最新版本，获得最佳 3D 渲染效果
- **手机浏览器**: 支持 iOS Safari 和 Android Chrome，布局自适应移动端屏幕
- **局域网访问**: 开发服务器启动后，手机可通过局域网 IP 地址访问（Vite 默认监听 `--host` 已配置）

## 项目结构

```
src/
├── types/              # TypeScript 类型定义
│   ├── display.ts      # 显示相关类型
│   ├── interaction.ts  # 交互相关类型
│   ├── ai.ts           # AI 相关类型
│   ├── data.ts         # 数据模型类型
│   ├── navigation.ts   # 导航类型
│   └── settings.ts     # 设置类型
├── services/           # 业务逻辑服务层
│   ├── DisplayPanel.ts       # 显示面板服务
│   ├── LayoutManager.ts      # 布局管理器
│   ├── SmartTaskZone.ts      # 智能任务区服务
│   ├── StatusBar.ts          # 状态栏服务
│   ├── InteractionManager.ts # 多模态交互管理器
│   ├── AIAssistant.ts        # AI 语音助手
│   ├── TaskCenter.ts         # 任务中心
│   ├── NavigationEngine.ts   # 导航引擎
│   ├── NotificationCenter.ts # 通知中心
│   ├── PhoneRelay.ts         # 手机信息流转
│   ├── IoTControl.ts         # IoT 设备控制
│   ├── VehicleLink.ts        # 车机互联
│   ├── WatchLink.ts          # 手表互联
│   ├── ThirdPartyControl.ts  # 三方应用控制
│   ├── ARNavigation.ts       # AR 导航
│   ├── CameraModule.ts       # 相机模块
│   ├── MusicPlayer.ts        # 音乐播放
│   ├── Translator.ts         # 实时翻译
│   ├── Teleprompter.ts       # 提词器
│   ├── HealthMonitor.ts      # 健康监测
│   ├── MessagingModule.ts    # 消息通话
│   └── SettingsPanel.ts      # 设置面板
├── components/         # React UI 组件
│   ├── layout/         # 屏幕布局组件（三分区）
│   ├── smart-task/     # 智能任务区组件
│   ├── status-bar/     # 状态栏组件
│   ├── interaction/    # 交互模拟器组件
│   ├── launcher/       # 主界面组件
│   ├── notification/   # 通知中心组件
│   ├── ai/             # AI 助手组件
│   ├── ar-nav/         # AR 导航组件
│   ├── camera/         # 相机组件
│   ├── music/          # 音乐播放组件
│   ├── translator/     # 翻译组件
│   ├── teleprompter/   # 提词器组件
│   ├── health/         # 健康监测组件
│   ├── messaging/      # 消息通话组件
│   ├── settings/       # 设置面板组件
│   ├── phone-relay/    # 手机信息流转卡片组件
│   └── demo/           # Demo 控制面板
├── design-spec/        # 系统交互设计规范
│   ├── visual-language.ts    # 视觉设计语言
│   ├── animation-spec.ts     # 动效规范
│   ├── gesture-mapping.ts    # 手势映射表
│   ├── layout-spec.ts        # 布局规范
│   ├── navigation-flow.ts    # 导航流程
│   └── feasibility-report.ts # 技术可行性分析
├── hooks/              # 自定义 React Hooks
├── utils/              # 工具函数
├── App.tsx             # 应用主入口
├── App.css             # 应用样式
├── main.tsx            # Vite 入口
└── index.css           # 全局样式
```

## License

Private - 内部预研项目
