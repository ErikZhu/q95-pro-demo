# 需求文档：Wearable Watch Agentic OS（穿戴手表/手环 Agentic 操作系统）

## 简介

本项目基于 MiClaw Agentic OS 产品架构，为手表/手环设备设计一套完整的 Agentic OS 适配方案。核心理念是：**不是在手表上装一个 AI 助手，是让手表本身变聪明**。用户感受不是"我有一个助手 APP"，而是"我的手表变聪明了"——助手消失了，手表升级了，这才是对的。

### 行业背景与竞品分析

可穿戴设备正从"被动传感器"升级为"主动 AI 智能体"。当前行业痛点包括：数据孤岛（传感器数据无法跨应用流通）、交互割裂（通知只能看不能做）、智能缺位（缺乏端侧推理能力）、场景断层（设备间无法协同完成任务）。手表手环具备"持续佩戴+抬腕可见+传感器密集"的天然优势，具备成为身体侧 Agent 终端的物理基础。

| 竞品 | 端侧AI推理 | 跨App意图执行 | 传感器Agent闭环 | 手机协同Agent | 三方Agent开放 |
|---|---|---|---|---|---|
| 苹果 | ✅ | ✅ | ❌ | ✅ | ❌ |
| 华为 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 小米 | ❌ | ❌ | ❌ | ✅ | ❌ |

共同缺口：没有一家将"传感器数据→Agent意图推理→跨设备任务执行"做成系统性、可开放的 Agent OS。本方案的核心差异化在于构建一套完整的 **Agent OS Harness 七层架构**（感知→上下文→意图→调度→执行→表现→开放），实现从感知到理解到决策到执行的完整闭环。

### 硬件基础

本方案基于小米 Watch 5（EMG 手势控制 + Wear OS 6 + Gemini）和 Watch S5（四光源传感器 + 小米汽车深度联动 + eSIM 独立通信 + 融合设备中心）的最新硬件能力进行 Agentic OS 改造适配。支持设备范围：手机端小米手机 HyperOS 3+，手表端 Q61 及后续全部机型（Agent OS 1.0），手环端 Band 10 及后续全部机型（Agent OS 1.0）。

这些硬件能力不只是功能特性，而是 Agent 感知世界和与用户交互的新通道：EMG 传感器让 Agent 读懂肌肉信号实现免触控交互，四光源传感器让 Health_Assistant 获得临床级健康数据，蓝牙车钥匙和融合设备中心让手表成为人车家全生态的控制中枢，eSIM 让 Agent 在无手机场景下仍能访问云端智能。

### 设计原则

手表作为同一 Agentic OS 的另一个"触点"，与手机共享同一个 Session。手表端的核心竞争力在于：出现在传统 APP 到不了的地方——表盘 AOD、Complication、振动通知、负一屏 Quick_Card。手表屏幕小、输入成本高，因此以下设计原则在手表端比手机端更为关键：

1. **永远是助理先开口**：基于日程、消息、位置、健康数据、运动状态，主动把该做的事摆出来。用户的主要动作是"确认"和"选择"（一点、一转、一说），不是"输入"和"提问"
2. **在你所在的地方出现，处理信息不用跳转**：信息和操作就在当前界面完成（表盘、通知卡片、Quick_Card）。"打开 APP"是最后选项
3. **敏感操作必须确认，但确认要极轻**：展示预览，用户一点确认、一转表冠、一句话即可。不弹对话框，不跳页面
4. **不预定义逻辑，由用户自由表达**：大模型负责理解需求、拆解任务、生成内容；系统负责把内容渲染到合适的触点上
5. **3秒原则**：用户抬腕3秒内完成信息消费并作出决策，单一信息全屏展示、列表最多3条、长文本标题+1句摘要推手机

系统以 Session → Topic → Fragment → Message 四层对话流结构为基础，通过主 Agent + 子 Agent 体系实现智能化的穿戴体验。底层由 Agent OS Harness 七层架构（感知层→上下文层→意图层→调度层→执行层→表现层→开放层）提供系统性支撑。Agent 只输出结构化内容（文本 + 操作选项 + 紧急程度），渲染层根据每个触点的约束自动适配展示。面向用户呈现为"助手"，不暴露 Agent 概念，强调有温度、有灵魂的交互体验。

## 术语表

- **Watch_OS**: 运行在手表/手环上的 Agentic 操作系统，让手表本身变聪明而非在手表上装一个 AI 助手
- **Session**: 唯一且永久的对话历史层，Session = OS Agent，是用户和设备之间的永久智能层。手表的表盘、通知、快捷卡片都是 Session 的不同渲染面
- **Topic**: 多个语义相关 Fragment 的聚合，由 LLM 自动划分，生命周期为 active → closed
- **Fragment**: 一个对话回合（用户发消息到 AI 回复完毕），产出物包括文档、Agent、记忆、操作
- **Message**: 最小内容单元，角色包括 user_input、system_prompt、assistant、thinking、tool_call、tool
- **Main_Agent**: 主 Agent，系统唯一，等同于主对话流，是 Session 背后的实体，最高指挥
- **Sub_Agent**: 子 Agent，分为厂商预置和用户创建两类，面向用户呈现为"助手"
- **Temp_Agent**: 临时 Agent，用后即销毁
- **Skill**: Agent 的能力单元，是 MCP/Tools 等原子化能力的 SOP 说明书
- **Tool**: 最底层的原始能力接口（API、传感器读取、设备控制等）
- **Persona_System**: Agent 人格体系，包含 SOUL.md、IDENTITY.md、AGENTS.md、TOOLS.md、HEARTBEAT.md、USER.md、MEMORY.md 等人格文件
- **Watch_Face_Engine**: 表盘渲染引擎，作为 Session 的主渲染面之一，对应手机端"锁屏"触点
- **Complication**: 表盘复杂功能组件，作为 Sub_Agent 状态的渲染面，对应手机端"桌面小组件"触点
- **Status_Bar**: 表盘顶部常驻状态条，对应手机端"灵动岛"触点，追踪正在进行的事
- **Notification_Card**: 通知卡片，作为 Agent 产出物的呈现载体，对应手机端"通知"触点，配合振动实现打断机制
- **Quick_Card**: 快捷卡片，手表负一屏中 Agent 主动推送的信息卡片，对应手机端"负一屏"触点
- **AOD_Layer**: 息屏常亮显示层，对应手机端"息屏(AOD)"触点，最轻的一瞥，抬腕看到一行字就知道有没有重要的事
- **IM_Interface**: IM 对话界面，对应手机端"APP"触点，深度交互的最后手段
- **Structured_Output**: Agent 结构化输出，包含文本、操作选项和紧急程度，Agent 不关心触点长什么样
- **Render_Layer**: 渲染层，根据触点约束自动适配 Agent 的 Structured_Output 展示方式
- **Customized_Render**: 定制层渲染，高频场景定制设计（消息摘要、确认操作、日程提醒、今日概览、通知聚合、任务状态、IoT场景执行、健康告警、车辆安全提醒、门锁摄像头画面、一键体检结果、运动姿态分析）
- **Generic_Render**: 通用层渲染，Markdown + 交互组件（按钮、选择项、倒计时、状态标签），手表端用语音替代文本输入
- **Fallback_Render**: 兜底层渲染，跳到手机端 APP 处理
- **Health_Assistant**: 厂商预置健康子 Agent，负责健康数据采集、分析和主动洞察
- **Sport_Assistant**: 厂商预置运动子 Agent，负责 150+ 运动模式追踪、专业姿态分析、训练负荷管理和运动数据分析
- **Communication_Assistant**: 厂商预置通讯子 Agent，负责消息、来电和快捷回复
- **IoT_Assistant**: 厂商预置 IoT 子 Agent，负责智能家居设备发现与控制，与 Car_Assistant 协同管理 Wrist_Control_Center
- **Schedule_Assistant**: 厂商预置日程出行子 Agent，负责日程提醒、出行规划
- **Car_Assistant**: 厂商预置车辆子 Agent，负责 SU7/YU7 等小米汽车的远程控制、状态查询、主动安全提醒和蓝牙车钥匙
- **Phone_Bridge**: 手机配对桥接模块，负责跨设备 Session 同步和产出物归档
- **Sensor_Manager**: 传感器管理模块，为 Agent 提供上下文输入数据
- **Power_Manager**: 电源管理模块，负责功耗优化
- **Interaction_Engine**: 交互引擎，处理语音、手势、表冠旋转等输入方式
- **Skill_Center**: 技能中心，面向 Agent 设计，Agent 找技能一键学会
- **Agent_Store**: Agent 商店，面向用户，给用户加助理
- **Watch_Device**: 运行 Watch_OS 的手表/手环硬件设备
- **Companion_App**: 手机端伴侣应用（MiClaw APP）
- **Demo_Simulator**: 浏览器端演示模拟器
- **Atomic_Component**: 原子化组件，APP 能力拆解后的最小可复用 UI 单元，可被 Agent 在任意触点组合渲染
- **Tool_Registry**: Tool 注册表，传统 APP 功能（天气、计时器、闹钟等）作为 Tool 注册到 Main_Agent 的能力清单
- **Finished_Information**: 成品信息，Agent 基于原始数据加工后直接可消费的结构化信息，区别于需要用户二次处理的中间信息
- **Wrist_Raise_Layer**: 抬腕语音唤醒层，手表端的核心交互面，对应手机端悬浮态 MiClaw，每次唤醒为干净的新层
- **Delivery_Rule**: Agent 交付规则，定义成品信息按性质匹配到不同触点的路由策略
- **Memory_System**: 记忆系统，给 AI 用的，让它更懂你。来源包括用户对话、传感器数据、行为习惯等
- **Document_System**: 文档系统，给用户用的，对话是过程，文档是结果。AI 自动按类型和时间组织
- **Agent_Manager**: Agent 管理模块，手表端精简视图，按状态分组管理运行中/等待触发/已暂停的 Agent
- **EMG_Sensor**: 肌电图传感器，读取肌肉电信号实现免触控手势识别，与 PPG（光电容积脉搏波）和 IMU（惯性测量单元）三传感器融合，是 Agent 感知用户意图的新通道
- **EMG_Gesture**: EMG 手势，基于肌电信号识别的手势操作集合，包括捏两下、搓两下、打响指、甩手腕、转手腕等，作为 Agentic OS 的核心免触控交互方式
- **Wrist_Control_Center**: 融合设备中心（手腕控制中心），手表作为人车家全生态的统一控制中枢，由 IoT_Assistant 和 Car_Assistant 协同管理，Main_Agent 统一调度
- **eSIM_Module**: eSIM 独立通信模块，支持手表脱离手机独立接打电话和数据连接，使 Agent 在无手机场景下仍可访问云端 LLM
- **Dual_Chip_Architecture**: 双芯片架构（如 Snapdragon W5 Gen 1 + BES2800 低功耗协处理器），主芯片处理 Agent 推理和复杂交互，协处理器负责传感器持续采集和 AOD 渲染，实现性能与功耗的平衡
- **Four_Light_Sensor**: 四光源四光电二极管（4-light 4-PD）传感器阵列，心率监测准确率达 98.4%（接近临床级别），为 Health_Assistant 提供高精度生理数据输入
- **Dual_Freq_GNSS**: 双频五星 GNSS 定位系统，支持北斗、GPS、GLONASS、Galileo、QZSS 五大卫星系统，定位精度提升 33%，为 Sport_Assistant 和 Schedule_Assistant 提供高精度位置上下文
- **BT_Car_Key**: 蓝牙/NFC 车钥匙功能，手表靠近车辆自动解锁，作为 Car_Assistant 的物理交互通道
- **Agent_OS_Harness**: Agent OS 七层架构底座，定义了 Agent 能感知什么、能做什么、怎么做、做完怎么反馈，包含感知层(Sensing)→上下文层(Context)→意图层(Intent)→调度层(Orchestration)→执行层(Execution)→表现层(Presentation)→开放层(Platform)
- **Sensing_Layer**: 感知层，Agent OS Harness 第一层，负责生理传感器、运动传感器、环境传感器和系统状态的统一采集与事件分发
- **SensingBus**: 感知层事件总线，提供 subscribe(sensor, trigger, priority, callback) 接口，支持最大并发订阅≤16，采集到分发延迟≤50ms
- **Context_Layer**: 上下文层，Agent OS Harness 第二层，融合多维传感器数据推断用户当前活动状态、位置语义、生理状态、社交状态和设备状态
- **Intent_Layer**: 意图层，Agent OS Harness 第三层，负责端侧 LLM 意图理解、置信度路由和多轮上下文管理
- **On_Device_LLM**: 端侧大语言模型，参数量≤1B，首 token 延迟≤300ms，支持离线意图理解
- **Orchestration_Layer**: 调度层，Agent OS Harness 第四层，负责 Agent 优先级调度、冲突裁决、跨设备路由和资源配额管理
- **Execution_Layer**: 执行层，Agent OS Harness 第五层，提供 Action 能力库（通讯/时间/出行/支付/媒体/家居/Agent间），保证幂等与回滚
- **Presentation_Layer**: 表现层，Agent OS Harness 第六层，定义胶囊(Capsule)/卡片(Card)/全屏页(Page)/覆层(Overlay)/语音(Voice)五种展示形态，Agent 声明内容类型由表现层负责渲染
- **Platform_Layer**: 开放层，Agent OS Harness 第七层，定义三方 Agent 的接入规范、沙箱隔离、API 分级审核
- **Health_Intervention_Agent**: 健康主动干预 Agent，基于压力、久坐、睡眠债务、运动后心率恢复等指标触发四级干预（L1轻提醒→L2建议→L3主动介入→L4紧急）
- **Sport_Coach_Agent**: 运动教练 Agent，提供实时配速/心率干预、运动后自动总结、个性化训练计划和新用户冷启动
- **Commute_Agent**: 通勤出行 Agent，覆盖出行前预判、途中震动导航、到达后场景交接和异常处理全链路
- **Payment_Agent**: 支付消费 Agent，提供场景感知预加载、消费后自动记账、每日消费摘要
- **Smart_Home_Agent**: 智能家居 Agent，基于生理状态驱动场景联动（入睡→关灯、体温高→调空调）和到离家感知

