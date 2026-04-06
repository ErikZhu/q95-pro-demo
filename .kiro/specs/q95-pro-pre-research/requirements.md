# Q95 Pro 智能眼镜系统交互预研 — 需求文档

## 简介

Q95 Pro 是一款面向消费者日常佩戴使用的彩色双目显示智能眼镜。基于 Android + Vela 魔改操作系统，支持多模态交互（侧边触控、语音、EMG 手势、摄像头手势、头部追踪、物理按键）。本预研项目旨在完成系统交互设计规范、UI 原型、技术可行性分析、技术方案，并最终生成可视化 Demo。

## 术语表

- **Q95_Pro**: 带彩色双目显示屏的智能眼镜硬件设备
- **System_UI**: Q95 Pro 的系统级交互界面，包含 Launcher、通知中心、设置面板等
- **Launcher**: 主界面，用户开机后看到的默认界面，提供应用入口和快捷操作
- **Notification_Center**: 通知中心，聚合展示来自各应用和系统的通知消息
- **AI_Assistant**: AI 语音助手模块，处理语音输入并提供智能响应
- **AR_Navigation**: 增强现实导航模块，在眼镜视野中叠加导航指引
- **Camera_Module**: 拍照和录像功能模块
- **Music_Player**: 音乐播放控制模块
- **Translator**: 实时翻译模块，支持语音和文字翻译
- **Teleprompter**: 提词器模块，在视野中显示预设文本
- **Health_Monitor**: 健康和运动数据监测模块
- **Messaging_Module**: 消息和通话功能模块
- **Settings_Panel**: 系统设置面板
- **App_Store_Bridge**: 应用商店桥接模块，通过配对手机的应用商店下载安装应用
- **Side_Touchpad**: 眼镜腿侧边触控板，支持滑动和点击操作
- **EMG_Band**: EMG 手环或手表，通过肌电信号识别手势
- **Camera_Gesture**: 通过眼镜前置摄像头识别的手势交互
- **Head_Tracking**: 头部追踪交互，通过头部运动控制光标或选择
- **Display_Panel**: 彩色双目显示屏，当前主流方案包括 Micro-OLED（分辨率约 1920×1080 per eye，亮度 >3000nits）和 MicroLED（分辨率约 1280×720 per eye，亮度 >5000nits），以及 LCoS 和光波导方案
- **Interaction_Manager**: 交互管理器，统一管理和调度多种输入方式的优先级和冲突
- **Phone_Relay**: 手机信息流转模块，负责从配对手机接收并在眼镜端展示各类生活服务信息
- **Info_Card**: 信息卡片，手机流转信息在眼镜端的标准化展示单元，支持不同类型信息的差异化布局
- **Main_Task_Area**: 主任务区，屏幕中央的主要内容显示区域，用于展示当前活跃应用或功能的核心内容
- **Smart_Task_Zone**: 智能任务区，位于屏幕左上角的常驻区域，包含语音助手状态球、当前任务状态、AI 交互反馈等信息，支持注视触发展开
- **Status_Bar**: 设备状态栏，位于屏幕右上角的常驻区域，显示电量、蓝牙连接、Wi-Fi、时间等设备状态信息
- **AI_Status_Orb**: 语音助手状态球，Smart_Task_Zone 中的核心视觉元素，通过颜色和动效变化反映 AI 助手的当前状态（空闲、聆听、思考、响应）
- **Gaze_Detection**: 注视检测，通过眼动追踪或头部朝向判断用户是否正在注视某个 UI 区域
- **Task_Center**: 任务中心，AI 语音助手激活后的核心能力模块，支持通过语音指令控制眼镜硬件、配对手机、IoT 设备、车机和手表等
- **IoT_Control**: IoT 设备控制模块，通过 AI 语音助手查询智能家居设备状态、触发场景自动化和执行设备动作
- **Vehicle_Link**: 车机互联模块，通过 AI 语音助手查询车辆状态、协同操作和执行车辆控制动作
- **Watch_Link**: 手表互联模块，通过 AI 语音助手与配对智能手表进行状态查询和动作执行
- **Third_Party_Control**: 三方应用控制模块，AI 语音助手对社交、娱乐、办公等三方应用的语音控制能力

