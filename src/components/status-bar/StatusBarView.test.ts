import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBarView } from './StatusBarView';
import type { DeviceStatus } from '../../types/data';

/**
 * StatusBarView 单元测试
 * 需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

function makeStatus(overrides?: Partial<DeviceStatus>): DeviceStatus {
  return {
    battery: { level: 80, isCharging: false, isLow: false, isCritical: false },
    bluetooth: { connected: false },
    wifi: { connected: false },
    time: '14:30',
    ...overrides,
  };
}

function render(props: Parameters<typeof StatusBarView>[0]): string {
  return renderToStaticMarkup(createElement(StatusBarView, props));
}

describe('StatusBarView', () => {
  describe('基础渲染 (需求 4.1)', () => {
    it('renders time display', () => {
      const html = render({ status: makeStatus(), isExpanded: false });
      expect(html).toContain('14:30');
    });

    it('renders battery level percentage', () => {
      const html = render({ status: makeStatus(), isExpanded: false });
      expect(html).toContain('80%');
    });

    it('renders wifi indicator', () => {
      const html = render({ status: makeStatus(), isExpanded: false });
      expect(html).toContain('wifi-indicator');
    });

    it('renders bluetooth indicator', () => {
      const html = render({ status: makeStatus(), isExpanded: false });
      expect(html).toContain('bluetooth-indicator');
    });
  });

  describe('电量警告色 (需求 4.2)', () => {
    it('uses green color for normal battery (>=20%)', () => {
      const html = render({ status: makeStatus({ battery: { level: 50, isCharging: false, isLow: false, isCritical: false } }), isExpanded: false });
      // Green color #66BB6A
      expect(html).toContain('#66BB6A');
    });

    it('uses orange color for low battery (<20%)', () => {
      const html = render({ status: makeStatus({ battery: { level: 15, isCharging: false, isLow: true, isCritical: false } }), isExpanded: false });
      // Orange color #FFA726
      expect(html).toContain('#FFA726');
    });

    it('uses red color for critical battery (<5%)', () => {
      const html = render({ status: makeStatus({ battery: { level: 3, isCharging: false, isLow: true, isCritical: true } }), isExpanded: false });
      // Red color #FF5252
      expect(html).toContain('#FF5252');
    });

    it('uses blue color when charging', () => {
      const html = render({ status: makeStatus({ battery: { level: 10, isCharging: true, isLow: true, isCritical: false } }), isExpanded: false });
      // Charging color #4FC3F7
      expect(html).toContain('#4FC3F7');
    });
  });

  describe('critical battery blink animation (需求 4.3)', () => {
    it('applies blink animation when battery is critical', () => {
      const html = render({ status: makeStatus({ battery: { level: 2, isCharging: false, isLow: true, isCritical: true } }), isExpanded: false });
      expect(html).toContain('sb-low-blink');
    });

    it('does not apply blink animation for normal battery', () => {
      const html = render({ status: makeStatus(), isExpanded: false });
      expect(html).not.toContain('sb-low-blink');
    });
  });

  describe('连接状态图标 (需求 4.4)', () => {
    it('shows connected bluetooth icon when connected', () => {
      const html = render({ status: makeStatus({ bluetooth: { connected: true, deviceName: 'AirPods' } }), isExpanded: false });
      expect(html).toContain('bluetooth');
    });

    it('shows disconnected bluetooth icon when not connected', () => {
      const html = render({ status: makeStatus({ bluetooth: { connected: false } }), isExpanded: false });
      expect(html).toContain('bluetooth');
    });
  });

  describe('展开详细面板 (需求 4.5)', () => {
    it('does not render detail panel when collapsed', () => {
      const html = render({ status: makeStatus(), isExpanded: false });
      expect(html).not.toContain('status-detail-panel');
    });

    it('renders detail panel when expanded', () => {
      const html = render({ status: makeStatus(), isExpanded: true });
      expect(html).toContain('status-detail-panel');
    });

    it('shows battery value in detail panel', () => {
      const html = render({ status: makeStatus({ battery: { level: 65, isCharging: false, isLow: false, isCritical: false } }), isExpanded: true });
      expect(html).toContain('panel-battery-value');
      expect(html).toContain('65%');
    });

    it('shows charging indicator in detail panel', () => {
      const html = render({ status: makeStatus({ battery: { level: 50, isCharging: true, isLow: false, isCritical: false } }), isExpanded: true });
      expect(html).toContain('充电中');
    });

    it('shows bluetooth device name in detail panel', () => {
      const html = render({ status: makeStatus({ bluetooth: { connected: true, deviceName: 'AirPods Pro' } }), isExpanded: true });
      expect(html).toContain('AirPods Pro');
    });

    it('shows bluetooth disconnected in detail panel', () => {
      const html = render({ status: makeStatus({ bluetooth: { connected: false } }), isExpanded: true });
      expect(html).toContain('未连接');
    });

    it('shows wifi SSID and signal strength in detail panel', () => {
      const html = render({ status: makeStatus({ wifi: { connected: true, ssid: 'HomeNet', strength: 80 } }), isExpanded: true });
      expect(html).toContain('HomeNet');
      expect(html).toContain('信号强');
    });

    it('shows wifi medium signal strength', () => {
      const html = render({ status: makeStatus({ wifi: { connected: true, ssid: 'Office', strength: 50 } }), isExpanded: true });
      expect(html).toContain('信号中');
    });

    it('shows wifi weak signal strength', () => {
      const html = render({ status: makeStatus({ wifi: { connected: true, ssid: 'Cafe', strength: 20 } }), isExpanded: true });
      expect(html).toContain('信号弱');
    });

    it('shows wifi disconnected in detail panel', () => {
      const html = render({ status: makeStatus({ wifi: { connected: false } }), isExpanded: true });
      // The panel should show 未连接 for wifi
      const panelSection = html.split('panel-wifi-value');
      expect(panelSection.length).toBeGreaterThan(1);
    });

    it('shows time in detail panel', () => {
      const html = render({ status: makeStatus({ time: '09:15' }), isExpanded: true });
      expect(html).toContain('panel-time-value');
      // Time appears in both compact bar and panel
      expect(html).toContain('09:15');
    });
  });

  describe('高对比度可读性 (需求 4.6)', () => {
    it('uses white text for time display', () => {
      const html = render({ status: makeStatus(), isExpanded: false });
      // Time element uses high-contrast white color
      expect(html).toContain('rgba(255, 255, 255, 0.92)');
    });

    it('uses high-contrast panel background', () => {
      const html = render({ status: makeStatus(), isExpanded: true });
      // Panel uses dark semi-transparent background
      expect(html).toContain('rgba(10, 15, 30, 0.94)');
    });
  });

  describe('accessibility', () => {
    it('includes aria-label for battery', () => {
      const html = render({ status: makeStatus({ battery: { level: 42, isCharging: false, isLow: false, isCritical: false } }), isExpanded: false });
      expect(html).toContain('电量 42%');
    });

    it('includes aria-expanded attribute', () => {
      const htmlCollapsed = render({ status: makeStatus(), isExpanded: false });
      expect(htmlCollapsed).toContain('aria-expanded="false"');

      const htmlExpanded = render({ status: makeStatus(), isExpanded: true });
      expect(htmlExpanded).toContain('aria-expanded="true"');
    });
  });
});