---

## 需求

### 需求 1：Session 架构与对话流（核心架构）

**用户故事：** 作为一名手表用户，我希望手表与手机共享同一个永久 Session，以便我在任何设备上都能无缝延续与 AI 助手的交互。

#### 验收标准

1. THE Watch_OS SHALL 维护一个唯一且永久的 Session 实例，该 Session 与配对手机上的 Session 为同一实体
2. THE Session SHALL 包含四层结构：Session → Topic → Fragment → Message，每层数据结构在手表端与手机端保持一致
3. WHEN 用户在手表上发起一次对话时，THE Watch_OS SHALL 创建一个 Fragment（包含用户输入到 AI 回复完毕的完整回合），并将该 Fragment 同步至手机端 Session
4. THE Main_Agent SHALL 基于 Topic 内的 Fragment 历史自动维护对话上下文，在手表端回复时引用同一 Topic 下的历史信息
5. WHEN 一个 Topic 的语义主题发生变化时，THE Main_Agent SHALL 自动创建新的 Topic，将后续 Fragment 归入新 Topic
6. WHILE 手机处于已连接状态时，THE Phone_Bridge SHALL 在 Fragment 产生后 3 秒内完成手表与手机之间的 Session 数据双向同步
7. IF 手机断开连接，THEN THE Watch_OS SHALL 在本地缓存新产生的 Fragment，并在重新连接后按时间顺序同步至手机端 Session
8. THE Watch_OS SHALL 将表盘（含 AOD_Layer）、Status_Bar、通知列表、负一屏 Quick_Card 和 IM_Interface 作为 Session 的五种渲染面，每种渲染面从同一 Session 数据中提取并呈现相关信息

---

### 需求 2：主 Agent 手表端呈现与对话产出物

**用户故事：** 作为一名手表用户，我希望在手表上通过简化的 IM 界面与主 Agent 对话，对话产出物自动归档到对应模块，以便我用最自然的方式获取帮助且不丢失任何有价值的产出。

#### 验收标准

1. THE Watch_OS SHALL 提供 IM_Interface 作为主 Agent 的深度交互入口（最后手段而非第一入口），支持语音输入和预设快捷回复
2. WHEN 用户抬腕或点击表盘上的 Main_Agent 入口时，THE Watch_OS SHALL 在 500 毫秒内打开 IM_Interface，显示最近 Topic 的最新 3 条 Fragment 摘要
3. THE Main_Agent SHALL 在 IM_Interface 中以气泡形式渲染 Message，用户消息靠右、助手回复靠左，每条 Message 显示角色标识和时间戳
4. WHEN 用户通过语音输入一条消息时，THE Watch_OS SHALL 将语音转为文本后作为 user_input 类型的 Message 发送给 Main_Agent，并在 2 秒内显示 thinking 状态指示
5. THE Main_Agent SHALL 面向用户呈现为"助手"名称和头像，不在界面中暴露"Agent"、"Session"、"Topic"等技术概念
6. WHEN Main_Agent 的回复包含可操作内容（如确认日程、控制设备）时，THE Watch_OS SHALL 在回复气泡下方渲染可点击的操作按钮，用户一点确认即可执行
7. THE Watch_OS SHALL 支持通过表冠旋转滚动 IM 对话历史，每次旋转步进滚动一个 Fragment 的高度
8. IF Main_Agent 在 5 秒内未返回回复，THEN THE Watch_OS SHALL 显示"正在思考中"的加载动画，并允许用户通过侧滑返回表盘
9. WHEN 对话产生文档类产出物（如会议纪要、行程单）时，THE Watch_OS SHALL 通过 Phone_Bridge 将文档自动同步到手机端 Document_System
10. WHEN 对话产生 Agent 类产出物（如"帮我盯着机票"）时，THE Watch_OS SHALL 自动创建对应 Agent 并同步到手机端 Agent_Manager
11. WHEN 对话中提取到记忆类信息（如"我对花生过敏"）时，THE Watch_OS SHALL 自动写入 Memory_System 并通过 Phone_Bridge 同步到手机端
12. WHEN 对话产生操作类产出物（如发送消息、控制设备）时，THE Watch_OS SHALL 记录操作日志并通过 Phone_Bridge 同步到手机端

---

### 需求 3：子 Agent 体系（厂商预置）

**用户故事：** 作为一名手表用户，我希望手表预装多个专业助手来帮我管理健康、运动、通讯和智能家居，以便我无需手动配置就能获得专业化服务。

#### 验收标准

1. THE Watch_OS SHALL 预置以下厂商子 Agent：Health_Assistant、Sport_Assistant、Communication_Assistant、IoT_Assistant、Schedule_Assistant、Car_Assistant，每个子 Agent 在手表上以精简卡片形式呈现
2. THE Health_Assistant SHALL 持续采集心率、血氧、睡眠、压力等传感器数据，并将数据作为 Main_Agent 的上下文输入
3. THE Sport_Assistant SHALL 支持 150 种以上运动模式的追踪，在运动过程中实时显示配速、距离、心率和卡路里
4. THE Communication_Assistant SHALL 接收配对手机的通知和来电，在 2 秒内推送到手表，并提供语音快捷回复能力
5. THE IoT_Assistant SHALL 通过 Phone_Bridge 中转控制指令，支持灯光、空调、窗帘等智能家居设备的状态查询和控制
6. THE Schedule_Assistant SHALL 在日程事件开始前通过 Notification_Card 主动提醒用户，并提供导航、准备建议等上下文信息
7. WHEN 用户在 IM_Interface 中使用 @ 符号指定某个子 Agent 时，THE Main_Agent SHALL 将该 Fragment 路由给指定的子 Agent 处理
8. WHEN 子 Agent 完成任务执行后，THE Sub_Agent SHALL 将执行结果和产生的记忆同步给 Main_Agent
9. WHILE 子 Agent 无法独立完成用户请求时，THE Sub_Agent SHALL 将任务上抛给 Main_Agent 进行协调处理
10. THE Watch_OS SHALL 为每个厂商预置子 Agent 提供能力声明，Main_Agent 根据能力声明进行任务调配

---

### 需求 4：子 Agent 体系（用户创建与临时 Agent）

**用户故事：** 作为一名手表用户，我希望能在手表上轻量管理自己创建的助手，以便我获得个性化的持续服务。

#### 验收标准

1. THE Watch_OS SHALL 支持从手机端同步用户创建的子 Agent 到手表，在手表上以列表形式展示已同步的用户子 Agent
2. WHEN 用户在手表 IM_Interface 描述一个持续性任务且无现有 Agent 可承接时，THE Main_Agent SHALL 引导用户创建新的子 Agent，并通过语音确认名称和职责
3. THE Watch_OS SHALL 为用户创建的子 Agent 提供生命周期管理，支持在手表上查看状态、暂停和删除操作
4. WHEN 用户请求执行一次性任务时，THE Main_Agent SHALL 直接处理该任务，不产出新的 Agent
5. WHEN 用户请求执行持续性任务时，THE Main_Agent SHALL 优先检查已有子 Agent 的能力声明，将任务并入能力匹配的子 Agent
6. THE Watch_OS SHALL 支持临时 Agent（Temp_Agent），在任务完成后自动销毁，不占用手表本地存储
7. IF 用户创建的子 Agent 超过 30 天未被调用，THEN THE Watch_OS SHALL 通过 Notification_Card 提示用户是否保留或清理该 Agent
8. THE Watch_OS SHALL 限制手表端同时活跃的用户子 Agent 数量不超过 10 个，以保障系统性能

---

### 需求 5：Agent 人格体系与跨设备共享

**用户故事：** 作为一名手表用户，我希望手表上的助手与手机上的助手拥有相同的性格和记忆，以便我在不同设备上获得一致的交互体验。

#### 验收标准

1. THE Watch_OS SHALL 与配对手机共享同一套 Persona_System，包括 SOUL.md（性格/价值观）、IDENTITY.md（名字/头像）、USER.md（用户认知）和 MEMORY.md（长期记忆）
2. WHILE 手机处于已连接状态时，THE Phone_Bridge SHALL 在人格文件发生变更后 10 秒内将变更同步到手表端
3. THE Main_Agent SHALL 根据 SOUL.md 中定义的性格特征调整在手表端的回复风格，保持有温度、有灵魂的交互体验
4. THE Main_Agent SHALL 根据 HEARTBEAT.md 中的主动性设定，在手表端适时主动发起对话（如早安问候、运动提醒、天气预警），体现"永远是助理先开口"原则
5. WHEN Main_Agent 从手表端的交互中观察到用户行为规律时，THE Main_Agent SHALL 将观察结果写入 MEMORY.md 并同步至手机端
6. THE Watch_OS SHALL 在手表端缓存 Persona_System 的本地副本，在手机断连时仍能维持一致的人格表现
7. IF Main_Agent 的人格成长机制触发重大变更（如价值观调整），THEN THE Watch_OS SHALL 通过 IM_Interface 请求用户确认，用户可选择接受或回滚
8. THE Watch_OS SHALL 确保 Persona_System 的安全边界不可被用户对话覆盖，核心价值观和行为底线始终生效

---

### 需求 6：Skill 体系手表端适配与预装技能

**用户故事：** 作为一名手表用户，我希望助手能通过技能完成各种任务，预装技能适合手表交互特点，不适合手表的技能自动转发到手机端执行。

#### 验收标准

1. THE Watch_OS SHALL 支持三层 Skill 架构：Tool（原始能力）→ Skill（串联判断的 SOP）→ Agent（决策调用），手表端 Agent 通过 Skill 调用底层 Tool
2. THE Watch_OS SHALL 支持通过语音触发 Skill 执行，用户对 Main_Agent 说出意图后，Main_Agent 自动匹配并调用对应 Skill
3. THE Watch_OS SHALL 支持通过快捷手势触发预设 Skill，包括抬腕（唤醒 Main_Agent）、握拳（紧急操作）、手腕翻转（静音/切歌）
4. THE Watch_OS SHALL 支持通过表冠旋转在 Skill 执行结果之间切换浏览，长按表冠确认执行
5. WHEN Agent 需要调用一个手表端不具备的 Tool 时，THE Watch_OS SHALL 通过 Phone_Bridge 将 Tool 调用请求转发至手机端执行，并将结果返回手表端 Agent
6. THE Watch_OS SHALL 从 Skill_Center 同步 Agent 已学会的 Skill 列表，手表端 Agent 可直接使用已学会的 Skill
7. THE Watch_OS SHALL 对 Skill 执行权限分三级管理：无需确认（低风险，如查询天气）、需用户确认（中风险，如发送消息，展示预览一点确认）、需密码验证（高风险，如支付操作）
8. IF 多个 Skill 声明了相同能力且发生冲突，THEN THE Watch_OS SHALL 按专业度排序选择最匹配的 Skill 执行
9. THE Watch_OS SHALL 预装以下手表适配技能：翻译（语音实时翻译，手表端通过麦克风采集语音实时翻译并在屏幕显示）、摘要（通知/消息摘要，将多条通知聚合为一句话）、IoT 场景（语音或 Quick_Card 一键触发预设场景）、行程规划（结合日程和位置提供出行建议）、饮食记录（手表端拍照识别食物并记录热量）
10. WHEN 用户请求执行不适合手表端的技能（写作、会议纪要、周报生成等需要大屏幕编辑的技能）时，THE Watch_OS SHALL 通过 Phone_Bridge 将任务转发到手机端 Companion_App 执行，并在手表端通过 Notification_Card 通知用户"已转至手机端处理"

---

### 需求 7：Session 渲染面 — 表盘与 AOD

**用户故事：** 作为一名手表用户，我希望表盘能智能展示 Agent 的状态和推荐信息，AOD 模式下抬腕一瞥就知道有没有重要的事，以便我获取最相关的信息。

#### 验收标准

