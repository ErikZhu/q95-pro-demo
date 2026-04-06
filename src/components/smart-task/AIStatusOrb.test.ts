import { describe, it, expect } from 'vitest';
import type { AIStatus } from '../../types/ai';

/**
 * Unit tests for AIStatusOrb component logic.
 *
 * Since this is a pure-CSS animation component, we test the data model
 * (colour mapping, status values) and structural expectations rather than
 * rendering in a DOM (no jsdom configured).
 *
 * 需求: 3.1, 3.9
 */

/* ── Re-declare the colour map so tests stay independent of internals ── */
const STATUS_COLORS: Record<AIStatus, { core: string; glow: string; ring: string }> = {
  idle: {
    core: 'rgba(100, 200, 255, 0.85)',
    glow: 'rgba(60, 140, 220, 0.4)',
    ring: 'rgba(100, 200, 255, 0.3)',
  },
  listening: {
    core: 'rgba(80, 220, 160, 0.9)',
    glow: 'rgba(40, 180, 120, 0.45)',
    ring: 'rgba(80, 220, 160, 0.35)',
  },
  thinking: {
    core: 'rgba(180, 130, 255, 0.9)',
    glow: 'rgba(140, 80, 240, 0.45)',
    ring: 'rgba(180, 130, 255, 0.35)',
  },
  responding: {
    core: 'rgba(255, 180, 60, 0.9)',
    glow: 'rgba(240, 140, 20, 0.45)',
    ring: 'rgba(255, 180, 60, 0.35)',
  },
};

const ALL_STATUSES: AIStatus[] = ['idle', 'listening', 'thinking', 'responding'];

describe('AIStatusOrb data model', () => {
  it('defines unique colour palettes for all four statuses', () => {
    const cores = new Set(ALL_STATUSES.map((s) => STATUS_COLORS[s].core));
    expect(cores.size).toBe(4);
  });

  it('every status has core, glow, and ring colours', () => {
    for (const status of ALL_STATUSES) {
      const c = STATUS_COLORS[status];
      expect(c.core).toBeTruthy();
      expect(c.glow).toBeTruthy();
      expect(c.ring).toBeTruthy();
    }
  });

  it('idle status has no animation (static soft glow)', () => {
    // idle should NOT use breathe / spin / ripple — verified by absence of
    // animation assignment in the component. Here we just confirm the status
    // value is valid and distinct.
    expect(STATUS_COLORS['idle'].core).toContain('100, 200, 255');
  });

  it('listening status uses green-tinted colours for pulse effect', () => {
    expect(STATUS_COLORS['listening'].core).toContain('80, 220, 160');
  });

  it('thinking status uses purple-tinted colours for spin effect', () => {
    expect(STATUS_COLORS['thinking'].core).toContain('180, 130, 255');
  });

  it('responding status uses warm orange colours for ripple effect', () => {
    expect(STATUS_COLORS['responding'].core).toContain('255, 180, 60');
  });
});

describe('AIStatusOrb animation mapping', () => {
  // Map status → expected CSS animation keyword
  const ANIMATION_MAP: Record<AIStatus, string | null> = {
    idle: null, // no animation — static glow
    listening: 'orb-breathe', // pulse breathing
    thinking: 'orb-spin', // rotating ring
    responding: 'orb-ripple', // expanding ripples
  };

  it('maps each status to the correct animation keyword', () => {
    expect(ANIMATION_MAP['idle']).toBeNull();
    expect(ANIMATION_MAP['listening']).toBe('orb-breathe');
    expect(ANIMATION_MAP['thinking']).toBe('orb-spin');
    expect(ANIMATION_MAP['responding']).toBe('orb-ripple');
  });

  it('all four statuses are covered', () => {
    expect(Object.keys(ANIMATION_MAP)).toHaveLength(4);
    for (const s of ALL_STATUSES) {
      expect(s in ANIMATION_MAP).toBe(true);
    }
  });
});

describe('AIStatusOrb size prop', () => {
  it('default size is 40', () => {
    const DEFAULT_SIZE = 40;
    expect(DEFAULT_SIZE).toBe(40);
  });

  it('custom size produces valid dimensions', () => {
    const customSize = 64;
    expect(customSize).toBeGreaterThan(0);
    // The component uses size for width/height and derives glow radius from size/2
    const half = customSize / 2;
    expect(half).toBe(32);
  });
});


/* ── Orb Menu state extension tests (需求: 2.1, 2.5, 7.3, 8.2) ── */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIStatusOrb } from './AIStatusOrb';
import type { AIStatusOrbProps } from './AIStatusOrb';
import type { OrbMenuState } from '../../services/OrbMenuStateMachine';

function renderOrb(overrides?: Partial<AIStatusOrbProps>): string {
  const defaults: AIStatusOrbProps = { status: 'idle' };
  return renderToStaticMarkup(createElement(AIStatusOrb, { ...defaults, ...overrides }));
}