## 需求

### 需求 1：显示屏选型与规格

**用户故事：** 作为产品设计师，我希望确定 Q95 Pro 的彩色双目显示屏选型方案，以便为交互设计提供硬件约束参数。

#### 验收标准

1. THE System_UI SHALL 支持彩色双目显示，单眼分辨率不低于 1280×720
2. THE Display_Panel SHALL 提供不低于 3000nits 的峰值亮度以满足户外使用场景
3. THE Display_Panel SHALL 支持不低于 60Hz 的刷新率以保证交互流畅性
4. THE Display_Panel SHALL 视场角（FOV）不低于 40 度以提供足够的信息展示区域
5. WHEN 环境光线变化时, THE Display_Panel SHALL 自动调节显示亮度以适应当前环境


### 需求 2：屏幕布局分区

**用户故事：** 作为用户，我希望眼镜屏幕有清晰的功能分区布局，以便在不同区域快速获取不同类型的信息。

#### 验收标准

1. THE System_UI SHALL 将显示区域划分为三个常驻分区：Main_Task_Area（中央主任务区）、Smart_Task_Zone（左上角智能任务区）、Status_Bar（右上角设备状态栏）
2. THE Main_Task_Area SHALL 占据屏幕中央主要区域，用于显示当前活跃应用或功能的核心内容
3. THE Smart_Task_Zone SHALL 固定显示在屏幕左上角，默认以紧凑模式展示 AI_Status_Orb 和当前任务摘要
4. THE Status_Bar SHALL 固定显示在屏幕右上角，持续展示电量、蓝牙连接状态、Wi-Fi 状态和当前时间
5. WHILE 用户在任意应用中操作时, THE Smart_Task_Zone 和 Status_Bar SHALL 保持常驻可见且不遮挡 Main_Task_Area 的核心内容
6. THE System_UI SHALL 确保三个分区之间有清晰的视觉边界，避免信息混淆

### 需求 3：智能任务区（Smart Task Zone）

**用户故事：** 作为用户，我希望在屏幕左上角随时看到 AI 助手状态和当前任务进展，并能通过自然交互方式展开查看详情，以便高效掌握任务动态。

#### 验收标准

1. THE Smart_Task_Zone SHALL 在紧凑模式下显示 AI_Status_Orb，通过颜色和动效反映 AI 助手当前状态（空闲态为静态柔光、聆听态为脉冲呼吸、思考态为旋转动效、响应态为扩散波纹）
2. THE Smart_Task_Zone SHALL 在紧凑模式下显示当前活跃任务的简要状态文本（如"导航中 · 还有 500m"、"外卖 · 骑手已取餐"）
3. WHILE AI_Assistant 正在处理用户请求时, THE Smart_Task_Zone SHALL 实时显示 AI 交互过程的反馈信息（如"正在搜索..."、"已找到 3 个结果"）
4. WHEN Gaze_Detection 检测到用户注视 Smart_Task_Zone 超过 1 秒时, THE Smart_Task_Zone SHALL 显示"是否展开当前任务？"的确认提示
5. WHEN 确认提示显示后用户通过点头确认时, THE Smart_Task_Zone SHALL 在 300ms 内展开为详细任务视图
6. WHEN 确认提示显示后用户通过 EMG_Band 手指捏合双击确认时, THE Smart_Task_Zone SHALL 在 300ms 内展开为详细任务视图
7. WHILE Smart_Task_Zone 处于展开模式时, THE Smart_Task_Zone SHALL 在 Main_Task_Area 上方以半透明浮层形式显示完整的任务详情、AI 对话历史和操作选项
8. WHEN 用户将视线移开 Smart_Task_Zone 超过 3 秒或通过摇头/侧滑手势时, THE Smart_Task_Zone SHALL 自动收回为紧凑模式
9. IF 当前无活跃任务, THEN THE Smart_Task_Zone SHALL 仅显示 AI_Status_Orb 的空闲状态
10. THE Smart_Task_Zone SHALL 支持同时追踪多个任务，并在紧凑模式下轮播显示各任务的摘要状态