1. THE Watch_Face_Engine SHALL 将表盘作为 Session 的主渲染面（对应手机端"锁屏"触点），从 Session 数据中提取当前最相关的信息进行展示，是用户每天的第一个界面，呈现整理好的简报而不是一堆未读通知
2. THE Watch_Face_Engine SHALL 支持 Complication 组件作为子 Agent 状态的渲染面（对应手机端"桌面小组件"触点），每个 Complication 可绑定一个子 Agent 的关键输出（如 Health_Assistant 的心率、Sport_Assistant 的步数）
3. WHEN Main_Agent 基于用户当前时间、日程、天气和运动状态生成推荐时，THE Watch_Face_Engine SHALL 自动调整表盘样式或 Complication 内容以呈现推荐信息
4. THE Watch_Face_Engine SHALL 支持加载和渲染至少 20 种预置表盘样式，每种样式支持至少 4 个 Complication 槽位
5. WHEN 用户在表盘界面长按屏幕时，THE Watch_Face_Engine SHALL 进入表盘编辑模式，允许用户配置 Complication 绑定的子 Agent 和数据源
6. THE Watch_Face_Engine SHALL 在 500 毫秒内完成表盘切换和渲染
7. THE Watch_Face_Engine SHALL 支持 AOD_Layer 常亮显示模式（对应手机端"息屏 AOD"触点），AOD 模式下以低功耗方式渲染简化版表盘，仅保留时间和最高优先级 Complication，实现"最轻的一瞥，抬腕看到一行字就知道有没有重要的事"
8. WHILE Watch_Device 处于 AOD_Layer 模式时，THE Power_Manager SHALL 将表盘渲染帧率限制在 1 帧/秒以内
9. THE Watch_Face_Engine SHALL 支持 Agent 按 Delivery_Rule 将"需要立即知道"的成品信息推送到 AOD_Layer 和 Complication，信息精简到一行可读完且支持点击展开操作
10. THE Watch_Face_Engine SHALL 支持 Status_Bar 作为表盘顶部常驻状态条（对应手机端"灵动岛"触点），追踪正在进行的事（如运动计时、导航剩余距离、音乐播放状态），盯着当前最重要的那一件事

---

### 需求 8：Session 渲染面 — 通知卡片

**用户故事：** 作为一名手表用户，我希望通知卡片能智能呈现 Agent 的产出物和重要信息，只有值得打断我的事才走通知，以便我快速了解需要关注的事项。

#### 验收标准

1. THE Watch_OS SHALL 将通知列表作为 Session 的渲染面之一（对应手机端"通知"触点），每条 Notification_Card 对应一个 Fragment 的产出物或子 Agent 的主动推送，配合振动实现打断机制——只有值得打断用户的事才走通知
2. WHEN 子 Agent 产生新的产出物（如 Health_Assistant 检测到心率异常、Schedule_Assistant 提醒日程）时，THE Watch_OS SHALL 在 2 秒内生成对应的 Notification_Card 并通过振动和屏幕亮起提醒用户
3. THE Notification_Card SHALL 显示来源子 Agent 的名称和图标、通知标题、摘要内容和时间戳
4. WHEN 用户点击一条 Notification_Card 时，THE Watch_OS SHALL 展开该卡片的详细内容，并提供与来源子 Agent 继续对话的入口，信息和操作就在当前界面完成
5. THE Watch_OS SHALL 按时效性和优先级对 Notification_Card 进行智能排序，Main_Agent 产出的通知优先级最高
6. WHEN 用户在手表上清除一条 Notification_Card 时，THE Watch_OS SHALL 同步清除手机端 Session 中对应的通知状态
7. WHILE Watch_Device 处于勿扰模式时，THE Watch_OS SHALL 静默接收 Notification_Card，不触发振动和屏幕亮起，仅在通知列表中记录
8. THE Watch_OS SHALL 支持 Notification_Card 内嵌快捷操作按钮（如回复消息、确认日程、控制设备），用户无需打开 IM_Interface 即可完成操作——确认要极轻，一点即可
9. THE Watch_OS SHALL 确保 Notification_Card 展示的内容为 Agent 产出的 Finished_Information（成品信息），而非原始通知的简单转发；Agent 对原始通知进行语义提取、分类和摘要后再呈现
10. WHEN 多条来自同一来源的原始通知到达时，THE Watch_OS SHALL 由 Main_Agent 将其合并为一条智能摘要 Notification_Card，避免通知轰炸
11. THE Watch_OS SHALL 支持通知智能分类，Main_Agent 将通知按类型（社交、交易、出行、快递、系统）自动归类，用户可按分类筛选浏览

---

### 需求 9：Session 渲染面 — 快捷卡片（负一屏）

**用户故事：** 作为一名手表用户，我希望在负一屏看到 Agent 主动推送的智能信息卡片，以便我无需主动询问就能获取当前最需要的信息。

#### 验收标准

1. THE Watch_OS SHALL 提供负一屏作为 Session 的渲染面之一（对应手机端"负一屏"触点），通过表盘右滑进入，展示 Quick_Card 列表，是用户主动查看的全景面板
2. THE Main_Agent SHALL 基于用户当前上下文（时间、位置、日程、健康状态、天气）自动生成和排序 Quick_Card 内容，体现"永远是助理先开口"原则
3. WHEN 用户在早晨首次抬腕时，THE Main_Agent SHALL 在负一屏顶部推送当日概览 Quick_Card，包含天气、日程摘要和健康状态
4. THE Quick_Card SHALL 支持多种模板类型：天气卡片、日程卡片、运动数据卡片、音乐控制卡片、导航卡片、IoT 场景卡片
5. WHEN 子 Agent 产生持续性信息（如正在进行的运动、正在播放的音乐、正在导航的路线）时，THE Watch_OS SHALL 在负一屏顶部固定显示对应的 Quick_Card
6. THE Watch_OS SHALL 支持通过表冠旋转在 Quick_Card 列表中滚动浏览
7. WHEN 用户点击一个 Quick_Card 时，THE Watch_OS SHALL 在当前界面展开详细内容并提供操作按钮，信息和操作就在当前界面完成，跳转到子 Agent 详细界面或 IM_Interface 为最后选项
8. THE Main_Agent SHALL 根据用户的使用习惯和反馈动态调整 Quick_Card 的推送策略和排序权重
9. THE Main_Agent SHALL 自动管理 Quick_Card 的出现和消失：当上下文条件满足时自动生成对应 Quick_Card，当条件不再满足时自动移除，用户无需手动管理
10. THE Quick_Card SHALL 展示 Agent 基于用户当前上下文生成的 Finished_Information（成品信息），而非简单的数据罗列；每张卡片包含 Agent 的判断、建议或可执行操作
11. WHEN 用户对某张 Quick_Card 执行"不再显示"操作时，THE Main_Agent SHALL 记录用户偏好并调整后续同类 Quick_Card 的推送策略

---

### 需求 10：手表端交互形态（含 EMG 手势控制体系）

**用户故事：** 作为一名手表用户，我希望通过语音、EMG 肌电手势、触控手势和表冠等多种方式与助手交互，以便我在不同场景下都能便捷操作，主要动作是"确认"和"选择"而非"输入"和"提问"。EMG 手势让我无需触摸屏幕，通过肌肉信号直接与 Agent 交互。

#### 验收标准

1. THE Interaction_Engine SHALL 支持语音作为手表端的主要交互方式，用户通过语音输入自然语言与 Main_Agent 对话
2. WHEN 用户长按表冠或说出唤醒词时，THE Interaction_Engine SHALL 在 1 秒内激活语音识别界面并开始录音
3. THE Interaction_Engine SHALL 支持中文和英文语音识别，安静环境下识别准确率达到 95% 以上
4. THE Interaction_Engine SHALL 支持快捷手势触发 Agent 操作：抬腕唤醒（激活 Main_Agent）、手腕翻转（执行预设 Skill，如静音来电）、握拳（触发紧急操作）
5. THE Interaction_Engine SHALL 支持表冠旋转作为列表滚动和数值调节的输入方式，旋转响应延迟不超过 50 毫秒
6. THE Watch_OS SHALL 在 IM_Interface 支持预设快捷回复模板，用户通过点击选择而非打字输入，体现"用户的主要动作是确认和选择"原则
7. WHEN 用户在 IM_Interface 中输入 @ 符号时，THE Watch_OS SHALL 弹出子 Agent 选择列表，用户通过语音或点击选择目标子 Agent
8. THE Interaction_Engine SHALL 支持对话层（CLI）和应用层（GUI）双层交互：对话层为自然语言 + @ 的 IM 交互，应用层为各子 Agent 的专属 GUI 界面
9. WHILE 手机处于已连接状态时，THE Interaction_Engine SHALL 将复杂语音查询转发至手机端或云端处理，并将结果返回手表显示
10. IF Interaction_Engine 无法识别用户语音指令，THEN THE Watch_OS SHALL 显示"未能识别，请重试"提示，并保持语音识别界面激活 5 秒
11. THE Interaction_Engine SHALL 支持 EMG_Sensor（肌电图传感器）作为 Agentic OS 的核心免触控交互通道，通过 EMG + PPG + IMU 三传感器融合实现可靠、低延迟的肌肉信号识别
12. THE Interaction_Engine SHALL 支持以下预设 EMG_Gesture 映射，每个手势在 300 毫秒内完成识别并触发对应操作：
    - 捏两下（Pinch Twice）→ 挂断来电 / 确认当前操作
    - 搓两下（Rub Twice）→ 关闭闹钟 / 清除当前通知
    - 打响指（Snap Fingers）→ 唤醒 Main_Agent 或 Gemini 语音助手
    - 甩手腕（Shake Wrist）→ 执行快捷操作（默认打开手机相机远程控制）
    - 转手腕（Rotate Wrist）→ 执行快捷操作（默认切歌 / 静音）
13. THE Watch_OS SHALL 支持用户自定义 EMG_Gesture 绑定的 Skill 或 Agent 操作，用户可在设置中将任意 EMG 手势映射到指定 Skill、Sub_Agent 唤醒或 IoT 场景触发
14. WHEN 用户执行 EMG_Gesture 时，THE Interaction_Engine SHALL 通过 Wrist_Raise_Layer 或 Notification_Card 提供视觉和触觉反馈，确认手势已被识别和执行
15. THE Interaction_Engine SHALL 支持 EMG_Gesture 的灵敏度校准，用户首次使用时通过引导流程完成个人肌电信号基线校准，提升识别准确率
16. WHILE 用户处于运动状态时，THE Interaction_Engine SHALL 自动调整 EMG_Gesture 的识别阈值，过滤运动产生的肌肉信号干扰，避免误触发
17. THE Interaction_Engine SHALL 将 EMG_Gesture 事件作为 Sensor_Manager 的数据源之一，Agent 可订阅手势事件流，实现基于手势的上下文感知（如检测到用户频繁握拳可能表示紧张，Health_Assistant 可据此提供放松建议）

---

### 需求 11：Agent 协作与任务处理

**用户故事：** 作为一名手表用户，我希望助手们能自动协作完成复杂任务，以便我只需说出需求就能获得完整的服务。

#### 验收标准

1. THE Main_Agent SHALL 根据子 Agent 的能力声明自动将用户请求调配给最合适的子 Agent 处理
2. WHEN 用户请求涉及多个子 Agent 的能力时（如"明天跑步前提醒我吃药"涉及 Schedule_Assistant 和 Health_Assistant），THE Main_Agent SHALL 协调多个子 Agent 协作完成任务
3. THE Watch_OS SHALL 支持子 Agent 之间的互调能力，子 Agent 可通过能力声明发现并调用其他子 Agent 的 Skill
4. WHEN 子 Agent 执行完毕后，THE Sub_Agent SHALL 将执行结果、产生的记忆和状态变更同步给 Main_Agent
5. THE Main_Agent SHALL 在 IM_Interface 中以统一的对话流形式呈现多 Agent 协作的过程和结果，用户无需感知后台的 Agent 调度细节
6. WHEN 一次性任务完成后，THE Main_Agent SHALL 在 IM_Interface 中显示任务完成摘要，不产出新的 Agent
7. WHEN 持续性任务需要新建 Agent 承接时，THE Main_Agent SHALL 通过 IM 对话引导用户确认创建，并说明新 Agent 的职责和预期行为
8. IF 子 Agent 执行任务失败，THEN THE Sub_Agent SHALL 将失败原因上报给 Main_Agent，Main_Agent 向用户提供替代方案或重试选项

---

### 需求 12：跨设备 Session 同步

**用户故事：** 作为一名同时使用手表和手机的用户，我希望两个设备上的操作实时同步，以便我在任一设备上都能看到完整的交互历史。

#### 验收标准

1. THE Phone_Bridge SHALL 确保手表和手机共享同一个 Session 实例，所有 Topic、Fragment 和 Message 数据在两端保持一致
2. WHEN 用户在手表上执行操作（如回复消息、控制设备、确认日程）时，THE Phone_Bridge SHALL 在 3 秒内将操作结果同步到手机端对话流
3. WHEN 用户在手机端创建或修改子 Agent 时，THE Phone_Bridge SHALL 在 10 秒内将变更同步到手表端
4. THE Phone_Bridge SHALL 支持增量同步机制，仅传输自上次同步以来的变更数据，减少蓝牙带宽占用
5. IF 手表与手机之间的蓝牙连接断开，THEN THE Watch_OS SHALL 在状态栏显示断连图标，并将所有本地操作缓存到待同步队列
6. WHEN 蓝牙连接恢复后，THE Phone_Bridge SHALL 自动执行待同步队列中的数据同步，按时间戳顺序合并冲突数据
7. THE Phone_Bridge SHALL 支持 Session 数据的冲突解决策略：同一 Fragment 在两端被修改时，以最后修改时间戳为准
8. THE Watch_OS SHALL 支持与 Android 5.0+ 和 iOS 14.0+ 的手机进行 Session 同步

---

