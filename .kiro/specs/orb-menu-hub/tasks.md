# 实施计划：Orb Menu Hub

## 概述

将 Q95 Pro 智能眼镜的应用导航从底部导航栏迁移至 AI_Status_Orb 环形菜单。从底层布局算法和状态机服务开始，逐步构建 UI 组件，最后在 App.tsx 中完成集成和接线。使用 TypeScript + React，复用现有 NavigationEngine 路由数据，通过双向互斥锁与 SmartTaskZone 协调。

## 任务

- [x] 1. 环形布局算法与类型定义
  - [x] 1.1 创建环形布局工具模块
    - 创建 `src/utils/radialLayout.ts`
    - 实现 `RadialLayoutConfig`、`RadialPosition` 接口
    - 实现 `calculateRadialPositions(config)` 函数：根据极坐标算法在 startAngle(90°) 到 endAngle(270°) 弧度范围内均匀分布菜单项位置
    - 实现 `clampToViewport(positions, itemSize, viewport)` 函数：确保所有位置不超出可视区域边界
    - _需求: 3.1, 3.4, 3.7_

  - [x] 1.2 编写环形布局算法的属性测试
    - 创建 `src/utils/radialLayout.property.test.ts`
    - 测试属性：对于任意 itemCount(1-11)，calculateRadialPositions 返回的位置数量等于 itemCount
    - 测试属性：所有返回位置的 angle 值在 [startAngle, endAngle] 范围内
    - 测试属性：相邻菜单项之间的角度间距均匀（误差 < 0.01）
    - 测试属性：clampToViewport 后所有位置在 viewport 边界内
    - **验证需求: 3.1, 3.4, 3.5, 3.7**

  - [x] 1.3 编写环形布局算法的单元测试
    - 创建 `src/utils/radialLayout.test.ts`
    - 测试 11 个菜单项的标准布局场景
    - 测试边界情况：1 个菜单项、0 个菜单项
    - 测试 clampToViewport 对超出边界位置的修正
    - _需求: 3.1, 3.4, 3.7_

- [x] 2. OrbMenuStateMachine 核心状态机服务
  - [x] 2.1 实现 OrbMenuStateMachine 服务
    - 创建 `src/services/OrbMenuStateMachine.ts`
    - 定义 `OrbMenuState` 类型：'orb_idle' | 'orb_hint' | 'orb_menu_open' | 'orb_item_focused'
    - 定义 `OrbMenuEvent` 联合类型：GAZE_ORB_START、GAZE_ORB_END、GAZE_HINT_CONFIRM、QUICK_OPEN、GAZE_ITEM、GAZE_ITEM_END、CONFIRM_SELECT、DISMISS、APP_LAUNCH_FAILED
    - 定义 `OrbMenuCallbacks` 接口：onStateChange、onHintStart、onMenuOpen、onMenuClose、onItemFocused、onItemUnfocused、onAppLaunch、onAppLaunchError
    - 实现 `OrbMenuStateMachine` 类：
      - constructor 接收 callbacks、SmartTaskZoneService、NavigationEngine
      - `send(event)` 方法处理所有状态转换
      - 内部注视计时器：0.8s hint、0.3s confirm、0.5s item focus、2s gaze away
      - `getState()`、`getFocusedItem()`、`isMenuBlocked()`、`dispose()` 方法
      - 通过 `smartTaskZone.getState()` 检查互斥条件：STZ 处于 expanded 时阻止展开
      - 状态变更时调用 `smartTaskZone.setOrbMenuLock()` 锁定/解锁
      - CONFIRM_SELECT 事件时通过 NavigationEngine.navigate() 启动应用
      - APP_LAUNCH_FAILED 事件时保持菜单展开并通知错误
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 2.2 编写 OrbMenuStateMachine 的属性测试
    - 创建 `src/services/OrbMenuStateMachine.property.test.ts`
    - 测试属性：初始状态始终为 orb_idle
    - 测试属性：从 orb_idle 发送 GAZE_ORB_START 后等待 0.8s 进入 orb_hint（当 STZ 非 expanded 时）
    - 测试属性：当 STZ 处于 expanded 时，任何展开事件不改变 orb_idle 状态（互斥锁）
    - 测试属性：orb_menu_open 状态下 DISMISS 事件始终回到 orb_idle
    - 测试属性：CONFIRM_SELECT 事件在 orb_item_focused 状态下触发应用启动并回到 orb_idle
    - **验证需求: 2.1, 2.2, 2.6, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3**

  - [x] 2.3 编写 OrbMenuStateMachine 的单元测试
    - 创建 `src/services/OrbMenuStateMachine.test.ts`
    - 测试完整状态转换路径：orb_idle → orb_hint → orb_menu_open → orb_item_focused → orb_idle
    - 测试 QUICK_OPEN 跳过 hint 直接展开
    - 测试 GAZE_ORB_END 在 hint 阶段取消展开
    - 测试 gaze away 2s 自动收起
    - 测试 head_shake、side_swipe 立即收起
    - 测试 APP_LAUNCH_FAILED 保持菜单展开
    - 测试 callbacks 在各状态转换时正确触发
    - 测试 dispose() 清理所有计时器
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_

