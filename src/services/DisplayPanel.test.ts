import { describe, it, expect, beforeEach } from 'vitest';
import { DisplayPanel } from './DisplayPanel';

describe('DisplayPanel', () => {
  let panel: DisplayPanel;

  beforeEach(() => {
    panel = new DisplayPanel();
  });

  describe('getSpec', () => {
    it('returns default MicroOLED spec with correct values', () => {
      const spec = panel.getSpec();
      expect(spec.panelType).toBe('MicroOLED');
      expect(spec.resolution).toEqual({ width: 1920, height: 1080 });
      expect(spec.maxBrightness).toBe(4000);
      expect(spec.refreshRate).toBe(90);
      expect(spec.fov).toBe(52);
    });

    it('allows custom spec overrides', () => {
      const custom = new DisplayPanel({ panelType: 'MicroLED', maxBrightness: 5000 });
      const spec = custom.getSpec();
      expect(spec.panelType).toBe('MicroLED');
      expect(spec.maxBrightness).toBe(5000);
      // defaults still apply for non-overridden fields
      expect(spec.resolution).toEqual({ width: 1920, height: 1080 });
    });

    it('returns a copy, not a reference', () => {
      const spec = panel.getSpec();
      spec.maxBrightness = 0;
      expect(panel.getSpec().maxBrightness).toBe(4000);
    });

    // 需求 1.1: 单眼分辨率不低于 1280×720
    it('default resolution meets requirement 1.1 (≥1280×720)', () => {
      const spec = panel.getSpec();
      expect(spec.resolution.width).toBeGreaterThanOrEqual(1280);
      expect(spec.resolution.height).toBeGreaterThanOrEqual(720);
    });

    // 需求 1.2: 峰值亮度不低于 3000nits
    it('default max brightness meets requirement 1.2 (≥3000 nits)', () => {
      expect(panel.getSpec().maxBrightness).toBeGreaterThanOrEqual(3000);
    });

    // 需求 1.3: 刷新率不低于 60Hz
    it('default refresh rate meets requirement 1.3 (≥60Hz)', () => {
      expect(panel.getSpec().refreshRate).toBeGreaterThanOrEqual(60);
    });

    // 需求 1.4: FOV 不低于 40 度
    it('default FOV meets requirement 1.4 (≥40°)', () => {
      expect(panel.getSpec().fov).toBeGreaterThanOrEqual(40);
    });
  });

  describe('setBrightness / getBrightness', () => {
    it('sets brightness within 0-100 range', () => {
      panel.setBrightness(75);
      expect(panel.getBrightness()).toBe(75);
    });

    it('clamps brightness to 0 minimum', () => {
      panel.setBrightness(-10);
      expect(panel.getBrightness()).toBe(0);
    });

    it('clamps brightness to 100 maximum', () => {
      panel.setBrightness(150);
      expect(panel.getBrightness()).toBe(100);
    });

    it('ignores manual brightness when auto-brightness is enabled', () => {
      panel.setAutoBrightness(true);
      const before = panel.getBrightness();
      panel.setBrightness(99);
      // auto-brightness recalculated, manual set ignored
      expect(panel.getBrightness()).toBe(before);
    });
  });

  describe('setRefreshRate / getRefreshRate', () => {
    it('defaults to spec refresh rate (90Hz)', () => {
      expect(panel.getRefreshRate()).toBe(90);
    });

    it('can set to 60Hz', () => {
      panel.setRefreshRate(60);
      expect(panel.getRefreshRate()).toBe(60);
    });

    it('can set to 120Hz', () => {
      panel.setRefreshRate(120);
      expect(panel.getRefreshRate()).toBe(120);
    });
  });

  describe('ambient light simulation', () => {
    it('defaults to 50', () => {
      expect(panel.getAmbientLight()).toBe(50);
    });

    it('clamps ambient light to 0-100', () => {
      panel.setSimulatedAmbientLight(-5);
      expect(panel.getAmbientLight()).toBe(0);
      panel.setSimulatedAmbientLight(200);
      expect(panel.getAmbientLight()).toBe(100);
    });
  });

  // 需求 1.5: 环境光线变化时自动调节显示亮度
  describe('auto-brightness (requirement 1.5)', () => {
    it('adjusts brightness when ambient light changes with auto-brightness on', () => {
      panel.setAutoBrightness(true);

      panel.setSimulatedAmbientLight(0);
      expect(panel.getBrightness()).toBe(10); // min brightness in dark

      panel.setSimulatedAmbientLight(100);
      expect(panel.getBrightness()).toBe(100); // max brightness in bright light
    });

    it('does not auto-adjust when auto-brightness is off', () => {
      panel.setBrightness(50);
      panel.setSimulatedAmbientLight(100);
      expect(panel.getBrightness()).toBe(50); // unchanged
    });

    it('applies auto-brightness immediately when enabled', () => {
      panel.setSimulatedAmbientLight(0);
      panel.setAutoBrightness(true);
      expect(panel.getBrightness()).toBe(10);
    });

    it('isAutoBrightnessEnabled reflects current state', () => {
      expect(panel.isAutoBrightnessEnabled()).toBe(false);
      panel.setAutoBrightness(true);
      expect(panel.isAutoBrightnessEnabled()).toBe(true);
    });
  });
});