### 需求 4：设备状态栏（Status Bar）

**用户故事：** 作为用户，我希望在屏幕右上角随时看到设备的关键状态信息，以便及时了解电量、连接等情况。

#### 验收标准

1. THE Status_Bar SHALL 持续显示以下设备状态信息：电池电量百分比及图标、蓝牙连接状态、Wi-Fi 连接状态、当前时间
2. WHEN 电池电量低于 20% 时, THE Status_Bar SHALL 将电量图标变为警告色（红色/橙色）并显示低电量提示
3. WHEN 电池电量低于 5% 时, THE Status_Bar SHALL 在 Main_Task_Area 中弹出全屏低电量警告
4. WHEN 蓝牙或 Wi-Fi 连接状态发生变化时, THE Status_Bar SHALL 在 500ms 内更新对应的状态图标
5. THE Status_Bar SHALL 支持用户通过注视或点击展开查看更详细的设备信息（如具体电量数值、已连接设备名称、信号强度）
6. THE Status_Bar SHALL 在不同亮度环境下保持清晰可读

### 需求 5：主界面 / Launcher

**用户故事：** 作为用户，我希望开机后看到极简的主界面，视野保持清爽，只在右上角显示关键状态信息，需要时才展开功能入口。

#### 验收标准

1. WHEN Q95_Pro 开机完成后, THE Launcher SHALL 在 3 秒内完成加载并显示主界面
2. THE Launcher SHALL 默认仅在右上角紧凑显示时间、电池电量、蓝牙/Wi-Fi 连接状态和 AI 任务活跃状态
3. THE Launcher SHALL 将不超过 6 个常用应用快捷入口收纳在右上角的一个收纳图标（如九宫格图标）中，默认不展开
4. WHEN Gaze_Detection 检测到用户注视收纳图标超过 0.8 秒时, THE Launcher SHALL 展开显示应用快捷入口网格
5. WHEN 用户视线移开应用网格超过 2 秒时, THE Launcher SHALL 自动收起应用快捷入口
6. WHEN 用户通过任意交互方式选择应用图标时, THE Launcher SHALL 在 500ms 内启动对应应用
7. WHILE 用户处于其他应用中, THE Launcher SHALL 支持通过预设手势或按键一键返回主界面
8. IF Launcher 加载失败, THEN THE System_UI SHALL 显示错误提示并自动重试加载
9. THE Launcher 主界面默认视野应保持清爽，中央区域不放置任何 UI 元素，仅右上角显示状态信息和收纳图标

### 需求 6：多模态交互管理

**用户故事：** 作为用户，我希望能通过多种方式与眼镜交互，以便在不同场景下选择最方便的操作方式。

#### 验收标准

1. THE Interaction_Manager SHALL 支持以下六种交互方式：侧边触控、语音输入、EMG 手势、摄像头手势、头部追踪、物理按键
2. WHEN 多种交互方式同时触发时, THE Interaction_Manager SHALL 按照预定义的优先级规则处理输入冲突
3. THE Interaction_Manager SHALL 将交互输入的响应延迟控制在 100ms 以内
4. WHEN 用户通过 Side_Touchpad 进行滑动操作时, THE System_UI SHALL 执行对应的滚动或切换动作
5. WHEN 用户通过 Head_Tracking 移动头部时, THE System_UI SHALL 移动光标或焦点到对应位置
6. WHEN 用户通过 EMG_Band 执行捏合手势时, THE System_UI SHALL 将该手势识别为确认/选择操作
7. WHEN 用户通过 Camera_Gesture 执行手势时, THE System_UI SHALL 在 200ms 内识别并响应该手势
8. IF 某种交互方式的传感器不可用, THEN THE Interaction_Manager SHALL 自动切换到可用的交互方式并通知用户