### 需求 13：健康传感器作为 Agent 上下文（四光源传感器升级 + 健康主动干预 Agent）

**用户故事：** 作为一名手表用户，我希望助手能通过升级的四光源传感器阵列精准感知我的健康状态，不仅在异常时及时提醒，还能基于压力、久坐、睡眠债务等指标主动干预，Agent 可代我执行启动冥想、推迟闹钟等操作，以便我获得从感知到干预的完整健康闭环。

#### 验收标准

1. THE Sensor_Manager SHALL 持续采集心率、血氧、睡眠、压力、体温、ECG、皮电等传感器数据，并将数据作为 Main_Agent 和 Health_Assistant 的上下文输入
2. THE Health_Assistant SHALL 基于长期健康数据趋势生成个性化健康洞察，通过 Quick_Card 或 Notification_Card 主动推送给用户，体现"永远是助理先开口"原则
3. WHEN Health_Assistant 检测到心率超过用户设定的上限阈值或低于下限阈值时，THE Watch_OS SHALL 立即发出振动和视觉警告，并在 IM_Interface 中记录一条告警 Fragment
4. THE Health_Assistant SHALL 支持连续心率监测（采样间隔不超过 5 分钟）、血氧测量（精度 ±2%）、睡眠阶段识别（深睡/浅睡/REM，识别精度≥85%）和压力指数计算（基于 HRV）
5. WHEN 用户在 IM_Interface 询问健康相关问题时，THE Health_Assistant SHALL 结合最近 24 小时的传感器数据提供上下文相关的回答
6. THE Sensor_Manager SHALL 支持传感器数据订阅机制，允许多个 Agent 同时订阅同一传感器的数据流，合并采样请求避免重复采样
7. IF 传感器硬件出现故障或数据异常，THEN THE Sensor_Manager SHALL 向订阅该传感器的 Agent 返回错误状态，并通过 Notification_Card 通知用户
8. WHEN 手机处于已连接状态时，THE Health_Assistant SHALL 每 30 分钟将健康数据同步至 Companion_App
9. THE Sensor_Manager SHALL 支持 Four_Light_Sensor（四光源四光电二极管传感器阵列），心率监测准确率达到 98.4%（接近临床级别），为 Health_Assistant 提供高精度生理数据输入
10. THE Health_Assistant SHALL 支持睡眠算法 2.0，入睡和醒来检测精度相比基线算法提升 11%，睡眠分期（深睡/浅睡/REM/清醒）识别更精准
11. THE Health_Assistant SHALL 支持一键 60 秒全面体检功能：用户点击体检按钮后，Watch_OS 在 60 秒内依次完成心率、血氧、压力和睡眠质量的综合检测，并生成一份结构化体检报告 Fragment
12. WHEN 一键体检完成后，THE Health_Assistant SHALL 通过 Quick_Card 展示体检结果摘要卡片，包含各项指标的数值和健康评级（正常/注意/异常），用户点击可查看详细分析
13. THE Sensor_Manager SHALL 支持 Dual_Freq_GNSS（双频五星 GNSS 定位系统），支持北斗、GPS、GLONASS、Galileo、QZSS 五大卫星系统，定位精度相比单频提升 33%，为 Sport_Assistant 和 Schedule_Assistant 提供高精度位置上下文
14. THE Health_Intervention_Agent SHALL 支持四级主动干预体系：
    - L1 轻提醒：通过 Notification_Card 推送建议（如"已久坐60分钟，建议站立活动"）
    - L2 建议：通过 Quick_Card 展示详细建议和可执行操作（如"压力持续偏高30分钟，建议进行5分钟呼吸练习"）
    - L3 主动介入：Agent 代执行操作并请求用户二次确认（如自动开始站立计时、启动冥想引导、推迟明日闹钟30分钟）
    - L4 紧急：立即执行紧急操作（如拨打紧急联系人电话、触发 SOS 模式）
15. WHEN Health_Intervention_Agent 检测到压力指数≥75 且持续超过 30 分钟时，THE Health_Intervention_Agent SHALL 触发 L2 级干预，通过 Quick_Card 推送呼吸练习建议并提供一键启动冥想操作
16. WHEN Health_Intervention_Agent 检测到用户久坐超过 60 分钟时，THE Health_Intervention_Agent SHALL 触发 L1 级干预，通过 Notification_Card 提醒用户站立活动，并自动开始站立计时
17. WHEN Health_Intervention_Agent 检测到用户睡眠债务累计超过 2 小时时，THE Health_Intervention_Agent SHALL 触发 L2 级干预，建议用户提前休息，并提供一键推迟明日闹钟 30 分钟的操作
18. WHEN Health_Intervention_Agent 检测到运动后心率恢复异常（运动结束 5 分钟后心率仍高于静息心率 30%）时，THE Health_Intervention_Agent SHALL 触发 L2 级干预，建议用户延长休息时间
19. THE Health_Intervention_Agent SHALL 支持用户控制权：用户可一键忽略任何级别的干预、设置勿扰时段（期间仅 L4 紧急干预生效）、L3 和 L4 级干预需用户二次确认后执行
20. THE Health_Intervention_Agent SHALL 将所有干预记录写入 Memory_System，用于长期健康趋势分析和干预策略优化

---

### 需求 14：运动场景 Agent 主动性（150+ 运动模式与运动教练 Agent）

**用户故事：** 作为一名运动爱好者，我希望运动教练 Agent 能在运动中实时干预（配速偏离、心率越界、步态异常），运动后 30 秒内自动生成总结，并基于我的历史数据提供个性化训练计划，以便我获得专业教练级的运动体验。

#### 验收标准

1. THE Sport_Assistant SHALL 根据 HEARTBEAT.md 中的主动性设定，在运动场景中主动发起对话和提醒
2. WHEN Sport_Assistant 通过传感器数据自动检测到用户开始跑步、步行、游泳或骑行时，THE Sport_Assistant SHALL 通过 Notification_Card 询问用户是否启动运动记录（自动运动识别）
3. WHILE 运动记录进行中时，THE Sport_Assistant SHALL 每隔用户设定的间隔（默认 1 公里或 5 分钟）通过语音播报当前配速、距离和心率
4. WHEN 运动过程中心率超过最大心率的 90% 时，THE Sport_Assistant SHALL 通过振动和语音提醒用户降低运动强度
5. WHEN 用户结束运动时，THE Sport_Coach_Agent SHALL 在 30 秒内自动生成运动总结 Fragment，包含核心数据（路线轨迹、平均心率、总距离、卡路里消耗）、Agent 评价（本次运动质量评分和亮点/不足分析）和下次建议（基于训练负荷推荐下次运动类型和强度）
6. THE Sport_Assistant SHALL 基于用户的历史运动数据，在 Quick_Card 中推送个性化运动建议（如"今天适合轻松跑 5 公里"）
7. WHILE 运动记录进行中且 GPS 信号丢失时，THE Sport_Assistant SHALL 使用加速度计和陀螺仪进行惯性导航估算，并在界面显示 GPS 信号弱提示
8. THE Sport_Assistant SHALL 支持 5ATM 防水等级下的游泳运动数据记录，包括泳姿识别、划水次数和泳池圈数
9. THE Sport_Assistant SHALL 支持 150 种以上运动模式的追踪和数据记录，涵盖跑步、骑行、游泳、登山、滑雪、瑜伽、力量训练等主流运动类型
10. THE Sport_Assistant SHALL 支持专业跑步姿态分析功能，基于 IMU 传感器数据分析步频、步幅、触地时间、垂直振幅和左右平衡，在运动结束后生成姿态分析报告 Fragment
11. THE Sport_Assistant SHALL 支持滑雪跌倒检测功能，WHEN 加速度计检测到滑雪过程中的跌倒模式时，THE Sport_Assistant SHALL 通过振动和屏幕提示询问用户是否需要帮助，60 秒内无响应则触发 SOS 模式
12. THE Sport_Assistant SHALL 支持骑行码表模式，在骑行运动中以全屏码表界面显示速度、距离、踏频和功率数据，并支持接入三方蓝牙功率计设备
13. THE Sport_Assistant SHALL 支持 VO2 max 估算和每周训练负荷统计，基于运动历史数据在 Quick_Card 中推送训练负荷建议（如"本周训练负荷偏高，建议休息一天"），体现"永远是助理先开口"原则
14. THE Sport_Assistant SHALL 利用 Dual_Freq_GNSS 提供高精度运动轨迹记录，支持离线地图缓存，在无手机连接时仍可显示运动路线
15. WHILE 运动记录进行中时，THE Sport_Coach_Agent SHALL 支持以下实时干预规则：
    - WHEN 配速偏离目标配速超过 15% 且持续 2 分钟时，通过语音和振动提醒用户调整配速
    - WHEN 心率越过用户设定的心率区间上限时，通过强振动提醒用户降低强度
    - WHEN 达到里程碑（每公里/每5公里/半程）时，通过语音播报阶段数据和鼓励
    - WHEN 步态分析检测到异常模式（如左右不平衡超过 10%）时，通过 Notification_Card 提示用户注意跑姿
16. THE Sport_Coach_Agent SHALL 支持个性化训练模型，持续学习用户的 VO2max 变化趋势和训练负荷响应，支持生成 4 周和 8 周周期化训练计划
17. THE Sport_Coach_Agent SHALL 支持新用户冷启动机制：前 5 次运动为数据采集期，期间以通用建议为主，5 次运动后切换到个性化建议模式

---

### 需求 15：Skill 中心与 Agent 商店（手表端）

**用户故事：** 作为一名手表用户，我希望能在手表上浏览和管理助手的技能，以便我的助手能学会更多能力。

#### 验收标准

1. THE Watch_OS SHALL 提供 Skill_Center 的手表端精简视图，展示当前 Agent 已学会的 Skill 列表和可学习的推荐 Skill
2. THE Watch_OS SHALL 支持 Agent 自主学习 Skill：当 Agent 在执行任务中发现需要新能力时，自动从 Skill_Center 搜索并学习匹配的 Skill
3. WHEN 用户在手表端浏览 Skill_Center 时，THE Watch_OS SHALL 以卡片列表形式展示 Skill 的名称、描述和适用 Agent
4. THE Watch_OS SHALL 支持一键为指定 Agent 添加 Skill，添加后 Agent 立即具备该 Skill 声明的能力
5. THE Watch_OS SHALL 提供 Agent_Store 的手表端精简视图，展示推荐的一方和三方 Agent
6. WHEN 用户在 Agent_Store 中选择安装一个三方 Agent 时，THE Watch_OS SHALL 通过 Phone_Bridge 将安装请求转发至手机端完成下载和部署
7. THE Watch_OS SHALL 区分 Skill_Center（给 Agent 加技能）和 Agent_Store（给用户加助理）两个独立入口
8. IF 手表端存储空间不足以安装新的三方 Agent，THEN THE Watch_OS SHALL 提示用户存储空间不足并建议在手机端管理

---

### 需求 16：移动支付（支付消费 Agent）

**用户故事：** 作为一名手表用户，我希望通过手表完成移动支付，支付 Agent 能感知场景自动预加载支付码，消费后自动记账分类，每日推送消费摘要，以便我获得从支付到记账的完整消费管理体验。

#### 验收标准

1. THE Watch_OS SHALL 支持 NFC 离线支付功能，兼容主流公交卡和银行卡协议
2. WHEN 用户将 Watch_Device 靠近 NFC 读卡器时，THE Watch_OS SHALL 在 500 毫秒内完成支付交易
3. WHEN 用户双击侧键时，THE Watch_OS SHALL 快速调出支付码或 NFC 支付界面
4. THE Watch_OS SHALL 在支付前要求用户通过 PIN 码或手腕检测验证身份
5. IF Watch_Device 检测到手表被摘下，THEN THE Watch_OS SHALL 自动锁定支付功能，直到用户重新佩戴并验证身份
6. WHEN 支付完成后，THE Main_Agent SHALL 在 IM 对话流中记录一条支付 Fragment，包含金额、商户和时间信息
7. THE Watch_OS SHALL 在本地存储最近 50 条交易记录，供用户离线查看
8. WHEN Payment_Agent 通过 Context_Layer 检测到用户进入地铁站时，THE Payment_Agent SHALL 自动预加载公交码到 Quick_Card 顶部，用户抬腕即可刷码进站
9. WHEN Payment_Agent 通过 Context_Layer 检测到用户到达餐厅或商店时，THE Payment_Agent SHALL 自动预加载支付码到 Quick_Card，减少用户操作步骤
10. WHEN 支付完成后，THE Payment_Agent SHALL 自动将消费记录归类（餐饮/交通/购物/娱乐/其他），并写入本地消费账本
11. WHEN 每日 22:00 时，THE Payment_Agent SHALL 通过 Quick_Card 推送当日消费摘要卡片，包含总消费金额、各分类占比和异常消费提示
12. THE Payment_Agent SHALL 支持安全分级：单笔金额≤200 元免密支付（仅需手腕检测），超过 200 元需生物认证（PIN 码或指纹），异常支付（异地/大额/高频）需手机端二次确认

---

### 需求 17：系统电源管理

**用户故事：** 作为一名手表用户，我希望手表拥有出色的续航能力，以便我减少充电频率。

#### 验收标准