- [x] 3. SmartTaskZone 互斥锁扩展
  - [x] 3.1 扩展 SmartTaskZoneService 添加互斥锁
    - 修改 `src/services/SmartTaskZone.ts`
    - 新增 `private orbMenuLocked: boolean = false` 属性
    - 新增 `setOrbMenuLock(locked: boolean): void` 方法
    - 新增 `isOrbMenuLocked(): boolean` 方法
    - 修改 `onGazeEvent()` 方法：当 `orbMenuLocked === true` 时阻止 compact → confirm_prompt 转换
    - 确保现有所有测试继续通过
    - _需求: 6.2, 6.3, 6.4_

  - [x] 3.2 编写互斥锁的单元测试
    - 在 `src/services/SmartTaskZone.test.ts` 中新增测试用例
    - 测试 setOrbMenuLock(true) 后 onGazeEvent 不触发 confirm_prompt
    - 测试 setOrbMenuLock(false) 后恢复正常注视触发
    - 测试 isOrbMenuLocked() 返回正确状态
    - _需求: 6.2, 6.3, 6.4_

- [x] 4. 检查点 — 确保所有测试通过
  - 运行 `npm run test` 确保所有现有测试和新增测试通过，有问题请询问用户。

- [x] 5. OrbMenuItem 菜单项组件
  - [x] 5.1 实现 OrbMenuItem 组件
    - 创建 `src/components/smart-task/OrbMenuItem.tsx`
    - 定义 `OrbMenuItemData` 接口：id、icon、label、route
    - 定义 `OrbMenuItemProps` 接口：item、position、isFocused、isActive、animationDelay、menuState
    - 实现菜单项渲染：图标 + 名称标签，统一尺寸
    - 实现聚焦高亮状态：边框发光 + 图标放大动效（CSS transition）
    - 实现活跃应用指示：底部小圆点标记
    - 实现展开/收起动画：根据 animationDelay 设置 CSS transition-delay，展开时 30ms 间隔、收起时 20ms 间隔
    - 使用 cubic-bezier(0.34, 1.56, 0.64, 1) 弹性缓动曲线
    - _需求: 3.3, 4.1, 4.5, 7.1, 7.2, 7.4, 7.5, 8.1, 8.3_

  - [x] 5.2 编写 OrbMenuItem 的单元测试
    - 创建 `src/components/smart-task/OrbMenuItem.test.ts`
    - 测试默认渲染包含图标和标签
    - 测试 isFocused=true 时应用高亮样式
    - 测试 isActive=true 时显示活跃指示标记
    - 测试 animationDelay 正确应用到 CSS transition-delay
    - _需求: 3.3, 4.1, 7.1, 8.1_

- [x] 6. OrbMenuView 菜单容器组件
  - [x] 6.1 实现 OrbMenuView 组件
    - 创建 `src/components/smart-task/OrbMenuView.tsx`
    - 定义 `OrbMenuViewProps` 接口：menuState、menuItems、focusedItemId、activeAppId、orbPosition、onGazeItem、onGazeItemEnd、onConfirmSelect
    - 调用 `calculateRadialPositions()` 计算 11 个菜单项的位置
    - 渲染半透明毛玻璃背景（backdrop-filter: blur）
    - 根据 menuState 控制展开/收起：orb_menu_open 或 orb_item_focused 时显示，orb_idle/orb_hint 时隐藏
    - 渲染 OrbMenuItem 列表，传递位置、聚焦、活跃状态
    - 展开动画：菜单项从 Orb 中心沿径向弹出，30ms 延迟递增
    - 收起动画：菜单项从外到内收回，20ms 延迟递增，250ms 内完成
    - _需求: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 5.5, 7.1, 7.2, 7.4, 7.6_

  - [x] 6.2 编写 OrbMenuView 的单元测试
    - 创建 `src/components/smart-task/OrbMenuView.test.ts`
    - 测试 menuState='orb_menu_open' 时渲染所有 11 个菜单项
    - 测试 menuState='orb_idle' 时不渲染菜单项
    - 测试 focusedItemId 正确传递给对应 OrbMenuItem
    - 测试毛玻璃背景样式存在
    - _需求: 3.1, 3.2, 3.6_

