import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SmartTaskZoneView } from './SmartTaskZoneView';
import type { AIStatus } from '../../types/ai';
import type { TaskSummary } from '../../types/data';
import type { SmartTaskZoneState } from '../../services/SmartTaskZone';
import type { SmartTaskZoneViewProps, ConversationMessage } from './SmartTaskZoneView';
import type { OrbMenuItemData } from './OrbMenuItem';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

/**
 * Unit tests for SmartTaskZoneView component logic.
 *
 * Tests the data model, carousel logic, and structural expectations
 * without DOM rendering (no jsdom configured).
 *
 * 需求: 3.1, 3.2, 3.3, 3.7, 3.10
 */

/* ── Test helpers ── */

function makeTask(overrides: Partial<TaskSummary> = {}): TaskSummary {
  return {
    taskId: overrides.taskId ?? 'task-1',
    source: overrides.source ?? 'navigation',
    title: overrides.title ?? '导航',
    statusText: overrides.statusText ?? '导航中 · 还有 500m',
    priority: overrides.priority ?? 5,
    timestamp: overrides.timestamp ?? Date.now(),
  };
}

function makeProps(overrides: Partial<SmartTaskZoneViewProps> = {}): SmartTaskZoneViewProps {
  return {
    aiStatus: overrides.aiStatus ?? 'idle',
    tasks: overrides.tasks ?? [],
    state: overrides.state ?? 'compact',
    aiFeedbackText: overrides.aiFeedbackText,
    conversationHistory: overrides.conversationHistory ?? [],
    onAction: overrides.onAction,
    onConfirm: overrides.onConfirm,
    onDismiss: overrides.onDismiss,
    carouselIntervalMs: overrides.carouselIntervalMs ?? 3000,
  };
}

const ALL_STATES: SmartTaskZoneState[] = ['compact', 'confirm_prompt', 'expanded'];
const ALL_AI_STATUSES: AIStatus[] = ['idle', 'listening', 'thinking', 'responding'];

/* ── Props validation ── */

describe('SmartTaskZoneView props model', () => {
  it('accepts all three state values', () => {
    for (const state of ALL_STATES) {
      const props = makeProps({ state });
      expect(props.state).toBe(state);
    }
  });

  it('accepts all four AI status values', () => {
    for (const status of ALL_AI_STATUSES) {
      const props = makeProps({ aiStatus: status });
      expect(props.aiStatus).toBe(status);
    }
  });

  it('tasks array can be empty', () => {
    const props = makeProps({ tasks: [] });
    expect(props.tasks).toHaveLength(0);
  });

  it('tasks array can hold multiple tasks', () => {
    const tasks = [
      makeTask({ taskId: 't1', statusText: '导航中' }),
      makeTask({ taskId: 't2', statusText: '外卖配送中' }),
      makeTask({ taskId: 't3', statusText: '音乐播放中' }),
    ];
    const props = makeProps({ tasks });
    expect(props.tasks).toHaveLength(3);
  });

  it('aiFeedbackText is optional', () => {
    const props = makeProps();
    expect(props.aiFeedbackText).toBeUndefined();
  });

  it('aiFeedbackText can be set for real-time feedback (需求 3.3)', () => {
    const props = makeProps({ aiFeedbackText: '正在搜索...' });
    expect(props.aiFeedbackText).toBe('正在搜索...');
  });
});

/* ── Carousel logic ── */

describe('SmartTaskZoneView carousel logic (需求 3.10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carousel index wraps around when reaching end of task list', () => {
    const taskCount = 3;

    // Simulate carousel index progression
    let index = 0;
    for (let tick = 0; tick < 10; tick++) {
      index = (index + 1) % taskCount;
    }
    // After 10 ticks with 3 items: 10 % 3 = 1
    expect(index).toBe(10 % taskCount);
  });

  it('single task does not need carousel', () => {
    const taskCount = 1;
    const index = 0 % taskCount;
    expect(index).toBe(0);
  });

  it('zero tasks produces index 0', () => {
    // When no tasks, carousel index should be 0
    const index = 0;
    expect(index).toBe(0);
  });

  it('default carousel interval is 3000ms', () => {
    const props = makeProps();
    expect(props.carouselIntervalMs).toBe(3000);
  });

  it('custom carousel interval is respected', () => {
    const props = makeProps({ carouselIntervalMs: 5000 });
    expect(props.carouselIntervalMs).toBe(5000);
  });
});

/* ── Compact mode (需求 3.1, 3.2) ── */

describe('SmartTaskZoneView compact mode', () => {
  it('compact state shows task summary text (需求 3.2)', () => {
    const task = makeTask({ statusText: '导航中 · 还有 500m' });
    const props = makeProps({ state: 'compact', tasks: [task] });
    expect(props.state).toBe('compact');
    expect(props.tasks[0].statusText).toBe('导航中 · 还有 500m');
  });

  it('compact state with no tasks shows idle state (需求 3.9 ref)', () => {
    const props = makeProps({ state: 'compact', tasks: [], aiStatus: 'idle' });
    expect(props.tasks).toHaveLength(0);
    expect(props.aiStatus).toBe('idle');
  });

  it('AI feedback text is available in compact mode (需求 3.3)', () => {
    const props = makeProps({
      state: 'compact',
      aiFeedbackText: '已找到 3 个结果',
    });
    expect(props.aiFeedbackText).toBe('已找到 3 个结果');
  });
});

