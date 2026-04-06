# Orb Menu Hub — 需求文档

## 简介

Orb Menu Hub 是 Q95 Pro 智能眼镜系统的一项交互升级功能。该功能移除现有的底部导航菜单栏（demo-nav-bar），将所有应用导航和菜单入口整合到 Smart_Task_Zone 中的 AI_Status_Orb（状态球）内。用户通过注视 AI_Status_Orb 触发菜单展开，实现"注视即展开"的自然交互模式，使视野更加清爽，交互更加沉浸。

## 术语表

- **AI_Status_Orb**: 语音助手状态球，Smart_Task_Zone 中的核心视觉元素，升级后同时承载菜单导航入口功能
- **Orb_Menu**: 从 AI_Status_Orb 展开的环形/扇形菜单面板，包含所有应用导航入口
- **Menu_Item**: Orb_Menu 中的单个应用导航入口，包含图标和标签
- **Bottom_Nav_Bar**: 旧版底部导航菜单栏（demo-nav-bar），本次需求中将被移除
- **Smart_Task_Zone**: 智能任务区，位于屏幕左上角的常驻区域，包含 AI_Status_Orb
- **Gaze_Detection**: 注视检测，通过眼动追踪或头部朝向判断用户是否正在注视某个 UI 区域
- **Gaze_To_Expand**: 注视展开交互模式，用户注视目标元素一定时间后触发展开动作
- **Orb_Menu_State_Machine**: Orb 菜单状态机，管理菜单从收起到展开的完整生命周期
- **Radial_Layout**: 环形布局，菜单项围绕 AI_Status_Orb 呈放射状排列的布局方式
- **Side_Touchpad**: 眼镜腿侧边触控板，支持滑动和点击操作
- **EMG_Band**: EMG 手环或手表，通过肌电信号识别手势
- **System_UI**: Q95 Pro 的系统级交互界面
- **Main_Task_Area**: 主任务区，屏幕中央的主要内容显示区域

## 需求

### 需求 1：移除底部导航菜单栏

**用户故事：** 作为用户，我希望底部导航菜单栏被移除，以便获得更清爽、更沉浸的视野体验。

#### 验收标准

1. THE System_UI SHALL 移除底部导航菜单栏（Bottom_Nav_Bar），不再在屏幕底部显示任何固定导航元素
2. WHEN Bottom_Nav_Bar 被移除后, THE Main_Task_Area SHALL 扩展占据原底部导航栏所占的空间
3. THE System_UI SHALL 将原 Bottom_Nav_Bar 中的所有导航入口（主页、通知、导航、相机、音乐、AI、翻译、提词、健康、消息、设置）迁移到 Orb_Menu 中
4. WHEN 用户从旧版本升级后, THE System_UI SHALL 确保所有原有导航功能均可通过 Orb_Menu 访问，无功能缺失

### 需求 2：AI_Status_Orb 菜单触发交互

**用户故事：** 作为用户，我希望通过注视 AI_Status_Orb 来触发菜单展开，以便用自然的注视交互方式访问所有应用导航。

#### 验收标准

1. WHEN Gaze_Detection 检测到用户注视 AI_Status_Orb 超过 0.8 秒时, THE AI_Status_Orb SHALL 显示视觉提示（光晕扩散动效），表示菜单即将展开
2. WHEN AI_Status_Orb 显示展开提示后用户继续注视超过 0.3 秒时, THE Orb_Menu SHALL 在 300ms 内完成展开动画并显示所有菜单项
3. WHEN 用户通过 Side_Touchpad 单击 AI_Status_Orb 时, THE Orb_Menu SHALL 立即展开，跳过注视等待阶段
4. WHEN 用户通过 EMG_Band 捏合手势确认时, THE Orb_Menu SHALL 立即展开，跳过注视等待阶段
5. WHILE AI_Status_Orb 处于展开提示状态时, THE AI_Status_Orb SHALL 保持原有 AI 状态指示（空闲、聆听、思考、响应）的视觉表达不被覆盖
6. IF Gaze_Detection 在展开提示阶段检测到用户视线移开, THEN THE AI_Status_Orb SHALL 取消展开提示并恢复为默认状态

### 需求 3：Orb_Menu 环形菜单布局

**用户故事：** 作为用户，我希望菜单项围绕 AI_Status_Orb 以环形方式展开，以便快速定位和选择目标应用。

#### 验收标准

1. THE Orb_Menu SHALL 以 Radial_Layout 方式围绕 AI_Status_Orb 展开，菜单项沿弧形均匀分布
2. THE Orb_Menu SHALL 支持展示不超过 11 个 Menu_Item（主页、通知、导航、相机、音乐、AI、翻译、提词、健康、消息、设置）
3. THE Menu_Item SHALL 包含应用图标和应用名称标签，图标尺寸统一，标签文字清晰可读
4. THE Orb_Menu SHALL 根据屏幕左上角的位置约束，将菜单项分布在 AI_Status_Orb 的右侧和下方可用区域（约 90° 至 270° 弧度范围）
5. THE Orb_Menu SHALL 确保相邻 Menu_Item 之间有足够间距，避免注视选择时的误触
6. WHILE Orb_Menu 展开时, THE Orb_Menu SHALL 以半透明毛玻璃背景显示，保证用户能同时感知现实环境
7. THE Orb_Menu SHALL 确保展开后的菜单面板不超出 Display_Panel 的可视区域边界