### 需求 7：通知中心

**用户故事：** 作为用户，我希望在眼镜上查看和管理通知消息，以便不错过重要信息。

#### 验收标准

1. WHEN 新通知到达时, THE Notification_Center SHALL 在视野边缘显示简要通知提示
2. THE Notification_Center SHALL 按时间倒序排列所有未读通知
3. WHEN 用户通过向下滑动 Side_Touchpad 时, THE Notification_Center SHALL 展开完整通知列表
4. THE Notification_Center SHALL 支持按应用类别分组显示通知
5. WHEN 用户选择某条通知时, THE Notification_Center SHALL 展示通知详情并提供快捷操作选项
6. IF 通知数量超过 50 条, THEN THE Notification_Center SHALL 自动归档较早的已读通知


### 需求 8：AI 语音助手

**用户故事：** 作为用户，我希望通过语音与 AI 助手交互，以便解放双手完成查询和操作。

#### 验收标准

1. WHEN 用户说出唤醒词时, THE AI_Assistant SHALL 在 500ms 内激活并显示聆听状态
2. WHEN 用户发出语音指令时, THE AI_Assistant SHALL 在 2 秒内返回响应结果
3. THE AI_Assistant SHALL 支持自然语言理解，能处理模糊和上下文相关的指令
4. WHILE AI_Assistant 处于激活状态, THE System_UI SHALL 在视野中显示语音助手交互界面
5. THE AI_Assistant SHALL 支持控制系统功能（如打开应用、调节音量、设置提醒等）
6. IF 语音识别置信度低于阈值, THEN THE AI_Assistant SHALL 请求用户确认或重新输入
7. WHEN 用户连续 5 秒无语音输入时, THE AI_Assistant SHALL 自动退出激活状态

### 需求 9：AI 任务中心

**用户故事：** 作为用户，我希望通过语音助手统一控制眼镜硬件、手机、IoT 设备、车和手表，以便用一句话完成跨设备操作。

#### 验收标准

1. WHEN AI_Assistant 激活后, THE Task_Center SHALL 支持通过语音指令控制眼镜本机硬件，包括：声音（音量调节、静音）、Camera（拍照、录像）、显示（亮度、夜间模式）、耳机侧（音频输出切换）、电池（省电模式）、Wi-Fi（开关、连接）
2. THE Task_Center SHALL 支持通过语音指令控制配对手机，包括：媒体播放控制、日程查询与创建、待办事项管理、拨打电话等
3. WHEN 用户通过语音发出 IoT 控制指令时, THE IoT_Control SHALL 支持查询智能家居设备状态（如"空调当前温度多少"）
4. THE IoT_Control SHALL 支持触发场景自动化（如"打开回家模式"）
5. THE IoT_Control SHALL 支持执行单个设备动作（如"关闭客厅灯"）
6. WHEN 用户通过语音发出车辆相关指令时, THE Vehicle_Link SHALL 支持查询车辆状态（如"车还有多少电量"、"车停在哪里"）
7. THE Vehicle_Link SHALL 支持车机协同操作（如"把导航发送到车机"）
8. THE Vehicle_Link SHALL 支持执行车辆控制动作（如"打开车窗"、"预热空调"）
9. WHEN 用户通过语音发出手表相关指令时, THE Watch_Link SHALL 支持查询手表数据（如"今天走了多少步"）和执行手表动作（如"开始运动记录"）
10. THE Task_Center SHALL 在 Smart_Task_Zone 中实时显示任务执行状态和结果反馈
11. IF 目标设备不可达或离线, THEN THE Task_Center SHALL 提示用户设备不可用并建议替代操作
12. THE Task_Center SHALL 支持多步骤复合指令（如"帮我打开空调并设置到 26 度"），自动拆解为子任务依次执行

### 需求 10：三方应用语音控制

