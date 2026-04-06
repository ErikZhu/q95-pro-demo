# 实施计划：Q95 Pro 智能眼镜系统交互预研

## 概述

基于 React + Three.js 技术栈，构建 Q95 Pro 智能眼镜系统交互的可视化 Demo。采用 TypeScript 实现所有核心模块接口，从底层数据模型和布局系统开始，逐步构建交互管理、AI 助手、跨设备任务中心、手机信息流转等功能模块，最终整合为可在 PC/手机浏览器运行的交互式 Demo。

## 任务

- [x] 1. 项目初始化与核心类型定义
  - [x] 1.1 初始化 React + TypeScript 项目，配置 Three.js 依赖
    - 使用 Vite 创建 React + TypeScript 项目
    - 安装 Three.js、@react-three/fiber、@react-three/drei 等依赖
    - 配置 ESLint、Prettier 和基础项目结构（src/types、src/components、src/services、src/hooks、src/utils）
    - _需求: 22.5_

  - [x] 1.2 定义核心类型和接口
    - 创建 `src/types/display.ts`：定义 DisplaySpec、Rect、ScreenZone 等显示相关类型
    - 创建 `src/types/interaction.ts`：定义 InputSource、InputEvent、ProcessedAction、PriorityRule 等交互类型
    - 创建 `src/types/ai.ts`：定义 AIStatus、Intent、AssistantResponse、TaskResult、TaskStatus 等 AI 相关类型
    - 创建 `src/types/data.ts`：定义 DeviceStatus、TaskSummary、InfoCard、Notification、RelayInfoType、CardTemplate 等数据模型类型
    - 创建 `src/types/navigation.ts`：定义 Location、Route、NavigationState、TurnInstruction 等导航类型
    - 创建 `src/types/settings.ts`：定义 UserSettings 类型
    - _需求: 1.1, 2.1, 3.1, 4.1, 6.1, 8.1, 9.1, 20.1, 21.1_

  - [x]* 1.3 编写核心类型的属性测试
    - **属性 1: DisplaySpec 分辨率约束验证** — 验证 DisplaySpec 的 resolution 始终满足 width≥1280, height≥720
    - **验证需求: 1.1**
    - **属性 2: 优先级规则一致性** — 验证 PriorityRule 数组中不存在相同 source 的冲突优先级
    - **验证需求: 6.2**

- [x] 2. 显示面板与屏幕布局系统
  - [x] 2.1 实现 DisplayPanel 服务
    - 创建 `src/services/DisplayPanel.ts`
    - 实现亮度控制（0-100）、自动亮度调节、刷新率设置
    - 实现环境光模拟逻辑（Demo 中通过滑块模拟环境光变化）
    - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 实现 LayoutManager 服务
    - 创建 `src/services/LayoutManager.ts`
    - 实现三分区（Main_Task_Area、Smart_Task_Zone、Status_Bar）的边界计算
    - 实现分区遮挡检测和浮层注册/移除逻辑
    - 确保三分区之间有清晰的视觉边界
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.3 实现屏幕布局 React 组件
    - 创建 `src/components/layout/ScreenLayout.tsx`：三分区容器组件
    - 创建 `src/components/layout/MainTaskArea.tsx`：中央主任务区组件
    - 创建 `src/components/layout/SmartTaskZone.tsx`：左上角智能任务区占位组件
    - 创建 `src/components/layout/StatusBarArea.tsx`：右上角状态栏占位组件
    - 实现分区常驻可见且不遮挡核心内容的布局逻辑
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x]* 2.4 编写布局系统的属性测试
    - **属性 3: 分区不重叠** — 验证 LayoutManager 返回的三个分区 Rect 互不重叠
    - **验证需求: 2.5, 2.6**
    - **属性 4: 分区覆盖完整性** — 验证三个分区的联合区域在显示区域内
    - **验证需求: 2.1**