### 需求 4：菜单项选择与应用启动

**用户故事：** 作为用户，我希望在 Orb_Menu 展开后能通过注视或手势选择菜单项并启动对应应用，以便快速切换功能。

#### 验收标准

1. WHEN 用户注视某个 Menu_Item 超过 0.5 秒时, THE Menu_Item SHALL 显示高亮选中状态（边框发光 + 图标放大动效）
2. WHEN Menu_Item 处于高亮状态且用户通过点头确认时, THE System_UI SHALL 在 500ms 内启动对应应用并关闭 Orb_Menu
3. WHEN Menu_Item 处于高亮状态且用户通过 EMG_Band 捏合确认时, THE System_UI SHALL 在 500ms 内启动对应应用并关闭 Orb_Menu
4. WHEN Menu_Item 处于高亮状态且用户通过 Side_Touchpad 单击确认时, THE System_UI SHALL 在 500ms 内启动对应应用并关闭 Orb_Menu
5. WHEN 用户视线从高亮 Menu_Item 移开时, THE Menu_Item SHALL 在 200ms 内恢复为默认状态
6. IF 应用启动失败, THEN THE System_UI SHALL 在 Orb_Menu 中显示错误提示并保持菜单展开状态，允许用户重试或选择其他应用

### 需求 5：Orb_Menu 收起交互

**用户故事：** 作为用户，我希望菜单能在不需要时自动收起，以便恢复清爽的视野。

#### 验收标准

1. WHEN 用户视线移开 Orb_Menu 区域超过 2 秒时, THE Orb_Menu SHALL 自动执行收起动画并恢复为仅显示 AI_Status_Orb
2. WHEN 用户通过摇头手势时, THE Orb_Menu SHALL 立即执行收起动画
3. WHEN 用户通过 Side_Touchpad 侧滑手势时, THE Orb_Menu SHALL 立即执行收起动画
4. WHEN 用户成功选择并启动应用后, THE Orb_Menu SHALL 自动收起
5. THE Orb_Menu 收起动画 SHALL 在 250ms 内完成，菜单项按从外到内的顺序依次消失

### 需求 6：Orb_Menu 状态机与 Smart_Task_Zone 集成

**用户故事：** 作为开发者，我希望 Orb_Menu 的状态机与现有 Smart_Task_Zone 状态机协调工作，以便两者不产生交互冲突。

#### 验收标准

1. THE Orb_Menu_State_Machine SHALL 定义以下状态：orb_idle（收起态）、orb_hint（展开提示态）、orb_menu_open（菜单展开态）、orb_item_focused（菜单项聚焦态）
2. WHILE Smart_Task_Zone 处于 expanded 状态（任务详情展开）时, THE Orb_Menu SHALL 禁止展开，注视 AI_Status_Orb 不触发菜单展开提示
3. WHILE Orb_Menu 处于 orb_menu_open 状态时, THE Smart_Task_Zone SHALL 禁止进入 confirm_prompt 或 expanded 状态
4. WHEN Orb_Menu 从 orb_menu_open 收起后, THE Smart_Task_Zone SHALL 恢复正常的注视触发行为
5. THE Orb_Menu_State_Machine SHALL 在状态转换时发出事件通知，供其他模块监听和响应
6. IF Orb_Menu 和 Smart_Task_Zone 同时收到展开请求, THEN THE System_UI SHALL 优先响应最近一次用户注视的目标区域

### 需求 7：展开/收起动画与视觉反馈

**用户故事：** 作为用户，我希望菜单的展开和收起有流畅的科幻风格动画，以便获得未来感的交互体验。

#### 验收标准

1. WHEN Orb_Menu 展开时, THE Menu_Item SHALL 从 AI_Status_Orb 中心位置沿径向依次弹出，每个菜单项之间有 30ms 的延迟
2. THE Orb_Menu 展开动画 SHALL 使用 cubic-bezier(0.34, 1.56, 0.64, 1) 缓动曲线，产生轻微弹性效果
3. WHILE Orb_Menu 展开过程中, THE AI_Status_Orb SHALL 显示光环扩散效果，光环颜色与当前 AI 状态颜色一致
4. WHEN Orb_Menu 收起时, THE Menu_Item SHALL 按从外到内的顺序依次收回 AI_Status_Orb 中心，每个菜单项之间有 20ms 的延迟
5. WHILE 用户注视某个 Menu_Item 时, THE Menu_Item SHALL 显示科幻风格的聚焦光效（边框发光 + 微粒子效果）
6. THE Orb_Menu 所有动画 SHALL 保持 60fps 的流畅度，动画过程中不产生可感知的卡顿

### 需求 8：Orb_Menu 当前应用指示

**用户故事：** 作为用户，我希望在 Orb_Menu 中能看到当前正在使用的应用标识，以便快速了解自己所处的功能模块。

#### 验收标准

1. WHILE 某个应用处于活跃状态时, THE Orb_Menu 中对应的 Menu_Item SHALL 显示活跃指示标记（如底部小圆点或边框高亮）
2. WHILE AI_Status_Orb 处于收起态（orb_idle）时, THE AI_Status_Orb SHALL 在外圈显示一个微弱的弧形指示器，标识当前活跃应用的方位
3. WHEN 用户切换应用后, THE Orb_Menu 中的活跃指示标记 SHALL 在 200ms 内更新到新的活跃应用