- [x] 7. AIStatusOrb 组件扩展
  - [x] 7.1 扩展 AIStatusOrb 支持 Orb Menu 状态
    - 修改 `src/components/smart-task/AIStatusOrb.tsx`
    - 扩展 `AIStatusOrbProps` 接口：新增 orbMenuState?、activeAppId?、onGazeStart?、onGazeEnd?
    - orb_hint 状态时：在 Orb 外圈添加光晕扩散动效（新增 CSS keyframe orb-hint-glow）
    - orb_menu_open 状态时：显示光环扩散效果，颜色与当前 AI 状态颜色一致
    - orb_idle 状态且 activeAppId 存在时：在外圈显示微弱弧形指示器，标识当前活跃应用方位
    - 保持原有 4 种 AI 状态（idle/listening/thinking/responding）的视觉表达不被覆盖
    - _需求: 2.1, 2.5, 7.3, 8.2_

  - [x] 7.2 编写 AIStatusOrb 扩展的单元测试
    - 在 `src/components/smart-task/AIStatusOrb.test.ts` 中新增测试用例
    - 测试 orbMenuState='orb_hint' 时存在光晕动效元素
    - 测试 orbMenuState='orb_menu_open' 时存在光环扩散元素
    - 测试 activeAppId 存在时显示弧形指示器
    - 测试原有 AI 状态视觉表达在 orbMenuState 变化时不受影响
    - _需求: 2.1, 2.5, 7.3, 8.2_

- [x] 8. 检查点 — 确保所有测试通过
  - 运行 `npm run test` 确保所有现有测试和新增测试通过，有问题请询问用户。

- [x] 9. SmartTaskZoneView 集成 OrbMenuView
  - [x] 9.1 修改 SmartTaskZoneView 集成 OrbMenu
    - 修改 `src/components/smart-task/SmartTaskZoneView.tsx`
    - 新增 props：orbMenuState、orbMenuItems、focusedItemId、activeAppId、onGazeItem、onGazeItemEnd、onConfirmSelect、onOrbGazeStart、onOrbGazeEnd
    - 在 SmartTaskZoneView 内部渲染 OrbMenuView 组件
    - 将 orbMenuState 和相关 props 传递给 AIStatusOrb 和 OrbMenuView
    - 确保 OrbMenuView 的定位相对于 AIStatusOrb 正确
    - _需求: 1.3, 3.1, 6.5_

  - [x] 9.2 编写 SmartTaskZoneView 集成测试
    - 在 `src/components/smart-task/SmartTaskZoneView.test.ts` 中新增测试用例
    - 测试传入 orbMenuState='orb_menu_open' 时 OrbMenuView 被渲染
    - 测试 orbMenuState 未传入时不渲染 OrbMenuView（向后兼容）
    - _需求: 1.3, 6.5_

- [x] 10. App.tsx 集成：移除底部导航栏 + 接线 OrbMenu
  - [x] 10.1 移除底部导航栏并接线 OrbMenu 状态
    - 修改 `src/App.tsx`
    - 移除 `demo-nav-bar-outer` 及其内部的 `demo-nav-bar` 导航栏 JSX
    - 移除 `NAV_ITEMS` 常量（菜单项数据改为从 AVAILABLE_ROUTES 生成）
    - 新增 OrbMenuStateMachine 实例化：传入 SmartTaskZoneService 和 NavigationEngine
    - 新增 React state 管理：orbMenuState、focusedItemId、activeAppId
    - 将 OrbMenuStateMachine 的 callbacks 连接到 React state 更新
    - 从 AVAILABLE_ROUTES 生成 OrbMenuItemData 列表（11 个菜单项：主页、通知、导航、相机、音乐、AI、翻译、提词、健康、消息、设置），为每个路由配置 icon 和 label
    - 将 orbMenuState、menuItems、focusedItemId、activeAppId 等 props 传递给 SmartTaskZoneView
    - 将 activeView 切换逻辑连接到 OrbMenuStateMachine 的 onAppLaunch callback
    - Main_Task_Area 扩展占据原底部导航栏空间（调整 CSS）
    - _需求: 1.1, 1.2, 1.3, 1.4, 3.2, 8.3_

  - [x] 10.2 编写 App 集成的单元测试
    - 在现有测试文件中新增或创建 `src/App.test.ts`
    - 测试底部导航栏不再渲染（不存在 demo-nav-bar 元素）
    - 测试 OrbMenuView 在 SmartTaskZoneView 内被渲染
    - 测试所有 11 个导航入口在 OrbMenu 中可访问
    - _需求: 1.1, 1.3, 1.4_

- [x] 11. 最终检查点 — 确保所有测试通过
  - 运行 `npm run test` 确保所有现有 1001+ 测试和新增测试全部通过，有问题请询问用户。

## 备注

- 标记 `*` 的子任务为可选，可跳过以加速 MVP 交付
- 每个任务引用具体需求编号以确保可追溯性
- 检查点确保增量验证，避免问题累积
- 属性测试验证通用正确性属性，单元测试验证具体场景和边界情况
- 所有动画相关实现使用 CSS Transitions + requestAnimationFrame，确保 60fps 流畅度
- 修改现有文件时需确保原有 1001 个测试继续通过