**用户故事：** 作为用户，我希望通过语音助手控制眼镜上的三方应用，以便无需手动操作即可使用社交、娱乐和办公类应用。

#### 验收标准

1. THE Third_Party_Control SHALL 支持通过语音指令控制社交类应用（如"给张三发微信说我到了"、"查看最新朋友圈"）
2. THE Third_Party_Control SHALL 支持通过语音指令控制娱乐类应用（如"播放周杰伦的歌"、"打开抖音"）
3. THE Third_Party_Control SHALL 支持通过语音指令控制办公类应用（如"打开今天的会议日程"、"记录一条备忘"）
4. THE Third_Party_Control SHALL 提供标准化的语音控制接口（Voice Intent API），供三方应用接入语音控制能力
5. WHEN 用户发出三方应用控制指令时, THE AI_Assistant SHALL 自动识别目标应用并路由到对应的应用处理
6. IF 目标三方应用未安装或不支持语音控制, THEN THE Third_Party_Control SHALL 提示用户并建议替代方案
7. THE Third_Party_Control SHALL 在 Smart_Task_Zone 中显示三方应用的执行状态和响应结果

### 需求 11：AR 导航

**用户故事：** 作为用户，我希望在眼镜视野中看到导航指引，以便在步行或骑行时获得方向引导。

#### 验收标准

1. WHEN 用户启动导航并输入目的地时, THE AR_Navigation SHALL 在 3 秒内规划路线并开始显示导航指引
2. THE AR_Navigation SHALL 在用户视野中叠加显示方向箭头、距离和预计到达时间
3. WHILE 导航进行中, THE AR_Navigation SHALL 根据用户位置实时更新导航指引
4. WHEN 用户偏离规划路线时, THE AR_Navigation SHALL 在 2 秒内重新规划路线
5. THE AR_Navigation SHALL 将导航信息显示在视野中不遮挡主要视线的区域
6. IF GPS 信号丢失, THEN THE AR_Navigation SHALL 显示信号丢失提示并使用最近已知位置继续导航

### 需求 12：拍照与录像

**用户故事：** 作为用户，我希望通过眼镜快速拍照和录像，以便记录第一视角的精彩瞬间。

#### 验收标准

1. WHEN 用户通过物理按键或手势触发拍照时, THE Camera_Module SHALL 在 300ms 内完成拍照
2. WHEN 用户触发录像时, THE Camera_Module SHALL 立即开始录制并在视野中显示录制状态指示
3. THE Camera_Module SHALL 支持不低于 1080p 分辨率的照片和视频拍摄
4. WHILE 录像进行中, THE Camera_Module SHALL 在视野中持续显示录制时长和存储剩余空间
5. WHEN 存储空间不足 500MB 时, THE Camera_Module SHALL 提醒用户清理空间
6. THE Camera_Module SHALL 将拍摄内容自动同步到配对手机的相册

### 需求 13：音乐播放

**用户故事：** 作为用户，我希望通过眼镜控制音乐播放，以便在日常佩戴时享受音乐。

#### 验收标准

1. THE Music_Player SHALL 支持播放、暂停、上一曲、下一曲和音量调节操作
2. WHEN 用户通过 Side_Touchpad 双击时, THE Music_Player SHALL 切换播放/暂停状态
3. WHILE 音乐播放中, THE System_UI SHALL 在 Launcher 上显示当前播放曲目信息
4. THE Music_Player SHALL 支持与配对手机上的音乐应用联动控制
5. WHEN 用户接听电话时, THE Music_Player SHALL 自动暂停播放并在通话结束后恢复


### 需求 14：实时翻译

**用户故事：** 作为用户，我希望在与外语使用者交流时获得实时翻译，以便跨越语言障碍。

#### 验收标准