- [x] 3. 智能任务区（Smart Task Zone）模块
  - [x] 3.1 实现 AI_Status_Orb 组件
    - 创建 `src/components/smart-task/AIStatusOrb.tsx`
    - 实现四种状态的视觉效果：空闲态（静态柔光）、聆听态（脉冲呼吸）、思考态（旋转动效）、响应态（扩散波纹）
    - 使用 CSS 动画或 Three.js shader 实现动效
    - _需求: 3.1, 3.9_

  - [x] 3.2 实现 SmartTaskZone 服务与紧凑/展开模式
    - 创建 `src/services/SmartTaskZone.ts`：实现状态机（Compact → ConfirmPrompt → Expanded → Compact）
    - 实现注视检测模拟（>1秒触发确认提示）
    - 实现确认手势处理（点头/EMG 捏合双击 → 300ms 内展开）
    - 实现收回逻辑（视线移开>3秒 / 摇头 / 侧滑 → 收回为紧凑模式）
    - _需求: 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.3 实现 SmartTaskZone UI 组件
    - 创建 `src/components/smart-task/SmartTaskZoneView.tsx`
    - 紧凑模式：显示 AI_Status_Orb + 当前任务摘要文本
    - 展开模式：半透明浮层显示任务详情、AI 对话历史和操作选项
    - 实现多任务轮播显示逻辑
    - 实现 AI 交互过程实时反馈显示（如"正在搜索..."）
    - _需求: 3.1, 3.2, 3.3, 3.7, 3.10_

  - [x]* 3.4 编写 SmartTaskZone 状态机的属性测试
    - **属性 5: 状态机转换合法性** — 验证 SmartTaskZone 状态机只能按合法路径转换（Compact→ConfirmPrompt→Expanded→Compact）
    - **验证需求: 3.4, 3.5, 3.6, 3.8**
    - **属性 6: 展开响应时间** — 验证从确认手势到展开完成的时间不超过 300ms
    - **验证需求: 3.5, 3.6**

- [x] 4. 设备状态栏（Status Bar）模块
  - [x] 4.1 实现 StatusBar 服务
    - 创建 `src/services/StatusBar.ts`
    - 实现电量、蓝牙、Wi-Fi、时间的状态管理
    - 实现低电量警告逻辑（<20% 警告色，<5% 全屏警告）
    - 实现连接状态变化的 500ms 内更新逻辑
    - _需求: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 实现 StatusBar UI 组件
    - 创建 `src/components/status-bar/StatusBarView.tsx`
    - 实现电量图标（含警告色变化）、蓝牙图标、Wi-Fi 图标、时间显示
    - 实现展开/收起详细信息面板（具体电量数值、已连接设备名称、信号强度）
    - 确保在不同亮度环境下保持清晰可读
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x]* 4.3 编写 StatusBar 的单元测试
    - 测试低电量阈值逻辑（20% 和 5% 边界）
    - 测试连接状态变化更新
    - _需求: 4.2, 4.3, 4.4_

- [x] 5. 检查点 — 确保布局和状态区域功能正常
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 6. 多模态交互管理器
  - [x] 6.1 实现 InteractionManager 服务
    - 创建 `src/services/InteractionManager.ts`
    - 实现六种交互方式的注册和管理
    - 实现优先级队列和冲突解决逻辑（物理按键 > 语音 > EMG > 侧边触控 > 摄像头手势 > 头部追踪）
    - 实现输入响应延迟控制（<100ms）
    - 实现传感器不可用时的自动切换和通知逻辑
    - _需求: 6.1, 6.2, 6.3, 6.8_

  - [x] 6.2 实现交互输入模拟组件
    - 创建 `src/components/interaction/InteractionSimulator.tsx`
    - 为 Demo 提供模拟六种交互方式的 UI 控件（按钮、滑块等）
    - 实现侧边触控滑动模拟（滚动/切换）、头部追踪模拟（光标移动）、EMG 捏合模拟（确认/选择）、摄像头手势模拟
    - _需求: 6.4, 6.5, 6.6, 6.7_

  - [x]* 6.3 编写交互管理器的属性测试
    - **属性 7: 优先级冲突解决确定性** — 验证同时触发多种输入时，始终选择优先级最高的输入
    - **验证需求: 6.2**
    - **属性 8: 响应延迟约束** — 验证 processInput 的延迟始终 <100ms
    - **验证需求: 6.3**