1. THE Power_Manager SHALL 支持智能功耗调度，根据 Agent 活跃状态和用户使用模式自动调整 CPU 频率和传感器采样率
2. THE Power_Manager SHALL 提供至少三种电源模式：正常模式、省电模式和超级省电模式
3. WHEN Watch_Device 电量低于 20% 时，THE Power_Manager SHALL 通过 Notification_Card 提示用户切换到省电模式
4. WHEN Watch_Device 电量低于 5% 时，THE Power_Manager SHALL 自动进入超级省电模式，仅保留时间显示、紧急呼叫和 Main_Agent 的基础对话能力
5. WHILE Watch_Device 处于省电模式时，THE Power_Manager SHALL 降低屏幕亮度、关闭 AOD_Layer、延长传感器采样间隔、限制子 Agent 的后台活动和主动推送频率
6. THE Power_Manager SHALL 在设置界面显示预估剩余使用时间和各 Agent 模块的功耗占比
7. THE Power_Manager SHALL 支持充电状态检测，在接入充电器时显示充电动画和预计充满时间

---

### 需求 18：Agent Bootstrap 与首次体验

**用户故事：** 作为一名新手表用户，我希望首次开机时有一个温暖的引导体验，以便我的助手能快速了解我并建立个性化服务。

#### 验收标准

1. WHEN 用户首次启动 Watch_Device 时，THE Main_Agent SHALL 执行 BOOTSTRAP.md 定义的"出生仪式"流程，通过 IM 对话引导建立自我认知
2. THE Main_Agent SHALL 在首次引导中通过 3-5 个简短问题了解用户的基本偏好（称呼、运动习惯、健康关注点、作息时间）
3. WHEN 首次引导完成后，THE Main_Agent SHALL 将用户偏好写入 USER.md 和 MEMORY.md，并同步至手机端
4. THE Watch_OS SHALL 在首次引导中展示配对手机的流程，引导用户通过 Companion_App 完成蓝牙配对
5. WHEN 手表与手机完成配对后，THE Watch_OS SHALL 自动从手机端同步已有的 Persona_System 和子 Agent 列表
6. IF 用户跳过首次引导，THEN THE Watch_OS SHALL 使用默认人格配置启动，并在后续交互中逐步学习用户偏好
7. THE Main_Agent SHALL 在首次引导完成后发送一条欢迎 Fragment，介绍手表端可用的核心助手和交互方式

---

### 需求 19：导航与出行（通勤出行 Agent 全链路）

**用户故事：** 作为一名手表用户，我希望通勤出行 Agent 能覆盖出行全链路——出发前主动预判是否能准时到达并提供一键打车，途中提供震动导航和精确到出口编号的换乘提醒，到达后自动关闭导航并弹出目标场景入口，异常时自动处理（地铁离线路线、打车取消重叫、堵车起草迟到通知），以便我获得无缝的出行体验。

#### 验收标准

1. THE Schedule_Assistant SHALL 支持接收来自 Companion_App 的导航路线数据，并在手表屏幕上以简化地图或转向指示方式显示
2. WHEN 导航路线中即将到达转弯点时，THE Schedule_Assistant SHALL 提前 50 米通过振动和屏幕提示通知用户转向方向
3. THE Schedule_Assistant SHALL 在导航过程中持续显示剩余距离和预计到达时间，并在负一屏固定一张导航 Quick_Card，同时在 Status_Bar 显示导航剩余距离
4. IF 导航过程中手机断开连接，THEN THE Schedule_Assistant SHALL 继续显示已缓存的路线数据，并通过 Notification_Card 提示用户手机已断连
5. WHEN 用户通过语音对 Main_Agent 说出导航目的地时，THE Main_Agent SHALL 将请求路由给 Schedule_Assistant，Schedule_Assistant 通过 Phone_Bridge 调用手机端导航应用
6. WHEN 用户有日程事件且 Commute_Agent 判断当前位置到目的地的预计出行时间可能导致迟到时，THE Commute_Agent SHALL 在日程开始前主动通过 Notification_Card 提醒用户出发，并提供一键打车操作
7. WHILE 导航进行中且使用地铁出行时，THE Commute_Agent SHALL 提供精确到出口编号的换乘提醒，在到站前 1 分钟通过振动提醒用户准备下车
8. WHEN 用户到达目的地时，THE Commute_Agent SHALL 自动关闭导航界面，并在 Quick_Card 弹出目标场景入口（如到达公司弹出今日日程、到达餐厅弹出支付码）
9. IF 导航过程中检测到严重堵车且预计迟到超过 10 分钟，THEN THE Commute_Agent SHALL 通过 Notification_Card 提示用户，并提供一键发送"我预计迟到X分钟"消息给日程关联联系人的操作
10. IF 用户打车后司机取消订单，THEN THE Commute_Agent SHALL 自动重新叫车并通过 Notification_Card 通知用户"已重新叫车"
11. WHILE 用户处于地铁离线环境时，THE Commute_Agent SHALL 使用离线缓存的地铁路线数据继续提供换乘指引和到站提醒

---

### 需求 20：音乐控制

**用户故事：** 作为一名手表用户，我希望通过手表控制音乐播放，以便我在运动或日常使用中便捷地管理音乐。

#### 验收标准

1. THE Watch_OS SHALL 支持远程控制配对手机上的音乐应用，提供播放、暂停、上一曲、下一曲和音量调节功能
2. THE Watch_OS SHALL 在音乐播放时在负一屏固定一张音乐控制 Quick_Card，显示歌曲名称、艺术家和控制按钮，同时在 Status_Bar 显示当前播放歌曲名
3. THE Watch_OS SHALL 支持本地音乐存储和播放，通过蓝牙连接无线耳机输出音频
4. WHEN 用户通过语音对 Main_Agent 说"播放音乐"或"下一首"时，THE Main_Agent SHALL 自动调用音乐控制 Skill 执行对应操作
5. THE Watch_OS SHALL 支持通过手腕翻转手势快捷切歌，通过表冠旋转调节音量

---

### 需求 21：IoT 控制（智能家居 Agent 生理状态联动）

**用户故事：** 作为一名智能家居用户，我希望智能家居 Agent 能基于我的生理状态自动联动家居设备（入睡自动关灯调空调、体温偏高自动降温、压力高启动冥想模式），并支持到离家感知自动触发场景，以便我获得真正智能的居家体验。

#### 验收标准

1. THE IoT_Assistant SHALL 通过 Phone_Bridge 中转控制指令，支持灯光、空调、窗帘和扫地机器人等智能家居设备的控制
2. WHEN 用户在 IM_Interface 对 Main_Agent 说出 IoT 控制指令（如"打开客厅灯"）时，THE Main_Agent SHALL 将指令路由给 IoT_Assistant 执行
3. THE IoT_Assistant SHALL 支持场景模式，用户通过语音或 Quick_Card 一键触发预设场景（如"回家模式"开灯+开空调）
4. THE IoT_Assistant SHALL 在负一屏提供常用 IoT 设备的 Quick_Card，显示设备当前状态和快捷控制按钮
5. IF IoT 设备控制指令发送失败，THEN THE IoT_Assistant SHALL 在 IM 对话流中记录失败 Fragment，并提供重试选项
6. THE Watch_OS SHALL 支持跨品牌设备互联，同时支持小米生态和苹果 HomeKit 设备的控制
7. WHEN 用户离开公司（GPS 触发）时，THE IoT_Assistant SHALL 通过振动和 Quick_Card 显示回家场景执行状态，用户一点确认即可触发回家模式
8. WHEN Smart_Home_Agent 通过 Health_Assistant 检测到用户入睡时，THE Smart_Home_Agent SHALL 自动执行睡眠场景：关闭卧室灯光、将空调切换到睡眠模式、关闭电视，并在次日通过 Quick_Card 展示执行记录
9. WHEN Smart_Home_Agent 通过 Sensor_Manager 检测到用户体温偏高（超过基线 0.5°C）时，THE Smart_Home_Agent SHALL 自动将空调温度调低 2°C，并通过 Notification_Card 通知用户"已为您调低空调温度"
10. WHEN Smart_Home_Agent 通过 Health_Assistant 检测到用户压力指数持续偏高时，THE Smart_Home_Agent SHALL 自动触发冥想模式：调暗灯光、播放白噪音、关闭非必要通知
11. WHEN Smart_Home_Agent 通过 Dual_Freq_GNSS 检测到用户距家 500 米时，THE Smart_Home_Agent SHALL 自动预热热水器并通过 Quick_Card 展示"已为您预热热水器"
12. WHEN Smart_Home_Agent 检测到用户离家且有设备未关闭（如空调、灯光仍开启）时，THE Smart_Home_Agent SHALL 通过 Notification_Card 提醒用户，并提供一键关闭所有设备的操作
13. THE Smart_Home_Agent SHALL 对安全相关设备操作（门锁开关、摄像头查看、燃气阀门控制）强制要求生物认证后执行

---

### 需求 22：紧急求助与安全

**用户故事：** 作为一名手表用户，我希望在紧急情况下手表能快速发出求助信号，以便我在危险时获得及时帮助。

#### 验收标准

1. WHEN 用户连续按侧键 5 次时，THE Watch_OS SHALL 触发 SOS 模式，自动拨打紧急联系人并发送包含 GPS 位置的求助信息
2. WHEN Health_Assistant 检测到用户可能跌倒（基于加速度计数据突变）且 60 秒内无用户响应时，THE Watch_OS SHALL 自动触发 SOS 模式
3. THE Watch_OS SHALL 在 SOS 模式下持续发送 GPS 位置更新给紧急联系人，直到用户手动取消
4. IF Watch_Device 检测到手表被摘下，THEN THE Watch_OS SHALL 自动锁定设备，需要 PIN 码解锁后才能使用支付和个人数据功能

---

### 需求 23：差异化 Agentic 能力

**用户故事：** 作为一名产品经理，我希望手表 OS 的 Agentic 能力形成独特的差异化卖点，以便在市场竞争中脱颖而出。

#### 验收标准

1. THE Main_Agent SHALL 支持多轮对话和上下文理解，在手表端的连续对话中保持语境连贯，引用同一 Topic 下的历史 Fragment
2. THE Watch_OS SHALL 支持 AI 智能表盘功能，Main_Agent 根据用户当前上下文自动推荐和切换表盘样式
3. THE Main_Agent SHALL 支持多步骤复合指令的自动拆解，将复杂请求分解为多个子 Agent 任务并协调执行
4. THE Watch_OS SHALL 支持手势控制作为 Skill 的快捷触发方式，通过手腕翻转、握拳等手势执行预设操作
5. THE Health_Assistant SHALL 提供 AI 健康洞察功能，基于长期健康数据趋势在 Quick_Card 中推送个性化健康建议
6. THE Watch_OS SHALL 支持小程序快应用模式，用户无需安装即可通过扫码或链接直接运行轻量应用
7. THE Main_Agent SHALL 支持离线基础对话能力，在无手机连接时仍能处理闹钟、计时器、运动启停等本地指令

---

### 需求 24：Demo 演示与原型

**用户故事：** 作为一名产品团队成员，我希望有一个可交互的 Demo 原型，以便在开发早期验证 Agentic OS 的交互设计和核心功能流程。

#### 验收标准

1. THE Demo_Simulator SHALL 提供基于浏览器的手表 OS 模拟器，在圆形或方形表盘视图中渲染 Watch_OS 界面
2. THE Demo_Simulator SHALL 支持模拟 IM 对话交互，包括语音输入模拟（文本框代替）、Main_Agent 回复、子 Agent 路由和 Notification_Card 推送
3. THE Demo_Simulator SHALL 支持模拟五种 Session 渲染面的切换：表盘（含 AOD_Layer 和 Complication）、Status_Bar、通知列表、负一屏 Quick_Card、IM_Interface
4. THE Demo_Simulator SHALL 提供模拟数据注入面板，允许注入心率、步数、通知、日程等模拟数据触发 Agent 行为
5. THE Demo_Simulator SHALL 支持模拟触摸交互（点击、滑动、长按）和表冠旋转操作
6. WHEN Demo_Simulator 启动时，THE Demo_Simulator SHALL 在 5 秒内加载完成并显示默认表盘界面
7. THE Demo_Simulator SHALL 支持多种表盘尺寸预览，至少包括 1.43 英寸圆形和 1.75 英寸方形两种规格

---

### 需求 25：APP 改造原则的手表端适配

**用户故事：** 作为一名手表用户，我希望手表端 APP 遵循"成品信息优先"原则，以便我在小屏幕上获得的每一条信息都是经过 Agent 加工的、可直接消费的成品信息，而非需要二次处理的中间信息。

#### 验收标准

1. THE Watch_OS SHALL 确保手表端所有 APP 遵循"成品信息优先于中间信息"原则：APP 展示的内容为 Agent 加工后的 Finished_Information，而非原始数据或中间态信息
2. THE Watch_OS SHALL 确保手表端 APP 与 Agent 的关系为 N:N——APP 不是某个 Agent 的专属渲染面，APP 是用户查看和操作某类信息的全局视图；Agent 负责产出成品信息，APP 负责展示和操作
3. THE Watch_OS SHALL 要求每个手表端 APP 团队以"能力包"形式交付：包含 Tool 清单、Skill 描述、Atomic_Component 集合、数据接入协议和 APP 界面
4. THE Watch_OS SHALL 支持 Agent 与用户共同往 APP 中填充内容：Agent 自动写入成品信息，用户可在 APP 中查看、修改和补充
5. WHILE Watch_Device 屏幕尺寸小于 2 英寸时，THE Watch_OS SHALL 优先通过 Agent 在表盘 Complication、Notification_Card 和 Quick_Card 等触点直接交付成品信息，减少用户打开独立 APP 的需求——"打开 APP"是最后选项
6. THE Watch_OS SHALL 支持 APP 展示跨域关联信息：一个 APP 中可呈现来自多个 Agent 的关联数据（如日程 APP 中显示关联的导航信息和天气信息）

