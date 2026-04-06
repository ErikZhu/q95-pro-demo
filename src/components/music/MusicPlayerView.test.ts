import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MusicPlayerView } from './MusicPlayerView';
import type { MusicPlayerViewProps } from './MusicPlayerView';
import type { PlaybackState, Track } from '../../services/MusicPlayer';

/**
 * MusicPlayerView 单元测试
 * 需求: 13.1, 13.2, 13.3, 13.4, 13.5
 */

function makeTrack(overrides?: Partial<Track>): Track {
  return {
    id: 'track_1',
    name: '晴天',
    artist: '周杰伦',
    album: '叶惠美',
    duration: 269,
    ...overrides,
  };
}

function makeState(overrides?: Partial<PlaybackState>): PlaybackState {
  return {
    status: 'paused',
    currentTrack: makeTrack(),
    progress: 60,
    volume: 50,
    pauseReason: 'user',
    ...overrides,
  };
}

function makeProps(overrides?: Partial<MusicPlayerViewProps>): MusicPlayerViewProps {
  return {
    playbackState: makeState(),
    ...overrides,
  };
}

function render(props: MusicPlayerViewProps): string {
  return renderToStaticMarkup(createElement(MusicPlayerView, props));
}

describe('MusicPlayerView', () => {
  // ─── 基本渲染 ───

  describe('基本渲染', () => {
    it('renders music player container', () => {
      const html = render(makeProps());
      expect(html).toContain('music-player-view');
    });

    it('renders playback controls', () => {
      const html = render(makeProps());
      expect(html).toContain('playback-controls');
    });

    it('renders volume container', () => {
      const html = render(makeProps());
      expect(html).toContain('volume-container');
    });

    it('renders album art placeholder', () => {
      const html = render(makeProps());
      expect(html).toContain('album-art');
    });
  });

  // ─── 曲目信息显示 — 需求 13.3 ───

  describe('曲目信息 (需求 13.3)', () => {
    it('shows track name', () => {
      const html = render(makeProps());
      expect(html).toContain('track-name');
      expect(html).toContain('晴天');
    });

    it('shows artist name', () => {
      const html = render(makeProps());
      expect(html).toContain('track-artist');
      expect(html).toContain('周杰伦');
    });

    it('shows no-track message when no current track', () => {
      const html = render(makeProps({
        playbackState: makeState({ currentTrack: null }),
      }));
      expect(html).toContain('no-track');
      expect(html).toContain('暂无播放曲目');
    });
  });

  // ─── 播放控制按钮 — 需求 13.1 ───

  describe('播放控制 (需求 13.1)', () => {
    it('shows play button when paused', () => {
      const html = render(makeProps({
        playbackState: makeState({ status: 'paused' }),
      }));
      expect(html).toContain('aria-label="播放"');
      expect(html).toContain('play-pause-btn');
    });

    it('shows pause button when playing', () => {
      const html = render(makeProps({
        playbackState: makeState({ status: 'playing' }),
      }));
      expect(html).toContain('aria-label="暂停"');
      expect(html).toContain('play-pause-btn');
    });

    it('renders prev button', () => {
      const html = render(makeProps());
      expect(html).toContain('prev-btn');
      expect(html).toContain('aria-label="上一曲"');
    });

    it('renders next button', () => {
      const html = render(makeProps());
      expect(html).toContain('next-btn');
      expect(html).toContain('aria-label="下一曲"');
    });
  });

  // ─── 音量滑块 — 需求 13.1 ───

  describe('音量滑块 (需求 13.1)', () => {
    it('renders volume slider', () => {
      const html = render(makeProps());
      expect(html).toContain('volume-slider');
      expect(html).toContain('aria-label="音量"');
    });

    it('shows current volume value', () => {
      const html = render(makeProps({
        playbackState: makeState({ volume: 75 }),
      }));
      expect(html).toContain('volume-value');
      expect(html).toContain('75');
    });
  });

  // ─── 进度条 ───

  describe('进度条', () => {
    it('renders progress container', () => {
      const html = render(makeProps());
      expect(html).toContain('progress-container');
    });

    it('shows current time', () => {
      const html = render(makeProps({
        playbackState: makeState({ progress: 65 }),
      }));
      expect(html).toContain('progress-current');
      expect(html).toContain('01:05');
    });

    it('shows total duration', () => {
      const html = render(makeProps());
      expect(html).toContain('progress-total');
      expect(html).toContain('04:29'); // 269 seconds
    });

    it('shows 00:00 total when no track', () => {
      const html = render(makeProps({
        playbackState: makeState({ currentTrack: null }),
      }));
      expect(html).toContain('00:00');
    });
  });

  // ─── 手机同步状态 — 需求 13.4 ───

  describe('手机同步 (需求 13.4)', () => {
    it('shows phone sync status when connected', () => {
      const html = render(makeProps({
        phoneSyncConnected: true,
        phoneSyncApp: 'QQ音乐',
      }));
      expect(html).toContain('phone-sync-status');
      expect(html).toContain('已连接');
      expect(html).toContain('QQ音乐');
    });

    it('does not show phone sync when not connected', () => {
      const html = render(makeProps({ phoneSyncConnected: false }));
      expect(html).not.toContain('phone-sync-status');
    });

    it('shows default text when no app name', () => {
      const html = render(makeProps({
        phoneSyncConnected: true,
        phoneSyncApp: null,
      }));
      expect(html).toContain('已连接');
      expect(html).toContain('手机');
    });
  });

  // ─── 无障碍 ───

  describe('无障碍', () => {
    it('has region role', () => {
      const html = render(makeProps());
      expect(html).toContain('role="region"');
    });

    it('has aria-label', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="音乐播放器"');
    });

    it('play/pause button has aria-label', () => {
      const html = render(makeProps());
      expect(html).toContain('play-pause-btn');
    });

    it('volume slider has aria-label', () => {
      const html = render(makeProps());
      expect(html).toContain('aria-label="音量"');
    });
  });
});