- [x] 7. Launcher 主界面
  - [x] 7.1 实现 Launcher 组件
    - 创建 `src/components/launcher/Launcher.tsx`
    - 显示时间、日期、电量和连接状态
    - 提供不超过 6 个常用应用快捷入口（AR 导航、相机、音乐、翻译、提词器、健康）
    - 实现应用图标选择后 500ms 内启动对应应用的逻辑
    - 实现加载失败时的错误提示和自动重试
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [x] 7.2 实现全局导航与返回主界面逻辑
    - 创建 `src/services/NavigationEngine.ts`
    - 实现页面跳转路由逻辑
    - 实现从任意应用一键返回主界面的手势/按键支持
    - _需求: 5.5, 21.4_

  - [x]* 7.3 编写 Launcher 的单元测试
    - 测试应用启动延迟
    - 测试加载失败重试逻辑
    - _需求: 5.1, 5.4, 5.6_

- [x] 8. 通知中心模块
  - [x] 8.1 实现 NotificationCenter 服务
    - 创建 `src/services/NotificationCenter.ts`
    - 实现通知添加、时间倒序排列、按应用分组
    - 实现已读标记和自动归档逻辑（>50条归档旧已读通知）
    - _需求: 7.1, 7.2, 7.4, 7.6_

  - [x] 8.2 实现通知中心 UI 组件
    - 创建 `src/components/notification/NotificationCenter.tsx`
    - 实现视野边缘简要通知提示（新通知到达时）
    - 实现向下滑动展开完整通知列表
    - 实现通知详情展示和快捷操作选项
    - _需求: 7.1, 7.3, 7.5_

  - [x]* 8.3 编写通知中心的属性测试
    - **属性 9: 通知排序一致性** — 验证 getUnreadNotifications 返回的通知始终按时间倒序排列
    - **验证需求: 7.2**
    - **属性 10: 自动归档阈值** — 验证通知数量超过 50 条时自动归档较早的已读通知
    - **验证需求: 7.6**

- [x] 9. 检查点 — 确保交互管理、Launcher 和通知中心功能正常
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 10. AI 语音助手模块
  - [x] 10.1 实现 AIAssistant 服务
    - 创建 `src/services/AIAssistant.ts`
    - 实现唤醒词检测模拟（500ms 内激活）
    - 实现语音输入处理和响应生成模拟（2秒内返回）
    - 实现自然语言理解模拟（Intent 解析和路由）
    - 实现低置信度确认请求逻辑
    - 实现 5 秒无输入自动退出逻辑
    - _需求: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7_

  - [x] 10.2 实现 AI 助手交互界面
    - 创建 `src/components/ai/AIAssistantView.tsx`
    - 实现语音助手激活时的交互界面（显示在视野中）
    - 集成 AI_Status_Orb 状态变化
    - 实现语音输入可视化和响应结果展示
    - _需求: 8.4_

  - [x]* 10.3 编写 AI 助手的单元测试
    - 测试唤醒激活延迟
    - 测试超时自动退出
    - 测试低置信度确认流程
    - _需求: 8.1, 8.6, 8.7_

- [x] 11. AI 任务中心与跨设备控制
  - [x] 11.1 实现 TaskCenter 服务
    - 创建 `src/services/TaskCenter.ts`
    - 实现 Intent 路由逻辑（local/phone/iot/vehicle/watch/third_party）
    - 实现复合任务拆解和依次执行逻辑
    - 实现设备可达性检查和离线提示
    - 实现任务状态在 Smart_Task_Zone 中的实时更新
    - _需求: 9.1, 9.2, 9.10, 9.11, 9.12_

  - [x] 11.2 实现 IoT_Control、Vehicle_Link、Watch_Link 服务
    - 创建 `src/services/IoTControl.ts`：实现智能家居状态查询、场景自动化、设备动作模拟
    - 创建 `src/services/VehicleLink.ts`：实现车辆状态查询、车机协同、车辆控制模拟
    - 创建 `src/services/WatchLink.ts`：实现手表数据查询和动作执行模拟
    - _需求: 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [x] 11.3 实现 Third_Party_Control 服务
    - 创建 `src/services/ThirdPartyControl.ts`
    - 实现社交、娱乐、办公类应用的语音控制模拟
    - 实现标准化 Voice Intent API 接口定义
    - 实现目标应用自动识别和路由
    - 实现未安装/不支持应用的提示和替代方案建议
    - _需求: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x]* 11.4 编写任务中心的属性测试
    - **属性 11: 复合任务拆解完整性** — 验证复合指令拆解后的子任务数量与原始指令中的动作数量一致
    - **验证需求: 9.12**
    - **属性 12: 设备不可达处理** — 验证目标设备离线时始终返回失败结果和替代建议
    - **验证需求: 9.11**