---

### 需求 26：手表端五触点体系与 Delivery_Rule

**用户故事：** 作为一名手表用户，我希望手表端拥有与手机端对应的触点体系，Agent 能通过最合适的触点将成品信息交付给我，信息和操作就在当前界面完成。

#### 验收标准

1. THE Watch_OS SHALL 实现手机端七触点到手表端五触点的映射体系：
   - 手机端息屏(AOD) → 手表端 AOD_Layer（最轻的一瞥，抬腕看到一行字就知道有没有重要的事）
   - 手机端锁屏 → 手表端表盘（每天的第一个界面，整理好的信息而不是一堆未读通知）
   - 手机端灵动岛 → 手表端 Status_Bar（表盘顶部常驻状态条，正在进行的事的追踪器，盯着当前最重要的那一件事）
   - 手机端通知 → 手表端振动 + Notification_Card（打断机制，只有值得打断用户的事才走通知）
   - 手机端负一屏 → 手表端负一屏 Quick_Card（主动查看的全景面板）
   - 手机端桌面小组件 → 手表端 Complication（常驻的信息窗口）
   - 手机端 APP → 手表端 IM_Interface（深度交互的最后手段，不是第一入口）
2. THE Watch_OS SHALL 支持 Wrist_Raise_Layer 作为手表端的核心交互面：用户抬腕后通过语音驱动交互，每次唤醒为干净的新层，不是对话模式而是语音驱动的 UI 编排方式
3. WHEN 用户抬腕并说出指令时，THE Wrist_Raise_Layer SHALL 在 1 秒内激活语音识别，Main_Agent 根据指令内容实时编排 Atomic_Component 组合呈现结果
4. THE Wrist_Raise_Layer SHALL 支持 Agent 返回结果的多种渲染形式：纯文本回复、Atomic_Component 卡片组合、可操作按钮列表、确认对话框（确认要极轻，一点即可）
5. THE Watch_OS SHALL 实现 Delivery_Rule 的手表适配版本，按成品信息性质路由到对应触点：
   - 需要立即知道的信息 → AOD_Layer + Complication，以精简文本呈现
   - 正在进行的事 → Status_Bar，实时追踪
   - 需要持续关注的信息 → 负一屏 Quick_Card，实时更新
   - 值得打断用户的信息 → 振动 + Notification_Card
   - 用户主动询问的信息 → Wrist_Raise_Layer，以 Atomic_Component 组合呈现
   - 需要深度交互的信息 → IM_Interface，支持多轮对话
   - 需要全局浏览的信息 → 对应 APP 界面
6. WHEN Agent 产出一条成品信息时，THE Main_Agent SHALL 根据 Delivery_Rule 自动选择最合适的触点进行交付，无需用户手动切换界面
7. THE Watch_OS SHALL 确保 Wrist_Raise_Layer 在用户放下手腕后自动消失，不留残留状态，下次抬腕为全新的交互层
8. THE Watch_OS SHALL 确保同一个 Agent 任务在不同触点有不同渲染方式：Agent 不需要知道触点长什么样，Agent 只输出 Structured_Output，Render_Layer 根据每个触点的约束自动适配展示

---

### 需求 27：日程助手能力原子化（腕上日程 Agent：通知不是终点，执行才是终点）

**用户故事：** 作为一名手表用户，我希望日程助手不仅能提醒我日程，更能代我执行——一键导航到会议地点、自动发消息"我X分钟后到"、标记冲突日程待重排，Agent 基于位置/心率/当前任务综合判断最佳行动方案，以便我获得从提醒到执行的完整日程管理体验。

#### 验收标准

1. THE Schedule_Assistant SHALL 提供以下 Tool 清单供 Main_Agent 和其他 Agent 调用：create_event（创建事件）、modify_event（修改事件）、delete_event（删除事件）、query_event（查询事件）、query_free_time（查询空闲时段）
2. WHEN Communication_Assistant 从短信、邮件或通话中提取到时间相关信息（如航班时间、会议邀请、快递预计到达）时，THE Schedule_Assistant SHALL 自动创建对应的日程事件，并标注信息来源
3. THE Schedule_Assistant SHALL 为每个日程事件附加上下文信息，包括：信息来源（手动创建/AI 提取）、关联联系人、关联地点和相关 Fragment 引用
4. THE Watch_OS SHALL 提供以下日程 Atomic_Component 供各触点渲染：今日日程卡片（显示当日全部事件时间线）、事件倒计时组件（显示最近事件的倒计时，可渲染在 Status_Bar 和 Complication）、出行动态卡片（显示出行事件的实时状态如航班延误、打车到达）
5. WHEN 日程事件的关联信息发生变化（如航班延误、会议地点变更）时，THE Schedule_Assistant SHALL 自动更新事件内容并通过 Notification_Card 通知用户
6. THE Schedule_Assistant SHALL 支持来源区分：AI 自动写入的事件与用户手动创建的事件在视觉上有明确区分标识，用户可对 AI 写入的事件进行确认、修改或删除
7. WHEN 用户通过语音对 Main_Agent 说出日程相关指令时，THE Main_Agent SHALL 将指令路由给 Schedule_Assistant，Schedule_Assistant 调用对应 Tool 执行并返回结果
8. THE Schedule_Assistant SHALL 基于用户日程空闲时段和历史习惯，在 Quick_Card 中推送空闲时间建议（如"下午 3-4 点空闲，适合散步"），体现"永远是助理先开口"原则
9. WHEN 会议前 15 分钟时，THE Schedule_Assistant SHALL 通过振动提醒用户，并在 Complication 显示会议倒计时
10. WHEN 日程提醒触发时，THE Schedule_Assistant SHALL 在 Notification_Card 中提供可代执行操作按钮：一键导航到目的地、一键发送"我X分钟后到"消息给日程关联联系人、标记冲突日程待重排
11. THE Schedule_Assistant SHALL 基于 Context_Layer 综合判断用户当前状态（位置距离、心率是否处于运动中、当前是否有进行中任务），自动生成最适合的行动建议和预计到达时间
12. WHEN 用户点击"发送到达消息"操作时，THE Schedule_Assistant SHALL 基于当前位置和交通状况自动计算预计到达时间，生成消息预览（如"我大约15分钟后到"），用户一点确认即可通过 Communication_Assistant 发送
13. THE Schedule_Assistant SHALL 支持 Agent 预生成 3 条适用快速回复模板（基于日程上下文），用户在日程提醒卡片上一点即可发送，无需手动输入

---

### 需求 28：通讯助手智能化

**用户故事：** 作为一名手表用户，我希望通讯助手能统一管理来电、消息和联系人，并自动提取有价值信息，以便我在手表上获得智能化的通讯体验。

#### 验收标准

1. THE Communication_Assistant SHALL 统一管理来电、消息和联系人三类通讯数据，共享"人"的关系数据模型
2. WHEN 来电到达时，THE Communication_Assistant SHALL 在来电界面附加上下文信息：上次通话时间和摘要、联系人关系标签（家人/同事/朋友）、最近相关 Fragment 引用
3. WHEN 通话结束后，THE Communication_Assistant SHALL 自动生成通话摘要 Fragment，包含通话时长、关键话题和待办事项提取，并同步至 Main_Agent 的 Session
4. THE Communication_Assistant SHALL 对接收到的消息进行智能分类和信息提取：航班信息提取后自动写入 Schedule_Assistant 日程、快递信息提取后生成到期提醒 Notification_Card、消费信息提取后记录交易摘要、验证码提取后在需要时自动填充
5. WHEN Communication_Assistant 从消息中提取出有价值信息并分发到对应 Agent 后，THE Communication_Assistant SHALL 在原消息上标注"已提取"状态，用户可查看提取详情
6. THE Communication_Assistant SHALL 为联系人自动维护关系标签（基于通讯频率、通话内容和用户确认），并在联系人详情中展示互动上下文时间线
7. WHEN 某个联系人超过用户设定的时间阈值（默认 90 天）未有任何互动时，THE Communication_Assistant SHALL 通过 Quick_Card 推送关系维护提醒（如"已 3 个月未联系张三"）
8. THE Communication_Assistant SHALL 提供以下 Atomic_Component：来电上下文卡片、消息智能摘要卡片、联系人关系卡片，供各触点按需渲染
9. WHEN 用户在手表端语音说"告诉老婆今晚加班"时，THE Communication_Assistant SHALL 生成消息预览确认卡片（振动提醒），用户一点即可发送，无需跳转到消息 APP

---

### 需求 29：手表端设置对话化

**用户故事：** 作为一名手表用户，我希望通过对话方式完成大部分设置操作，以便我无需在小屏幕上层层翻找设置项。

#### 验收标准

1. THE Watch_OS SHALL 支持通过自然语言对话完成设置操作，用户对 Main_Agent 说出设置意图（如"把亮度调高"、"打开省电模式"、"关闭抬腕亮屏"）后，Main_Agent 直接执行对应设置变更
2. THE Main_Agent SHALL 维护一份系统设置 Tool 清单，覆盖亮度调节、音量调节、电源模式切换、连接管理、显示设置、通知设置等常用设置项
3. WHEN Main_Agent 执行设置变更后，THE Watch_OS SHALL 即时生效变更并在 Wrist_Raise_Layer 或 IM_Interface 中显示视觉确认反馈（如"亮度已调至 80%"），确认要极轻
4. THE Watch_OS SHALL 保留精简的 GUI 设置界面作为全局视图，用户可通过 GUI 浏览和修改所有设置项
5. WHEN 用户通过对话请求的设置变更涉及高风险操作（如恢复出厂设置、清除数据）时，THE Watch_OS SHALL 要求用户通过 PIN 码或二次语音确认后再执行
6. THE Watch_OS SHALL 支持设置变更的撤销能力，用户在设置变更后 30 秒内可通过语音说"撤销"恢复到变更前的状态

---

### 需求 30：Tool 注册与原子化能力

**用户故事：** 作为一名手表用户，我希望天气、计时器、闹钟等传统功能无需打开独立 APP，助手在需要时直接提供结果，以便我获得更流畅的使用体验。

#### 验收标准

1. THE Watch_OS SHALL 将以下传统功能作为 Tool 注册到 Tool_Registry 供 Main_Agent 调用：天气查询（weather_query）、计时器（timer_start/timer_stop）、闹钟（alarm_set/alarm_delete/alarm_query）、指南针（compass_read）、秒表（stopwatch_start/stopwatch_stop/stopwatch_lap）、手电筒（flashlight_toggle）
2. WHEN 用户通过语音或对话请求上述功能时，THE Main_Agent SHALL 直接调用对应 Tool 并通过 Wrist_Raise_Layer 或 Notification_Card 交付结果，无需打开独立 APP 界面——信息和操作就在当前界面完成
3. THE Watch_OS SHALL 不再为天气、计时器、闹钟、指南针、秒表、手电筒提供独立 APP 入口，所有功能通过 Agent 调用 Tool 交付
4. THE Watch_OS SHALL 为每个注册 Tool 提供对应的 Atomic_Component：天气卡片（温度+天气图标+简要预报）、计时器组件（倒计时显示+暂停/取消按钮）、闹钟组件（下次闹钟时间+开关）、指南针组件（方向指示+度数）
5. WHEN 计时器或闹钟触发时，THE Watch_OS SHALL 通过振动和 Notification_Card 提醒用户，用户可在 Notification_Card 上直接操作（停止/延后），一点即可
6. THE Main_Agent SHALL 支持组合调用多个 Tool 完成复合请求（如"明天早上 7 点叫我起床，顺便告诉我天气"同时调用 alarm_set 和 weather_query）

---

### 需求 31：车助手手表端（深度 EV 联动与主动安全）

**用户故事：** 作为一名小米汽车车主和手表用户，我希望通过手表深度联动车辆，不仅能远程控制和查看车辆状态，还能在驾驶中获得主动安全提醒，手表作为蓝牙车钥匙靠近即可解锁，以便我在任何场景下都能便捷安全地管理车辆。

#### 验收标准