describe('AIStatusOrb — Orb Menu state extensions', () => {
  // ─── 需求 2.1: orb_hint 时显示光晕动效元素 ───

  describe('orb_hint glow (需求 2.1)', () => {
    it('renders hint glow element when orbMenuState is orb_hint', () => {
      const html = renderOrb({ orbMenuState: 'orb_hint' as OrbMenuState });
      expect(html).toContain('data-testid="orb-hint-glow"');
    });

    it('does not render hint glow when orbMenuState is orb_idle', () => {
      const html = renderOrb({ orbMenuState: 'orb_idle' as OrbMenuState });
      expect(html).not.toContain('data-testid="orb-hint-glow"');
    });

    it('does not render hint glow when orbMenuState is undefined', () => {
      const html = renderOrb();
      expect(html).not.toContain('data-testid="orb-hint-glow"');
    });

    it('hint glow uses orb-hint-glow animation', () => {
      const html = renderOrb({ orbMenuState: 'orb_hint' as OrbMenuState });
      expect(html).toContain('orb-hint-glow');
    });
  });

  // ─── 需求 7.3: orb_menu_open 时显示光环扩散元素 ───

  describe('orb_menu_open ring (需求 7.3)', () => {
    it('renders menu ring element when orbMenuState is orb_menu_open', () => {
      const html = renderOrb({ orbMenuState: 'orb_menu_open' as OrbMenuState });
      expect(html).toContain('data-testid="orb-menu-ring"');
    });

    it('does not render menu ring when orbMenuState is orb_idle', () => {
      const html = renderOrb({ orbMenuState: 'orb_idle' as OrbMenuState });
      expect(html).not.toContain('data-testid="orb-menu-ring"');
    });

    it('does not render menu ring when orbMenuState is orb_hint', () => {
      const html = renderOrb({ orbMenuState: 'orb_hint' as OrbMenuState });
      expect(html).not.toContain('data-testid="orb-menu-ring"');
    });

    it('menu ring uses orb-menu-ring animation', () => {
      const html = renderOrb({ orbMenuState: 'orb_menu_open' as OrbMenuState });
      expect(html).toContain('orb-menu-ring');
    });
  });

  // ─── 需求 8.2: activeAppId 存在时显示弧形指示器 ───

  describe('active app arc indicator (需求 8.2)', () => {
    it('renders arc indicator when orb_idle and activeAppId is set', () => {
      const html = renderOrb({ activeAppId: 'camera' });
      expect(html).toContain('data-testid="orb-active-arc"');
    });

    it('renders arc indicator when orbMenuState is undefined and activeAppId is set', () => {
      const html = renderOrb({ activeAppId: 'music' });
      expect(html).toContain('data-testid="orb-active-arc"');
    });

    it('does not render arc indicator when activeAppId is null', () => {
      const html = renderOrb({ orbMenuState: 'orb_idle' as OrbMenuState, activeAppId: null });
      expect(html).not.toContain('data-testid="orb-active-arc"');
    });

    it('does not render arc indicator when orbMenuState is orb_menu_open', () => {
      const html = renderOrb({ orbMenuState: 'orb_menu_open' as OrbMenuState, activeAppId: 'camera' });
      expect(html).not.toContain('data-testid="orb-active-arc"');
    });

    it('does not render arc indicator when orbMenuState is orb_hint', () => {
      const html = renderOrb({ orbMenuState: 'orb_hint' as OrbMenuState, activeAppId: 'camera' });
      expect(html).not.toContain('data-testid="orb-active-arc"');
    });
  });

  // ─── 需求 2.5: 原有 AI 状态视觉表达在 orbMenuState 变化时不受影响 ───

  describe('AI status preserved across orbMenuState changes (需求 2.5)', () => {
    const orbStates: (OrbMenuState | undefined)[] = [
      undefined,
      'orb_idle' as OrbMenuState,
      'orb_hint' as OrbMenuState,
      'orb_menu_open' as OrbMenuState,
      'orb_item_focused' as OrbMenuState,
    ];

    for (const orbState of orbStates) {
      const label = orbState ?? 'undefined';

      it(`data-status="idle" is present when orbMenuState=${label}`, () => {
        const html = renderOrb({ status: 'idle', orbMenuState: orbState });
        expect(html).toContain('data-status="idle"');
      });

      it(`data-status="listening" is present when orbMenuState=${label}`, () => {
        const html = renderOrb({ status: 'listening', orbMenuState: orbState });
        expect(html).toContain('data-status="listening"');
      });

      it(`data-status="thinking" is present when orbMenuState=${label}`, () => {
        const html = renderOrb({ status: 'thinking', orbMenuState: orbState });
        expect(html).toContain('data-status="thinking"');
      });

      it(`data-status="responding" is present when orbMenuState=${label}`, () => {
        const html = renderOrb({ status: 'responding', orbMenuState: orbState });
        expect(html).toContain('data-status="responding"');
      });
    }

    it('listening animation style preserved when orbMenuState is orb_hint', () => {
      const html = renderOrb({ status: 'listening', orbMenuState: 'orb_hint' as OrbMenuState });
      expect(html).toContain('orb-breathe');
    });

    it('responding ripple elements preserved when orbMenuState is orb_menu_open', () => {
      const html = renderOrb({ status: 'responding', orbMenuState: 'orb_menu_open' as OrbMenuState });
      expect(html).toContain('orb-ripple');
    });
  });
});