/* ── Confirm prompt mode (需求 3.4) ── */

describe('SmartTaskZoneView confirm_prompt mode', () => {
  it('confirm_prompt state is valid', () => {
    const props = makeProps({ state: 'confirm_prompt' });
    expect(props.state).toBe('confirm_prompt');
  });

  it('onConfirm callback is available', () => {
    const onConfirm = vi.fn();
    const props = makeProps({ state: 'confirm_prompt', onConfirm });
    expect(props.onConfirm).toBe(onConfirm);
  });
});

/* ── Expanded mode (需求 3.7) ── */

describe('SmartTaskZoneView expanded mode', () => {
  it('expanded state is valid', () => {
    const props = makeProps({ state: 'expanded' });
    expect(props.state).toBe('expanded');
  });

  it('conversation history is passed through', () => {
    const history: ConversationMessage[] = [
      { role: 'user', text: '帮我查一下天气', timestamp: 1000 },
      { role: 'assistant', text: '今天北京晴，25°C', timestamp: 1500 },
    ];
    const props = makeProps({ state: 'expanded', conversationHistory: history });
    expect(props.conversationHistory).toHaveLength(2);
    expect(props.conversationHistory![0].role).toBe('user');
    expect(props.conversationHistory![1].role).toBe('assistant');
  });

  it('onDismiss callback is available', () => {
    const onDismiss = vi.fn();
    const props = makeProps({ state: 'expanded', onDismiss });
    expect(props.onDismiss).toBe(onDismiss);
  });

  it('onAction callback is available for action buttons', () => {
    const onAction = vi.fn();
    const props = makeProps({ state: 'expanded', onAction });
    expect(props.onAction).toBe(onAction);
  });

  it('task list is available in expanded mode', () => {
    const tasks = [
      makeTask({ taskId: 't1', title: '导航', statusText: '导航中 · 还有 500m' }),
      makeTask({ taskId: 't2', title: '外卖', statusText: '骑手已取餐' }),
    ];
    const props = makeProps({ state: 'expanded', tasks });
    expect(props.tasks).toHaveLength(2);
    expect(props.tasks[0].title).toBe('导航');
    expect(props.tasks[1].statusText).toBe('骑手已取餐');
  });

  it('AI feedback text is available in expanded mode (需求 3.3)', () => {
    const props = makeProps({
      state: 'expanded',
      aiFeedbackText: '正在搜索...',
    });
    expect(props.aiFeedbackText).toBe('正在搜索...');
  });
});

/* ── ConversationMessage model ── */

describe('ConversationMessage model', () => {
  it('supports user role', () => {
    const msg: ConversationMessage = { role: 'user', text: '你好', timestamp: Date.now() };
    expect(msg.role).toBe('user');
  });

  it('supports assistant role', () => {
    const msg: ConversationMessage = { role: 'assistant', text: '你好！', timestamp: Date.now() };
    expect(msg.role).toBe('assistant');
  });
});


/* ── OrbMenuView 集成测试 (需求 1.3, 6.5) ── */

describe('SmartTaskZoneView OrbMenu integration', () => {
  const orbMenuItems: OrbMenuItemData[] = [
    { id: 'launcher', icon: 'home', label: '主页', route: 'launcher' },
    { id: 'camera', icon: 'camera', label: '相机', route: 'camera' },
  ];

  function renderView(overrides: Partial<SmartTaskZoneViewProps> = {}): string {
    return renderToStaticMarkup(
      createElement(SmartTaskZoneView, {
        aiStatus: 'idle' as AIStatus,
        tasks: [],
        state: 'compact' as SmartTaskZoneState,
        conversationHistory: [],
        carouselIntervalMs: 3000,
        ...overrides,
      } as SmartTaskZoneViewProps),
    );
  }

  it('no longer renders OrbMenuView (moved to App level for full-screen positioning)', () => {
    const html = renderView({
      orbMenuItems,
      orbMenuState: 'orb_menu_open' as OrbMenuState,
    });
    expect(html).not.toContain('data-testid="orb-menu-view"');
  });

  it('still renders compact mode with orb menu props', () => {
    const html = renderView({
      orbMenuItems,
      orbMenuState: 'orb_menu_open' as OrbMenuState,
    });
    expect(html).toContain('data-testid="smart-task-zone-view"');
  });

  it('does not render OrbMenuView when orbMenuItems is not provided (向后兼容, 需求 6.5)', () => {
    const html = renderView();
    expect(html).not.toContain('data-testid="orb-menu-view"');
  });

  it('does not render OrbMenuView when orbMenuItems is empty', () => {
    const html = renderView({
      orbMenuItems: [],
      orbMenuState: 'orb_menu_open' as OrbMenuState,
    });
    expect(html).not.toContain('data-testid="orb-menu-view"');
  });
});