1. THE Car_Assistant SHALL 作为厂商预置子 Agent 在手表端提供车辆远程控制、状态查询和主动安全提醒能力
2. THE Car_Assistant SHALL 支持以下远程控制 Tool：车辆锁定/解锁（car_lock/car_unlock）、空调预热/预冷（car_climate_start/car_climate_stop）、充电状态查询（car_charge_status）、车辆定位（car_locate）、车窗控制（car_window_open/car_window_close）
3. WHEN 用户通过语音对 Main_Agent 说出车辆控制指令（如"把车预热一下"、"车锁了吗"）时，THE Main_Agent SHALL 将指令路由给 Car_Assistant 执行
4. THE Car_Assistant SHALL 在负一屏提供车辆状态 Quick_Card，显示电量/油量、车辆锁定状态、车内温度和车辆位置，Quick_Card 内容实时更新
5. WHEN Car_Assistant 检测到车辆状态异常（如车门未关、电量低于 20%）时，THE Car_Assistant SHALL 通过 Notification_Card 主动提醒用户
6. THE Car_Assistant SHALL 支持车辆控制操作的安全验证：锁车/解锁操作需用户在手表上确认（展示预览，一点确认），敏感操作（如远程启动）需 PIN 码验证
7. WHEN 用户通过 Phone_Bridge 与车辆建立连接后，THE Car_Assistant SHALL 在 3 秒内完成车辆状态数据的首次同步
8. THE Car_Assistant SHALL 提供以下 Atomic_Component：车辆状态卡片（电量+锁定状态+温度）、充电进度组件（充电百分比+预计充满时间）、车辆定位组件（地图缩略图+距离）
9. THE Car_Assistant SHALL 支持 SU7 和 YU7 车型的深度联动，通过小米汽车 App 协议与车辆建立连接
10. WHILE 用户处于驾驶状态时，THE Car_Assistant SHALL 基于 Health_Assistant 的生理数据（心率变异性降低、血氧下降）检测疲劳驾驶状态，通过强振动和 Notification_Card 主动提醒用户注意安全，体现"永远是助理先开口"原则
11. WHILE 用户处于驾驶状态且车速超过限速时，THE Car_Assistant SHALL 通过强振动和 AOD_Layer 显示超速警告，提醒用户减速
12. WHILE 导航进行中时，THE Car_Assistant SHALL 在交通节点（红绿灯变化、匝道转换、出口接近）提前通过振动提醒用户，避免错过关键路线节点
13. THE Watch_OS SHALL 支持 BT_Car_Key（蓝牙车钥匙）功能，WHEN 用户佩戴手表靠近车辆时，THE Car_Assistant SHALL 通过蓝牙信号自动解锁车辆，无需手动操作
14. THE Car_Assistant SHALL 将车辆安全提醒（疲劳驾驶、超速）的紧急程度设为 critical，确保通过 Delivery_Rule 路由到振动 + Notification_Card + AOD_Layer 多触点同时提醒
15. THE Car_Assistant SHALL 将车辆状态（电量、充电进度、车内温度）主动推送到 Complication，用户在表盘即可一瞥车辆关键状态

---

### 需求 32：Agent 结构化输出与三层渲染体系（表现层声明式 UI + 3 秒原则）

**用户故事：** 作为一名手表用户，我希望 Agent 的输出能通过声明式 UI 自动适配手表端不同触点的展示约束，遵循 3 秒原则（抬腕 3 秒内完成信息消费并作出决策），支持胶囊/卡片/全屏页/覆层/语音五种展示形态，以便我在任何触点上都能获得最合适的信息呈现方式。

#### 验收标准

1. THE Watch_OS SHALL 要求所有 Agent 以 Structured_Output 格式输出内容，包含三个核心字段：文本内容（text）、操作选项列表（actions）和紧急程度（urgency: low/medium/high/critical）
2. THE Render_Layer SHALL 根据 Structured_Output 的紧急程度和当前触点约束自动选择渲染方式，Agent 不需要知道触点长什么样
3. THE Watch_OS SHALL 实现三层渲染体系：
   - Customized_Render（定制层，覆盖约 80% 日常交互）：为 12 种高频场景提供定制设计——消息摘要、确认操作、日程提醒、今日概览、通知聚合、任务状态、IoT 场景执行、健康告警、车辆安全提醒卡片（疲劳驾驶/超速振动提醒）、门锁摄像头实时画面卡片（门铃响时显示门口画面）、一键体检结果卡片（60 秒体检各项指标和健康评级）、运动姿态分析卡片（跑步姿态/骑行功率等专业数据可视化）
   - Generic_Render（通用层，覆盖约 15% 长尾场景）：Markdown 渲染 + 4 个交互组件（按钮、选择项、倒计时、状态标签），手表端用语音替代文本输入组件
   - Fallback_Render（兜底层，覆盖约 5% 复杂场景）：通过 Phone_Bridge 跳转到手机端 Companion_App 处理
4. WHEN Agent 输出的 Structured_Output 匹配到 Customized_Render 的某个高频场景模板时，THE Render_Layer SHALL 使用定制模板渲染，提供最优的视觉和交互体验
5. WHEN Agent 输出的 Structured_Output 未匹配到任何定制模板时，THE Render_Layer SHALL 使用 Generic_Render 渲染，通过 Markdown 和交互组件组合呈现
6. WHEN Generic_Render 无法满足展示需求（如需要复杂表单输入、长文档编辑）时，THE Render_Layer SHALL 自动降级到 Fallback_Render，通过 Phone_Bridge 将内容转发到手机端处理，并在手表端显示"已转至手机端"提示
7. THE Watch_OS SHALL 确保同一个 Agent 的同一条 Structured_Output 在不同触点（AOD_Layer、表盘、Status_Bar、Notification_Card、Quick_Card、Wrist_Raise_Layer、IM_Interface）有不同的渲染方式，Render_Layer 根据触点的屏幕空间和交互能力自动裁剪和适配
8. THE Render_Layer SHALL 在 200 毫秒内完成 Structured_Output 到触点渲染的转换
9. THE Presentation_Layer SHALL 支持声明式 UI 模式：Agent 声明内容类型和数据结构，Presentation_Layer 负责选择最合适的展示形态进行渲染，Agent 无需关心具体渲染实现
10. THE Presentation_Layer SHALL 支持五种展示形态：
    - 胶囊（Capsule）：最小信息单元，用于 Status_Bar 和 Complication，显示单行关键信息
    - 卡片（Card）：标准信息载体，用于 Quick_Card 和 Notification_Card，支持标题+摘要+操作按钮
    - 全屏页（Page）：沉浸式展示，用于运动记录、导航、IM_Interface 等需要全屏交互的场景
    - 覆层（Overlay）：紧急信息覆盖，P0 级紧急信息强制全屏覆盖当前界面
    - 语音（Voice）：纯语音交互形态，用于运动中、驾驶中等不便看屏幕的场景
11. THE Presentation_Layer SHALL 遵循 3 秒原则：用户抬腕 3 秒内完成信息消费并作出决策，单一信息全屏展示、列表最多 3 条、长文本以标题+1 句摘要呈现并提供推送到手机查看完整内容的操作
12. WHILE 多个 Agent 同时产出需要展示的内容时，THE Presentation_Layer SHALL 按优先级排队展示：P0 紧急信息以覆层（Overlay）强制全屏，同时最多显示 2 个胶囊或卡片，其余按优先级排队等待

---

### 需求 33：Agent 管理手表端

**用户故事：** 作为一名手表用户，我希望在手表上轻量管理我的 Agent，查看运行状态、暂停或恢复 Agent，以便我随时掌控 Agent 的工作情况。

#### 验收标准

1. THE Watch_OS SHALL 提供 Agent_Manager 手表端精简视图，按状态分组展示 Agent 列表：运行中、等待触发、已暂停
2. THE Agent_Manager SHALL 为每个 Agent 展示以下信息：名称、类型标签（一次性/周期性/监控型/条件触发/系统常驻）、上次触发时间
3. THE Agent_Manager SHALL 支持在手表端对 Agent 执行以下操作：暂停（运行中→已暂停）、恢复（已暂停→运行中）、删除（需二次确认）
4. WHEN 用户需要编辑 Agent 的详细配置（如修改触发条件、调整职责描述）时，THE Agent_Manager SHALL 通过 Phone_Bridge 将编辑操作转发到手机端 Companion_App
5. THE Agent_Manager SHALL 支持手表端一键创建高频 Agent 模板：IoT 场景 Agent（如"回家模式"）、定期提醒 Agent（如"每天 8 点吃药"）、价格监控 Agent（如"机票降价提醒"）
6. WHEN 用户在手表端通过语音说"创建一个提醒我每天喝水的助手"时，THE Main_Agent SHALL 自动匹配"定期提醒"模板，通过语音确认参数后一键创建
7. THE Agent_Manager SHALL 通过 Phone_Bridge 与手机端 Agent 管理保持双向同步，手表端的操作实时反映到手机端
8. THE Agent_Manager SHALL 在 Quick_Card 中展示当前运行中 Agent 的状态摘要卡片，用户无需进入 Agent_Manager 即可一览 Agent 工作状态

---

### 需求 34：记忆系统手表端

**用户故事：** 作为一名手表用户，我希望手表的传感器数据能作为 AI 记忆的来源，让 AI 更懂我，同时我能查看和管理这些记忆。

#### 验收标准

1. THE Watch_OS SHALL 将手表端传感器数据（心率、运动轨迹、睡眠质量、位置历史）作为 Memory_System 的记忆来源，自动写入 MEMORY.md
2. THE Memory_System SHALL 确保记忆渗透在手表端 Agent 的每一次决策中：Main_Agent 和所有 Sub_Agent 在生成回复和推荐时引用 Memory_System 中的相关记忆
3. WHEN 用户在对话中提到个人偏好或习惯信息时，THE Main_Agent SHALL 自动提取并写入 Memory_System（如"我对花生过敏"→ 饮食偏好记忆、"我每天 7 点起床"→ 作息习惯记忆）
4. THE Watch_OS SHALL 提供记忆查看界面，用户可浏览 Memory_System 中存储的记忆条目，按类别分组（健康数据、行为习惯、个人偏好、人际关系）
5. THE Watch_OS SHALL 支持用户在手表端清除指定记忆条目或按类别批量清除，清除操作通过 Phone_Bridge 同步到手机端
6. THE Memory_System SHALL 通过 Phone_Bridge 与手机端 Memory_System 保持双向同步：手表端产生的传感器记忆同步到手机端，手机端产生的对话记忆和行为记忆同步到手表端
7. THE Memory_System SHALL 区分记忆来源标签：手表传感器（sensor）、手表对话（watch_conversation）、手机同步（phone_sync），用户可按来源筛选查看
8. WHEN Memory_System 中的记忆影响了 Agent 的某次决策时，THE Agent SHALL 在回复中可选地标注"基于您的 [记忆类型] 记忆"，让用户理解 AI 为什么这样建议

---

### 需求 35：文档系统手表端

**用户故事：** 作为一名手表用户，我希望在手表上查看对话产出的文档摘要，并能通过语音追问已有文档，以便我随时获取对话的有价值产出。

#### 验收标准

1. THE Watch_OS SHALL 提供 Document_System 手表端精简视图，以列表形式展示文档标题、类型标签（会议纪要/周报/行程单/摘要）和创建时间
2. WHEN 用户点击文档列表中的某个文档时，THE Watch_OS SHALL 展示该文档的 AI 生成摘要（不超过 3 行），用户可通过表冠旋转查看更多内容
3. WHEN 手表端对话产出文档类产出物时，THE Watch_OS SHALL 自动通过 Phone_Bridge 将完整文档同步到手机端 Document_System，手表端仅保留摘要版本
4. THE Watch_OS SHALL 支持用户通过语音追问已有文档：用户在文档摘要界面说出问题（如"这次会议的待办事项有哪些"），Main_Agent 基于文档内容回答
5. WHEN 用户需要编辑文档内容或导出文档时，THE Watch_OS SHALL 通过 Phone_Bridge 将操作转发到手机端 Companion_App，并在手表端显示"已转至手机端"提示
6. THE Document_System SHALL 由 AI 自动按类型和时间组织文档，用户无需手动建文件夹
7. THE Document_System SHALL 通过 Phone_Bridge 与手机端 Document_System 保持双向同步：手机端新增的文档摘要自动同步到手表端列表
8. WHEN 用户在手表端对话中说"帮我写会议纪要"时，THE Main_Agent SHALL 生成文档并自动归入 Document_System，同时在 IM_Interface 中显示文档摘要预览和"查看完整文档请到手机端"提示


---

### 需求 36：融合设备中心（Wrist Control Center）

**用户故事：** 作为一名小米生态用户，我希望手表作为人车家全生态的统一控制中枢，在手腕上一站式管理手机、车辆和智能家居设备，以便我无需掏出手机就能掌控所有设备状态并快速操作。

#### 验收标准

1. THE Watch_OS SHALL 提供 Wrist_Control_Center 作为融合设备中心入口，以统一设备管理界面展示用户已连接的手机、车辆和智能家居设备列表及其实时状态
2. THE Wrist_Control_Center SHALL 由 IoT_Assistant 和 Car_Assistant 协同管理设备数据，Main_Agent 统一调度跨设备操作请求
3. WHEN 智能门锁的门铃被按下时，THE IoT_Assistant SHALL 在 2 秒内通过 Notification_Card 推送门口摄像头实时画面到手表屏幕，并提供"语音对讲"和"远程开门"操作按钮
4. WHILE 门锁摄像头画面显示中时，THE Watch_OS SHALL 支持用户通过手表麦克风和扬声器与门口访客进行语音对讲
5. THE Wrist_Control_Center SHALL 支持手机相机远程控制功能，用户从手表端触发手机拍照、切换前后摄像头和查看实时取景画面
6. THE Wrist_Control_Center SHALL 将各设备类型的关键状态聚合到 Quick_Card：智能家居状态卡片（在家设备数/异常设备数）、车辆状态卡片（电量/锁定状态）、手机状态卡片（电量/静音状态）
7. THE Wrist_Control_Center SHALL 支持将常用设备控制绑定到 Complication，用户在表盘即可一瞥设备状态并一点触发控制（如客厅灯开关、车辆锁定状态）
8. WHEN 用户通过语音对 Main_Agent 说出跨设备指令（如"把客厅灯关了然后锁车"）时，THE Main_Agent SHALL 协调 IoT_Assistant 和 Car_Assistant 依次执行，并在 Wrist_Raise_Layer 统一反馈执行结果
9. THE Wrist_Control_Center SHALL 支持 EMG_Gesture 快捷控制：用户可将特定 EMG 手势绑定到常用设备操作（如甩手腕开关客厅灯），实现免触控设备控制
10. THE Wrist_Control_Center SHALL 支持设备异常主动告警：WHEN IoT_Assistant 检测到智能家居设备异常（如烟雾报警器触发、门窗传感器异常开启）时，THE Watch_OS SHALL 以 critical 紧急程度通过振动 + Notification_Card 立即通知用户
11. THE Wrist_Control_Center SHALL 通过 Phone_Bridge 与手机端 HyperConnect 生态保持设备列表和状态的双向同步，手表端新增的设备控制快捷方式同步到手机端