1. WHEN 用户启动翻译模式并检测到外语语音时, THE Translator SHALL 在 1 秒内在视野中显示翻译文本
2. THE Translator SHALL 支持不少于 10 种主流语言的互译
3. THE Translator SHALL 支持语音输入和摄像头文字识别两种翻译输入方式
4. WHILE 翻译模式激活时, THE Translator SHALL 在视野下方区域持续显示翻译结果
5. IF 翻译服务不可用（如无网络）, THEN THE Translator SHALL 切换到离线翻译模式并提示用户翻译质量可能下降

### 需求 15：提词器

**用户故事：** 作为用户，我希望在演讲或会议时在视野中看到提词内容，以便流畅地进行表达。

#### 验收标准

1. WHEN 用户启动提词器并加载文本时, THE Teleprompter SHALL 在视野中以可配置的字体大小显示文本
2. THE Teleprompter SHALL 支持自动滚动，滚动速度可由用户通过 Side_Touchpad 调节
3. WHILE 提词器运行中, THE Teleprompter SHALL 将文本显示在视野中半透明区域，保证用户能同时看到现实环境
4. THE Teleprompter SHALL 支持从配对手机导入文本内容
5. WHEN 用户通过手势暂停时, THE Teleprompter SHALL 立即停止滚动并保持当前位置

### 需求 16：健康与运动数据

**用户故事：** 作为用户，我希望通过眼镜查看健康和运动数据，以便随时了解自身状态。

#### 验收标准

1. THE Health_Monitor SHALL 支持显示步数、心率、卡路里消耗等基础健康数据
2. WHEN 用户开始运动时, THE Health_Monitor SHALL 自动识别运动类型并开始记录运动数据
3. WHILE 运动记录中, THE Health_Monitor SHALL 在视野中实时显示运动时长、距离和心率
4. THE Health_Monitor SHALL 与配对手机或手环的健康数据同步
5. IF 检测到心率异常（过高或过低）, THEN THE Health_Monitor SHALL 立即向用户发出警告提示

### 需求 17：消息与通话

**用户故事：** 作为用户，我希望通过眼镜接收消息和接听电话，以便在不掏出手机的情况下保持联络。

#### 验收标准

1. WHEN 收到新消息时, THE Messaging_Module SHALL 在视野中显示消息预览（发送者和摘要）
2. THE Messaging_Module SHALL 支持通过语音输入回复消息
3. WHEN 来电时, THE Messaging_Module SHALL 在视野中显示来电信息并提供接听/拒绝选项
4. WHILE 通话进行中, THE Messaging_Module SHALL 在视野中显示通话时长和对方信息
5. THE Messaging_Module SHALL 通过眼镜内置麦克风和扬声器完成通话
6. IF 蓝牙连接断开, THEN THE Messaging_Module SHALL 提示用户重新连接配对手机


### 需求 18：设置面板

**用户故事：** 作为用户，我希望在眼镜上调整系统设置，以便根据个人偏好定制使用体验。

#### 验收标准

1. THE Settings_Panel SHALL 提供以下设置分类：显示、声音、连接、交互、隐私、系统
2. WHEN 用户进入设置面板时, THE Settings_Panel SHALL 以列表形式展示所有设置分类
3. THE Settings_Panel SHALL 支持调节显示亮度、字体大小、通知偏好和交互方式优先级
4. THE Settings_Panel SHALL 支持管理蓝牙配对设备和 Wi-Fi 连接
5. WHEN 用户修改设置项时, THE Settings_Panel SHALL 立即应用更改并提供视觉反馈确认

### 需求 19：应用商店桥接

**用户故事：** 作为用户，我希望通过配对手机为眼镜安装应用，以便扩展眼镜的功能。

#### 验收标准

1. THE App_Store_Bridge SHALL 通过配对手机的应用商店浏览和下载眼镜兼容应用
2. WHEN 用户在手机端选择安装应用时, THE App_Store_Bridge SHALL 自动将应用推送到 Q95_Pro 并完成安装
3. THE App_Store_Bridge SHALL 在眼镜端显示已安装应用列表和可用更新
4. WHEN 应用安装完成时, THE App_Store_Bridge SHALL 在眼镜端通知用户并将应用添加到 Launcher
5. IF 眼镜存储空间不足, THEN THE App_Store_Bridge SHALL 提示用户清理空间后再安装