- [x] 12. 检查点 — 确保 AI 助手和任务中心功能正常
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 13. 手机信息流转模块
  - [x] 13.1 实现 PhoneRelay 服务
    - 创建 `src/services/PhoneRelay.ts`
    - 实现流转信息接收和 InfoCard 生成逻辑
    - 实现 8 种信息类型的差异化 CardTemplate 映射（delivery_progress、calendar_event、call_info、flight_board、ride_status、movie_ticket、wechat_message、music_player）
    - 实现基于权重公式的智能排序算法（priority×0.4 + timeSensitivity×0.35 + recency×0.25）
    - 实现信息类型过滤（用户自定义允许流转的类型）
    - 实现蓝牙断开时的提示和最近同步信息保留
    - _需求: 20.1, 20.2, 20.3, 20.9, 20.10, 20.12_

  - [x] 13.2 实现 InfoCard UI 组件
    - 创建 `src/components/phone-relay/InfoCardView.tsx`：通用卡片容器
    - 创建 `src/components/phone-relay/DeliveryCard.tsx`：外卖配送进度卡片
    - 创建 `src/components/phone-relay/FlightCard.tsx`：机票航班信息卡片
    - 创建 `src/components/phone-relay/RideCard.tsx`：打车订单卡片
    - 创建 `src/components/phone-relay/MusicCard.tsx`：音乐播放卡片（含快捷播放控制）
    - 创建 `src/components/phone-relay/CalendarCard.tsx`：日程提醒卡片
    - 创建 `src/components/phone-relay/WechatCard.tsx`：微信消息卡片（含发送者头像、昵称、摘要）
    - 实现侧边触控滑动浏览多条卡片
    - 实现卡片选择展开详情
    - _需求: 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.11_

  - [x]* 13.3 编写信息流转的属性测试
    - **属性 13: 排序算法稳定性** — 验证相同输入的 InfoCard 排序结果始终一致
    - **验证需求: 20.12**
    - **属性 14: 信息类型过滤正确性** — 验证设置过滤后只有允许的类型出现在 getInfoCards 结果中
    - **验证需求: 20.9**

- [x] 14. 应用功能模块实现
  - [x] 14.1 实现 AR 导航模块
    - 创建 `src/services/ARNavigation.ts`：路线规划、导航状态管理、偏离重新规划、GPS 信号丢失处理
    - 创建 `src/components/ar-nav/ARNavigationView.tsx`：方向箭头、距离、预计到达时间的 AR 叠加显示
    - 确保导航信息不遮挡主要视线
    - _需求: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 14.2 实现拍照与录像模块
    - 创建 `src/services/CameraModule.ts`：拍照（300ms 内完成）、录像状态管理、存储空间监控
    - 创建 `src/components/camera/CameraView.tsx`：录制状态指示、录制时长、存储剩余空间显示
    - _需求: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 14.3 实现音乐播放模块
    - 创建 `src/services/MusicPlayer.ts`：播放控制、侧边触控双击切换、来电自动暂停
    - 创建 `src/components/music/MusicPlayerView.tsx`：当前曲目信息显示
    - _需求: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 14.4 实现实时翻译模块
    - 创建 `src/services/Translator.ts`：翻译处理（1秒内显示）、多语言支持、离线模式切换
    - 创建 `src/components/translator/TranslatorView.tsx`：视野下方翻译结果显示
    - _需求: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 14.5 实现提词器模块
    - 创建 `src/services/Teleprompter.ts`：文本加载、自动滚动速度控制、暂停/恢复
    - 创建 `src/components/teleprompter/TeleprompterView.tsx`：半透明区域文本显示
    - _需求: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 14.6 实现健康与运动数据模块
    - 创建 `src/services/HealthMonitor.ts`：健康数据管理、运动类型识别、心率异常检测
    - 创建 `src/components/health/HealthMonitorView.tsx`：运动数据实时显示
    - _需求: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 14.7 实现消息与通话模块
    - 创建 `src/services/MessagingModule.ts`：消息接收、语音回复、来电处理、蓝牙断开提示
    - 创建 `src/components/messaging/MessagingView.tsx`：消息预览、来电界面、通话状态显示
    - _需求: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [x]* 14.8 编写应用模块的单元测试
    - 测试 AR 导航路线规划和偏离重新规划
    - 测试相机拍照延迟和存储空间检测
    - 测试音乐播放来电自动暂停逻辑
    - _需求: 11.4, 12.1, 12.5, 13.5_