---

### 需求 37：eSIM 独立通信与离线 Agent 能力

**用户故事：** 作为一名手表用户，我希望手表支持 eSIM 独立通信，在不携带手机时仍能接打电话、收发消息，并且 Agent 能通过 eSIM 数据连接访问云端 LLM 保持智能化服务，以便我在跑步、游泳等无手机场景下仍能获得完整的 Agentic OS 体验。

#### 验收标准

1. THE Watch_OS SHALL 支持 eSIM_Module 独立通信功能，在无配对手机连接时仍可独立接打电话和收发短信
2. WHILE Watch_Device 处于 eSIM 独立模式（无手机连接）时，THE Main_Agent SHALL 通过 eSIM 数据连接访问云端 LLM，保持完整的对话理解和任务处理能力
3. WHILE Watch_Device 处于 eSIM 独立模式时，THE Communication_Assistant SHALL 独立处理来电和消息通知，提供与手机连接模式一致的来电上下文信息和智能回复能力
4. IF Watch_Device 处于无手机连接且无 eSIM 数据连接的完全离线状态，THEN THE Main_Agent SHALL 切换到本地 Agent 模式，使用设备端轻量模型处理基础指令（闹钟、计时器、运动启停、传感器数据查看、EMG 手势响应）
5. WHILE Watch_Device 处于完全离线状态时，THE Watch_OS SHALL 在 Status_Bar 显示离线图标，并在用户尝试需要网络的操作时提示"当前处于离线模式，部分功能受限"
6. THE Power_Manager SHALL 为 eSIM 独立模式提供专属功耗管理策略：eSIM 蓝牙版续航目标 21 天，eSIM 通信版续航目标 14 天，通过动态调整 eSIM 模块的活跃周期和数据同步频率实现
7. WHEN Watch_Device 从离线状态恢复到 eSIM 数据连接或手机连接时，THE Watch_OS SHALL 自动将离线期间缓存的 Fragment、传感器数据和操作日志同步到云端和手机端 Session
8. THE Watch_OS SHALL 支持 eSIM 模式下的独立导航能力，利用 Dual_Freq_GNSS 和离线地图缓存，Schedule_Assistant 在无手机时仍可提供基础导航指引
9. WHILE Watch_Device 处于 eSIM 独立模式时，THE Watch_OS SHALL 支持通过 eSIM 数据连接独立控制 IoT 设备和查询车辆状态，无需通过 Phone_Bridge 中转
10. THE Watch_OS SHALL 在设置中提供 eSIM 管理界面，支持 eSIM 激活、运营商选择和套餐查看，复杂的 eSIM 配置操作通过 Phone_Bridge 转发到 Companion_App 完成


---

### 需求 38：Agent OS Harness 七层架构

**用户故事：** 作为一名系统架构师，我希望 Agent OS 具备一套完整的七层架构底座（感知→上下文→意图→调度→执行→表现→开放），定义 Agent 能感知什么、能做什么、怎么做、做完怎么反馈，以便所有 Agent 场景都能在统一的基础设施上运行。

#### 验收标准

**感知层（Sensing Layer）**

1. THE Sensing_Layer SHALL 统一管理三类传感器数据源：生理传感器（心率、血氧、体温、ECG、皮电）、运动传感器（加速度、陀螺仪、步态识别、跌倒检测）、环境传感器（GPS、气压、环境光、麦克风）
2. THE Sensing_Layer SHALL 采集系统状态事件：佩戴/摘下、充电状态、屏幕亮灭、手机连接状态，并将系统状态作为 Agent 上下文输入
3. THE SensingBus SHALL 提供事件订阅接口 subscribe(sensor, trigger, priority, callback)，支持 Agent 按需订阅传感器事件流
4. THE SensingBus SHALL 支持最大并发订阅数≤16，从传感器采集到事件分发的延迟≤50ms
5. THE Sensing_Layer SHALL 实现数据访问分级：公开级（步数、天气等非敏感数据）、敏感级（心率、位置等个人数据）、医疗级（ECG、血氧等健康数据），不同级别数据需要不同权限才能访问
6. WHILE Sensing_Layer 处于活跃采集状态时，THE Power_Manager SHALL 确保传感器总功耗≤2%电量/小时

**上下文层（Context Layer）**

7. THE Context_Layer SHALL 融合多维传感器数据推断用户当前状态，覆盖五个维度：活动状态（静坐/步行/跑步/骑行/驾驶/睡眠）、位置语义（家/公司/商场/地铁/户外）、生理状态（正常/压力高/疲劳/运动中）、社交状态（会议中/独处/通话中）、设备状态（充电/低电量/离线/运动模式）
8. THE Context_Layer SHALL 提供 Context.get() 查询接口，返回当前上下文的结构化快照，供所有 Agent 调用
9. THE Context_Layer SHALL 达到以下推断精度：活动识别≥95%、睡眠阶段识别≥85%、位置语义识别≥90%
10. THE Context_Layer SHALL 确保所有上下文推断在本地完成计算，原始传感器数据不出设备，保护用户隐私

**调度层（Orchestration Layer）**

11. THE Orchestration_Layer SHALL 支持四级 Agent 优先级：P0 紧急（SOS、跌倒检测、心率异常）、P1 高优（来电、导航转向、运动心率越界）、P2 普通（日程提醒、消息通知、IoT 场景）、P3 低优（健康洞察、运动建议、消费摘要）
12. THE Orchestration_Layer SHALL 执行冲突裁决规则：同时只有 1 个 Agent 占全屏，胶囊和卡片形态最多同时显示 2 个，其余按优先级排队
13. THE Orchestration_Layer SHALL 实现跨设备路由策略：本地优先（端侧可处理的意图在本地执行）→手机（需要手机能力的路由到手机）→云端（需要大模型推理的路由到云端）→降级兜底（全部不可用时使用规则引擎）
14. THE Orchestration_Layer SHALL 为每个 Agent 分配资源配额：单 Agent CPU 占用≤20%、内存占用≤32MB，超出配额的 Agent 被强制挂起
15. THE Orchestration_Layer SHALL 管理 Agent 生命周期：注册→唤醒→运行→挂起→销毁，Agent 崩溃时实现进程隔离不影响其他 Agent 和系统稳定性

**执行层（Execution Layer）**

16. THE Execution_Layer SHALL 提供统一的 Action 能力库，覆盖七大类操作：通讯（发消息/打电话/发通知）、时间（创建日程/设闹钟/设计时器）、出行（启动导航/叫车/查路线）、支付（调起支付码/NFC支付）、媒体（播放音乐/控制音量）、家居（控制IoT设备/触发场景）、Agent间（调用其他Agent能力/共享数据）
17. THE Execution_Layer SHALL 实现权限分级执行：静默执行（低风险操作如查询天气）、轻确认（中风险操作如发消息，展示预览一点确认）、生物认证（高风险操作如支付，需 PIN 码或指纹）、手机二次确认（极高风险操作如大额支付、远程开门锁）
18. THE Execution_Layer SHALL 保证所有 Action 的幂等性（重复执行不产生副作用），并在 Action 执行后 10 秒内提供撤销入口

---

### 需求 39：端侧 LLM 与意图路由

**用户故事：** 作为一名手表用户，我希望手表具备端侧 LLM 推理能力，能在本地快速理解我的意图并路由到正确的 Agent 执行，离线时也能通过规则引擎处理高频意图，以便我在任何网络条件下都能获得快速响应。

#### 验收标准

1. THE Intent_Layer SHALL 支持端侧部署≤1B 参数的轻量 LLM，首 token 生成延迟≤300ms
2. THE Intent_Layer SHALL 支持三种意图来源：用户主动（语音指令/手势操作/按键触发）、系统触发（上下文变化如到达某地、心率异常）、Agent 委托（Agent 间任务转发）
3. THE Intent_Layer SHALL 实现基于置信度的意图路由规则：
   - 置信度≥0.85：直接执行，无需用户确认
   - 置信度 0.6-0.85：展示确认卡片，用户一点确认后执行
   - 置信度<0.6：请求用户澄清意图，提供 2-3 个候选意图供选择
4. THE Intent_Layer SHALL 保留最近 5 轮对话上下文，支持多轮意图理解（如用户先说"明天的天气"，再说"那后天呢"能正确理解为查询后天天气）
5. IF Watch_Device 处于完全离线状态且端侧 LLM 不可用，THEN THE Intent_Layer SHALL 切换到规则引擎降级模式，通过预定义规则匹配处理 Top 20 高频意图（闹钟、计时器、运动启停、音乐控制、手电筒、勿扰模式、查看心率、查看步数、查看天气缓存、导航缓存、来电接听/挂断、消息快捷回复、IoT 场景触发、SOS 紧急呼叫、支付码调起、表盘切换、亮度调节、音量调节、省电模式、蓝牙开关）
6. THE Intent_Layer SHALL 支持意图消歧：WHEN 同一语音指令可能匹配多个 Agent 的能力时，THE Intent_Layer SHALL 结合 Context_Layer 的当前上下文选择最合适的 Agent 处理（如用户在运动中说"暂停"优先匹配 Sport_Assistant 而非音乐控制）
7. THE On_Device_LLM SHALL 支持模型热更新，通过 Phone_Bridge 在 Wi-Fi 环境下增量更新模型权重，无需重启系统
8. THE Intent_Layer SHALL 记录所有意图识别的置信度和最终执行结果到 Memory_System，用于持续优化意图识别准确率

---

### 需求 40：三方 Agent 开放平台

**用户故事：** 作为一名三方开发者，我希望能在 Agent OS 开放平台上开发和发布 Agent，通过标准化接口接入感知层事件、调用 Action 能力库、使用标准 UI 组件，同时系统通过沙箱隔离和 API 分级审核保障安全，以便我为手表用户提供丰富的三方 Agent 服务。

#### 验收标准

**三方 Agent 能力边界**

1. THE Platform_Layer SHALL 允许三方 Agent 执行以下操作：注册意图处理器（声明可处理的意图类型）、订阅 Sensing_Layer 公开级和敏感级事件（需用户授权）、调用 Execution_Layer 的 Action 能力库、使用 Presentation_Layer 的标准 UI 组件（胶囊/卡片/全屏页）
2. THE Platform_Layer SHALL 禁止三方 Agent 执行以下操作：直接访问传感器硬件（必须通过 Sensing_Layer 接口）、访问其他 Agent 的私有数据、绕过 Orchestration_Layer 直接执行操作、访问医疗级传感器数据（除非通过高级 API 审核）

**沙箱隔离**

3. THE Platform_Layer SHALL 为每个三方 Agent 提供进程级沙箱隔离，三方 Agent 崩溃不影响系统 Agent 和其他三方 Agent 的运行
4. THE Platform_Layer SHALL 限制三方 Agent 的网络访问：仅允许 HTTPS 协议，且目标域名必须在开发者注册时声明的白名单内
5. THE Platform_Layer SHALL 禁止三方 Agent 将原始传感器数据传输出设备，三方 Agent 仅可获取经 Context_Layer 加工后的上下文快照

**API 分级审核**

6. THE Platform_Layer SHALL 实现三级 API 访问权限：
   - 基础级（自动审核）：天气查询、计时器、闹钟等低风险 Tool 调用，标准 UI 组件使用
   - 标准级（人工审核）：Sensing_Layer 敏感级数据订阅、Communication_Assistant 消息发送、IoT 设备控制
   - 高级级（安全专项审核）：医疗级传感器数据访问、支付相关 Action 调用、紧急操作（SOS）触发
7. THE Platform_Layer SHALL 为三方 Agent 提供标准化接入流程：开发者注册→能力声明→API 权限申请→沙箱测试→审核上架→用户安装
8. THE Platform_Layer SHALL 支持三方 Agent 的版本管理和热更新，通过 Agent_Store 分发更新，用户可选择自动更新或手动确认
9. THE Platform_Layer SHALL 为三方 Agent 提供运行时监控：CPU 使用率、内存占用、网络请求频率和电量消耗，超出配额时自动限流或挂起
10. THE Platform_Layer SHALL 支持用户对三方 Agent 的权限管理：用户可在设置中查看每个三方 Agent 已获取的权限，并可随时撤销任意权限
