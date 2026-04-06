import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartTaskZoneService } from './SmartTaskZone';
import type { SmartTaskZoneState, SmartTaskZoneCallbacks } from './SmartTaskZone';
import type { TaskSummary, GazeEvent } from '../types/data';

function makeGaze(isGazing: boolean, duration = 0): GazeEvent {
  return { target: 'smart_task_zone', duration, isGazing };
}

function makeTask(id: string, priority = 1): TaskSummary {
  return {
    taskId: id,
    source: 'test',
    title: `Task ${id}`,
    statusText: 'running',
    priority,
    timestamp: Date.now(),
  };
}

describe('SmartTaskZoneService', () => {
  let svc: SmartTaskZoneService;
  let stateChanges: Array<{ from: SmartTaskZoneState; to: SmartTaskZoneState }>;
  let callbacks: SmartTaskZoneCallbacks;

  beforeEach(() => {
    vi.useFakeTimers();
    stateChanges = [];
    callbacks = {
      onStateChange: (from, to) => stateChanges.push({ from, to }),
      onConfirmPrompt: vi.fn(),
      onExpanded: vi.fn(),
      onCollapsed: vi.fn(),
      onTasksChanged: vi.fn(),
    };
    svc = new SmartTaskZoneService(callbacks);
  });

  afterEach(() => {
    svc.dispose();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts in compact mode', () => {
      expect(svc.getMode()).toBe('compact');
      expect(svc.getState()).toBe('compact');
    });

    it('starts with idle AI status', () => {
      expect(svc.getAIStatus()).toBe('idle');
    });

    it('starts with no tasks', () => {
      expect(svc.getActiveTasks()).toEqual([]);
    });
  });

  describe('AI status', () => {
    it('updates AI status', () => {
      svc.setAIStatus('listening');
      expect(svc.getAIStatus()).toBe('listening');
      svc.setAIStatus('thinking');
      expect(svc.getAIStatus()).toBe('thinking');
    });
  });

  describe('task management', () => {
    it('adds and retrieves tasks', () => {
      svc.upsertTask(makeTask('t1', 5));
      svc.upsertTask(makeTask('t2', 10));
      const tasks = svc.getActiveTasks();
      expect(tasks).toHaveLength(2);
      // sorted by priority descending
      expect(tasks[0].taskId).toBe('t2');
      expect(tasks[1].taskId).toBe('t1');
    });

    it('updates existing task', () => {
      svc.upsertTask(makeTask('t1', 5));
      svc.upsertTask({ ...makeTask('t1', 5), statusText: 'done' });
      expect(svc.getActiveTasks()).toHaveLength(1);
      expect(svc.getActiveTasks()[0].statusText).toBe('done');
    });

    it('removes task', () => {
      svc.upsertTask(makeTask('t1'));
      svc.removeTask('t1');
      expect(svc.getActiveTasks()).toHaveLength(0);
    });

    it('fires onTasksChanged callback', () => {
      svc.upsertTask(makeTask('t1'));
      expect(callbacks.onTasksChanged).toHaveBeenCalledTimes(1);
      svc.removeTask('t1');
      expect(callbacks.onTasksChanged).toHaveBeenCalledTimes(2);
    });
  });

  // 需求 3.4: 注视 >1秒触发确认提示
  describe('gaze detection → confirm prompt (requirement 3.4)', () => {
    it('transitions to confirm_prompt after gazing >1s', () => {
      svc.onGazeEvent(makeGaze(true));
      expect(svc.getState()).toBe('compact');

      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('confirm_prompt');
      expect(callbacks.onConfirmPrompt).toHaveBeenCalledTimes(1);
    });

    it('does not trigger if gaze ends before 1s', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(500);
      svc.onGazeEvent(makeGaze(false));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('compact');
    });

    it('does not trigger for gaze on other zones', () => {
      svc.onGazeEvent({ target: 'main_task_area', duration: 0, isGazing: true });
      vi.advanceTimersByTime(2000);
      expect(svc.getState()).toBe('compact');
    });

    it('getMode returns compact during confirm_prompt', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('confirm_prompt');
      expect(svc.getMode()).toBe('compact');
    });
  });

  // 需求 3.5: 点头确认 → 300ms 内展开
  describe('nod confirm → expand (requirement 3.5)', () => {
    it('expands on nod gesture from confirm_prompt', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('confirm_prompt');

      svc.onConfirmGesture('nod');
      expect(svc.getState()).toBe('expanded');
      expect(svc.getMode()).toBe('expanded');
      expect(callbacks.onExpanded).toHaveBeenCalled();
    });

    it('ignores nod gesture when not in confirm_prompt', () => {
      svc.onConfirmGesture('nod');
      expect(svc.getState()).toBe('compact');
    });
  });

  // 需求 3.6: EMG 捏合确认 → 300ms 内展开
  describe('EMG pinch confirm → expand (requirement 3.6)', () => {
    it('expands on emg_pinch gesture from confirm_prompt', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);

      svc.onConfirmGesture('emg_pinch');
      expect(svc.getState()).toBe('expanded');
      expect(svc.getMode()).toBe('expanded');
    });
  });

  // Confirm timeout: 3秒无确认 → 收回
  describe('confirm timeout → collapse', () => {
    it('collapses back to compact after 3s without confirmation', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('confirm_prompt');

      vi.advanceTimersByTime(3000);
      expect(svc.getState()).toBe('compact');
      expect(callbacks.onCollapsed).toHaveBeenCalledWith('timeout');
    });
  });

  // 需求 3.8: 视线移开 >3秒 → 收回
  describe('gaze away >3s → collapse (requirement 3.8)', () => {
    it('collapses when gaze moves away for >3s in expanded mode', () => {
      // Get to expanded state
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('nod');
      expect(svc.getState()).toBe('expanded');

      // Gaze away
      svc.onGazeEvent(makeGaze(false));
      vi.advanceTimersByTime(3000);
      expect(svc.getState()).toBe('compact');
      expect(callbacks.onCollapsed).toHaveBeenCalledWith('gaze_away');
    });

    it('does not collapse if gaze returns within 3s', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('nod');

      svc.onGazeEvent(makeGaze(false));
      vi.advanceTimersByTime(2000);
      svc.onGazeEvent(makeGaze(true)); // gaze returns
      vi.advanceTimersByTime(2000);
      expect(svc.getState()).toBe('expanded');
    });
  });

  // 需求 3.8: 摇头/侧滑 → 收回
  describe('dismiss gestures → collapse (requirement 3.8)', () => {
    it('collapses on head_shake from expanded', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('nod');

      svc.onDismissGesture('head_shake');
      expect(svc.getState()).toBe('compact');
      expect(callbacks.onCollapsed).toHaveBeenCalledWith('head_shake');
    });

    it('collapses on side_swipe from expanded', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('emg_pinch');

      svc.onDismissGesture('side_swipe');
      expect(svc.getState()).toBe('compact');
      expect(callbacks.onCollapsed).toHaveBeenCalledWith('side_swipe');
    });

    it('collapses on explicit gaze_away dismiss from expanded', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('nod');

      svc.onDismissGesture('gaze_away');
      expect(svc.getState()).toBe('compact');
    });

    it('ignores dismiss gestures when not expanded', () => {
      svc.onDismissGesture('head_shake');
      expect(svc.getState()).toBe('compact');
    });
  });

  describe('state change callbacks', () => {
    it('records full state machine cycle', () => {
      // compact → confirm_prompt
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);

      // confirm_prompt → expanded
      svc.onConfirmGesture('nod');

      // expanded → compact
      svc.onDismissGesture('head_shake');

      expect(stateChanges).toEqual([
        { from: 'compact', to: 'confirm_prompt' },
        { from: 'confirm_prompt', to: 'expanded' },
        { from: 'expanded', to: 'compact' },
      ]);
    });
  });

  describe('dispose', () => {
    it('clears all timers on dispose', () => {
      svc.onGazeEvent(makeGaze(true));
      svc.dispose();
      vi.advanceTimersByTime(5000);
      expect(svc.getState()).toBe('compact');
    });
  });

  // 需求 6.2, 6.3, 6.4: Orb Menu 互斥锁
  describe('Orb Menu mutex lock (requirements 6.2, 6.3, 6.4)', () => {
    it('isOrbMenuLocked() returns false by default', () => {
      expect(svc.isOrbMenuLocked()).toBe(false);
    });

    it('isOrbMenuLocked() returns true after setOrbMenuLock(true)', () => {
      svc.setOrbMenuLock(true);
      expect(svc.isOrbMenuLocked()).toBe(true);
    });

    it('isOrbMenuLocked() returns false after setOrbMenuLock(false)', () => {
      svc.setOrbMenuLock(true);
      svc.setOrbMenuLock(false);
      expect(svc.isOrbMenuLocked()).toBe(false);
    });

    it('blocks compact → confirm_prompt when orbMenuLocked is true', () => {
      svc.setOrbMenuLock(true);
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('compact');
      expect(callbacks.onConfirmPrompt).not.toHaveBeenCalled();
    });

    it('restores normal gaze trigger after setOrbMenuLock(false)', () => {
      svc.setOrbMenuLock(true);
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('compact');

      // Unlock and re-trigger gaze
      svc.setOrbMenuLock(false);
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('confirm_prompt');
      expect(callbacks.onConfirmPrompt).toHaveBeenCalledTimes(1);
    });

    it('does not affect transitions other than compact → confirm_prompt', () => {
      // First get to expanded state normally
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('nod');
      expect(svc.getState()).toBe('expanded');

      // Lock should not prevent dismiss from expanded
      svc.setOrbMenuLock(true);
      svc.onDismissGesture('head_shake');
      expect(svc.getState()).toBe('compact');
    });
  });
});