- [x] 15. 检查点 — 确保所有应用模块功能正常
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 16. 设置面板与应用商店桥接
  - [x] 16.1 实现设置面板
    - 创建 `src/services/SettingsPanel.ts`：设置项管理、即时应用更改
    - 创建 `src/components/settings/SettingsPanel.tsx`：设置分类列表（显示、声音、连接、交互、隐私、系统）、设置项调节界面
    - _需求: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [x] 16.2 实现应用商店桥接模块
    - 创建 `src/services/AppStoreBridge.ts`：应用浏览、安装推送、已安装列表管理、存储空间检查
    - 创建 `src/components/app-store/AppStoreBridgeView.tsx`：已安装应用列表、安装通知
    - _需求: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 17. 系统交互设计规范输出
  - [x] 17.1 创建视觉设计规范文档
    - 创建 `src/design-spec/visual-language.ts`：定义颜色体系、字体规范、图标风格常量
    - 创建 `src/design-spec/animation-spec.ts`：定义动效规范（过渡时间、缓动曲线、状态动画参数）
    - _需求: 21.1_

  - [x] 17.2 创建交互规范文档
    - 创建 `src/design-spec/gesture-mapping.ts`：定义每种交互方式的手势映射表
    - 创建 `src/design-spec/layout-spec.ts`：定义安全显示区域、信息层级、视觉焦点区域规范
    - 创建 `src/design-spec/navigation-flow.ts`：定义功能模块间的导航流程和页面跳转逻辑
    - _需求: 21.2, 21.3, 21.4_

  - [x] 17.3 创建技术可行性分析
    - 创建 `src/design-spec/feasibility-report.ts`：定义各功能模块的实现难度评级、风险评估和技术依赖
    - _需求: 21.6_

- [x] 18. 可视化 Demo 整合
  - [x] 18.1 实现 Demo 主入口和场景切换
    - 创建 `src/App.tsx`：Demo 主入口，集成所有模块
    - 实现双目显示视觉效果模拟（Three.js 双视口渲染）
    - 实现场景切换逻辑：Launcher → 通知中心 → AR 导航 → 相机 → 音乐 → AI 助手等核心流程
    - _需求: 22.1, 22.3_

  - [x] 18.2 实现多模态交互模拟面板
    - 创建 `src/components/demo/DemoControlPanel.tsx`
    - 提供模拟六种交互方式的操作面板（键盘映射、鼠标模拟触控、按钮模拟手势等）
    - 实现接近真实体验的动效和响应速度
    - _需求: 22.2, 22.4_

  - [x] 18.3 编写部署说明文档
    - 创建 `README.md`：项目说明、安装步骤、启动命令
    - 确保支持在 PC 和手机浏览器上运行
    - 配置 Vite 构建优化
    - _需求: 22.5_

  - [x]* 18.4 编写 Demo 集成测试
    - 测试场景切换流程完整性
    - 测试多模态交互模拟的响应
    - _需求: 22.1, 22.4_

- [x] 19. 最终检查点 — 确保完整 Demo 可运行
  - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 交付
- 每个任务均引用了对应的需求编号，确保可追溯性
- 检查点任务用于阶段性验证，确保增量开发的稳定性
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
- Demo 中所有硬件交互均为模拟实现，通过 UI 控件触发