### 需求 20：手机信息流转显示

**用户故事：** 作为用户，我希望在眼镜上实时查看手机流转过来的各类生活服务信息（外卖、日程、电话、机票、打车、电影票、微信消息、音乐），以便无需掏出手机即可掌握重要动态。

#### 验收标准

1. THE Phone_Relay SHALL 支持接收并显示以下类型的手机流转信息：外卖订单状态、日程提醒、来电信息、机票行程、打车订单、电影票信息、微信消息、音乐播放状态
2. WHEN 配对手机上产生新的流转信息时, THE Phone_Relay SHALL 在 2 秒内将信息推送到 Q95_Pro 并以 Info_Card 形式显示
3. THE Phone_Relay SHALL 根据信息类型使用差异化的 Info_Card 布局模板（如外卖显示配送进度和预计送达时间，机票显示航班号、登机口和起飞时间，打车显示司机位置和预计到达时间）
4. WHEN 用户收到外卖配送状态更新时, THE Phone_Relay SHALL 实时更新 Info_Card 中的配送进度信息
5. WHEN 用户有即将到来的日程事件时, THE Phone_Relay SHALL 在事件开始前按用户设定的提前时间显示日程提醒卡片
6. WHEN 用户收到微信新消息时, THE Phone_Relay SHALL 在视野中显示消息预览（发送者头像、昵称和消息摘要）
7. THE Phone_Relay SHALL 支持用户通过 Side_Touchpad 滑动浏览多条流转信息卡片
8. WHEN 用户选择某条 Info_Card 时, THE Phone_Relay SHALL 展开显示该信息的完整详情
9. THE Phone_Relay SHALL 支持用户自定义哪些类型的信息允许流转到眼镜端显示
10. IF 手机与眼镜的蓝牙连接断开, THEN THE Phone_Relay SHALL 显示连接断开提示并保留最近一次同步的信息
11. WHEN 音乐播放状态从手机流转时, THE Phone_Relay SHALL 在 Info_Card 中显示当前曲目、歌手和播放进度，并支持快捷播放控制
12. THE Phone_Relay SHALL 按信息的时效性和优先级对 Info_Card 进行智能排序（如即将出发的机票优先于已完成的外卖订单）

### 需求 21：系统交互设计规范输出

**用户故事：** 作为设计师，我希望预研输出完整的系统交互设计规范文档，以便指导后续的详细设计和开发。

#### 验收标准

1. THE System_UI SHALL 定义统一的视觉设计语言，包括颜色体系、字体规范、图标风格和动效规范
2. THE System_UI SHALL 定义每种交互方式的手势映射表和操作规范
3. THE System_UI SHALL 定义界面布局规范，包括安全显示区域、信息层级和视觉焦点区域
4. THE System_UI SHALL 定义各功能模块之间的导航流程和页面跳转逻辑
5. THE System_UI SHALL 提供所有核心界面的 UI 原型设计
6. THE System_UI SHALL 输出技术可行性分析报告，评估各功能模块的实现难度和风险

### 需求 22：可视化 Demo

**用户故事：** 作为产品经理，我希望预研阶段输出可交互的可视化 Demo，以便向团队和利益相关者展示产品概念。

#### 验收标准

1. THE System_UI SHALL 提供可运行的交互式 Demo，覆盖 Launcher、通知中心和至少 3 个核心功能模块的交互流程
2. THE System_UI SHALL 在 Demo 中模拟多模态交互方式的操作效果
3. THE System_UI SHALL 在 Demo 中展示双目显示的视觉效果模拟
4. WHEN 用户在 Demo 中执行交互操作时, THE System_UI SHALL 以接近真实体验的动效和响应速度进行反馈
5. THE System_UI SHALL 提供 Demo 的部署说明文档，支持在 PC 或手机浏览器上运行演示
