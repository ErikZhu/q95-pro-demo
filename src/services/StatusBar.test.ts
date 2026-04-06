import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  let bar: StatusBar;

  beforeEach(() => {
    bar = new StatusBar();
  });

  afterEach(() => {
    bar.destroy();
  });

  describe('getStatus (需求 4.1)', () => {
    it('returns default status with full battery and no connections', () => {
      const s = bar.getStatus();
      expect(s.battery.level).toBe(100);
      expect(s.battery.isCharging).toBe(false);
      expect(s.battery.isLow).toBe(false);
      expect(s.battery.isCritical).toBe(false);
      expect(s.bluetooth.connected).toBe(false);
      expect(s.wifi.connected).toBe(false);
      expect(s.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('returns a copy, not a reference', () => {
      const s = bar.getStatus();
      s.battery.level = 0;
      expect(bar.getStatus().battery.level).toBe(100);
    });
  });

  describe('updateBattery (需求 4.1, 4.2, 4.3)', () => {
    it('updates battery level and charging state', () => {
      bar.updateBattery(75, true);
      const s = bar.getStatus();
      expect(s.battery.level).toBe(75);
      expect(s.battery.isCharging).toBe(true);
      expect(s.battery.isLow).toBe(false);
      expect(s.battery.isCritical).toBe(false);
    });

    it('clamps battery level to 0-100', () => {
      bar.updateBattery(-10, false);
      expect(bar.getStatus().battery.level).toBe(0);
      bar.updateBattery(200, false);
      expect(bar.getStatus().battery.level).toBe(100);
    });

    // 需求 4.2: 电量 <20% → isLow=true
    it('sets isLow=true when battery < 20%', () => {
      bar.updateBattery(19, false);
      expect(bar.getStatus().battery.isLow).toBe(true);
    });

    it('sets isLow=false when battery = 20%', () => {
      bar.updateBattery(20, false);
      expect(bar.getStatus().battery.isLow).toBe(false);
    });

    // 需求 4.3: 电量 <5% → isCritical=true
    it('sets isCritical=true when battery < 5%', () => {
      bar.updateBattery(4, false);
      expect(bar.getStatus().battery.isCritical).toBe(true);
      expect(bar.getStatus().battery.isLow).toBe(true);
    });

    it('sets isCritical=false when battery = 5%', () => {
      bar.updateBattery(5, false);
      expect(bar.getStatus().battery.isCritical).toBe(false);
      expect(bar.getStatus().battery.isLow).toBe(true); // still low
    });

    it('fires onLowBattery callback when level < 20% and >= 5%', () => {
      const onLow = vi.fn();
      bar.setCallbacks({ onLowBattery: onLow });
      bar.updateBattery(15, false);
      expect(onLow).toHaveBeenCalledWith(15);
    });

    it('fires onCriticalBattery callback when level < 5%', () => {
      const onCritical = vi.fn();
      bar.setCallbacks({ onCriticalBattery: onCritical });
      bar.updateBattery(3, false);
      expect(onCritical).toHaveBeenCalledWith(3);
    });

    it('does not fire onLowBattery when level is critical (fires onCriticalBattery instead)', () => {
      const onLow = vi.fn();
      const onCritical = vi.fn();
      bar.setCallbacks({ onLowBattery: onLow, onCriticalBattery: onCritical });
      bar.updateBattery(2, false);
      expect(onCritical).toHaveBeenCalledWith(2);
      expect(onLow).not.toHaveBeenCalled();
    });
  });

  describe('updateConnection (需求 4.4)', () => {
    it('updates bluetooth connection status', () => {
      bar.updateConnection('bluetooth', true, 'AirPods Pro');
      const s = bar.getStatus();
      expect(s.bluetooth.connected).toBe(true);
      expect(s.bluetooth.deviceName).toBe('AirPods Pro');
    });

    it('updates wifi connection status', () => {
      bar.updateConnection('wifi', true, 'HomeNetwork');
      const s = bar.getStatus();
      expect(s.wifi.connected).toBe(true);
      expect(s.wifi.ssid).toBe('HomeNetwork');
    });

    it('clears wifi strength when disconnected', () => {
      bar.updateConnection('wifi', true, 'Net');
      bar.updateConnection('wifi', false);
      expect(bar.getStatus().wifi.strength).toBeUndefined();
    });

    it('fires onStatusChange callback on connection update', () => {
      const onChange = vi.fn();
      bar.setCallbacks({ onStatusChange: onChange });
      bar.updateConnection('bluetooth', true, 'Device');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].bluetooth.connected).toBe(true);
    });
  });

  describe('updateWifiStrength', () => {
    it('updates wifi strength when connected', () => {
      bar.updateConnection('wifi', true, 'Net');
      bar.updateWifiStrength(75);
      expect(bar.getStatus().wifi.strength).toBe(75);
    });

    it('clamps wifi strength to 0-100', () => {
      bar.updateConnection('wifi', true, 'Net');
      bar.updateWifiStrength(150);
      expect(bar.getStatus().wifi.strength).toBe(100);
      bar.updateWifiStrength(-10);
      expect(bar.getStatus().wifi.strength).toBe(0);
    });

    it('does nothing when wifi is disconnected', () => {
      bar.updateWifiStrength(50);
      expect(bar.getStatus().wifi.strength).toBeUndefined();
    });
  });

  describe('expand / collapse (需求 4.5)', () => {
    it('starts collapsed', () => {
      expect(bar.isExpanded()).toBe(false);
    });

    it('can expand and collapse', () => {
      bar.expand();
      expect(bar.isExpanded()).toBe(true);
      bar.collapse();
      expect(bar.isExpanded()).toBe(false);
    });
  });

  describe('time management', () => {
    it('setTime updates the time string', () => {
      bar.setTime('14:30');
      expect(bar.getStatus().time).toBe('14:30');
    });

    it('formatTime produces HH:MM format', () => {
      const d = new Date(2024, 0, 1, 9, 5);
      expect(StatusBar.formatTime(d)).toBe('09:05');
    });

    it('formatTime pads single digits', () => {
      const d = new Date(2024, 0, 1, 0, 0);
      expect(StatusBar.formatTime(d)).toBe('00:00');
    });
  });

  describe('callbacks', () => {
    it('onStatusChange fires on battery update', () => {
      const onChange = vi.fn();
      bar.setCallbacks({ onStatusChange: onChange });
      bar.updateBattery(50, false);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('onStatusChange fires on setTime', () => {
      const onChange = vi.fn();
      bar.setCallbacks({ onStatusChange: onChange });
      bar.setTime('12:00');
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('constructor with callbacks', () => {
    it('accepts callbacks in constructor', () => {
      const onLow = vi.fn();
      const barWithCb = new StatusBar({ onLowBattery: onLow });
      barWithCb.updateBattery(10, false);
      expect(onLow).toHaveBeenCalledWith(10);
      barWithCb.destroy();
    });
  });
});
