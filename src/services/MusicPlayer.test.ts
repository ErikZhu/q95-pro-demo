import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MusicPlayer } from './MusicPlayer';
import type { Track } from './MusicPlayer';

/**
 * MusicPlayer 单元测试
 * 需求: 13.1, 13.2, 13.3, 13.4, 13.5
 */

function makeTracks(count = 3): Track[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `track_${i + 1}`,
    name: `Song ${i + 1}`,
    artist: `Artist ${i + 1}`,
    album: `Album ${i + 1}`,
    duration: 180 + i * 30, // 180s, 210s, 240s
  }));
}

describe('MusicPlayer', () => {
  let player: MusicPlayer;
  const tracks = makeTracks();

  beforeEach(() => {
    player = new MusicPlayer(tracks);
  });

  afterEach(() => {
    player.dispose();
  });

  // ─── 初始状态 ───

  describe('初始状态', () => {
    it('starts in stopped status', () => {
      expect(player.getPlaybackState().status).toBe('stopped');
    });

    it('has default volume of 50', () => {
      expect(player.getPlaybackState().volume).toBe(50);
    });

    it('has first track as current when playlist provided', () => {
      expect(player.getCurrentTrack()?.id).toBe('track_1');
    });

    it('has null current track when no playlist', () => {
      const empty = new MusicPlayer();
      expect(empty.getCurrentTrack()).toBeNull();
      empty.dispose();
    });

    it('has zero progress', () => {
      expect(player.getPlaybackState().progress).toBe(0);
    });

    it('has no pause reason', () => {
      expect(player.getPlaybackState().pauseReason).toBeNull();
    });
  });

  // ─── 播放控制 — 需求 13.1 ───

  describe('play/pause (需求 13.1)', () => {
    it('play sets status to playing', () => {
      player.play();
      expect(player.getPlaybackState().status).toBe('playing');
    });

    it('pause sets status to paused', () => {
      player.play();
      player.pause();
      expect(player.getPlaybackState().status).toBe('paused');
    });

    it('pause does nothing when not playing', () => {
      player.pause();
      expect(player.getPlaybackState().status).toBe('stopped');
    });

    it('play does nothing with empty playlist', () => {
      const empty = new MusicPlayer();
      empty.play();
      expect(empty.getPlaybackState().status).toBe('stopped');
      empty.dispose();
    });

    it('pause records user reason by default', () => {
      player.play();
      player.pause();
      expect(player.getPlaybackState().pauseReason).toBe('user');
    });

    it('play clears pause reason', () => {
      player.play();
      player.pause();
      player.play();
      expect(player.getPlaybackState().pauseReason).toBeNull();
    });
  });

  // ─── 上一曲/下一曲 — 需求 13.1 ───

  describe('next/prev (需求 13.1)', () => {
    it('next advances to next track', () => {
      player.next();
      expect(player.getCurrentTrack()?.id).toBe('track_2');
    });

    it('next wraps around to first track', () => {
      player.next(); // track 2
      player.next(); // track 3
      player.next(); // track 1
      expect(player.getCurrentTrack()?.id).toBe('track_1');
    });

    it('next resets progress to 0', () => {
      player.play();
      player.next();
      expect(player.getPlaybackState().progress).toBe(0);
    });

    it('prev goes to previous track when progress <= 3', () => {
      player.next(); // track 2
      player.prev(); // track 1
      expect(player.getCurrentTrack()?.id).toBe('track_1');
    });

    it('prev wraps around to last track', () => {
      player.prev(); // from track 1 to track 3 (progress is 0)
      expect(player.getCurrentTrack()?.id).toBe('track_3');
    });

    it('next/prev do nothing with empty playlist', () => {
      const empty = new MusicPlayer();
      empty.next();
      empty.prev();
      expect(empty.getCurrentTrack()).toBeNull();
      empty.dispose();
    });
  });

  // ─── 音量控制 — 需求 13.1 ───

  describe('setVolume (需求 13.1)', () => {
    it('sets volume within range', () => {
      player.setVolume(75);
      expect(player.getPlaybackState().volume).toBe(75);
    });

    it('clamps volume to 0 minimum', () => {
      player.setVolume(-10);
      expect(player.getPlaybackState().volume).toBe(0);
    });

    it('clamps volume to 100 maximum', () => {
      player.setVolume(150);
      expect(player.getPlaybackState().volume).toBe(100);
    });

    it('rounds volume to integer', () => {
      player.setVolume(33.7);
      expect(player.getPlaybackState().volume).toBe(34);
    });
  });

  // ─── 侧边触控双击切换 — 需求 13.2 ───

  describe('togglePlayPause (需求 13.2)', () => {
    it('starts playing when stopped', () => {
      player.togglePlayPause();
      expect(player.getPlaybackState().status).toBe('playing');
    });

    it('pauses when playing', () => {
      player.play();
      player.togglePlayPause();
      expect(player.getPlaybackState().status).toBe('paused');
    });

    it('resumes when paused', () => {
      player.play();
      player.togglePlayPause(); // pause
      player.togglePlayPause(); // play
      expect(player.getPlaybackState().status).toBe('playing');
    });
  });

  // ─── 当前曲目信息 — 需求 13.3 ───

  describe('getCurrentTrack (需求 13.3)', () => {
    it('returns current track info', () => {
      const track = player.getCurrentTrack();
      expect(track).not.toBeNull();
      expect(track!.name).toBe('Song 1');
      expect(track!.artist).toBe('Artist 1');
      expect(track!.duration).toBe(180);
    });

    it('returns a copy (immutable)', () => {
      const track = player.getCurrentTrack()!;
      track.name = 'Modified';
      expect(player.getCurrentTrack()!.name).toBe('Song 1');
    });
  });

  // ─── 配对手机联动 — 需求 13.4 ───

  describe('手机联动 (需求 13.4)', () => {
    it('connects to phone app', () => {
      player.connectPhoneApp('QQ音乐');
      const sync = player.getPhoneSyncState();
      expect(sync.connected).toBe(true);
      expect(sync.appName).toBe('QQ音乐');
    });

    it('disconnects from phone app', () => {
      player.connectPhoneApp('QQ音乐');
      player.disconnectPhoneApp();
      const sync = player.getPhoneSyncState();
      expect(sync.connected).toBe(false);
      expect(sync.appName).toBeNull();
    });

    it('syncs track from phone', () => {
      player.connectPhoneApp('网易云音乐');
      const phoneTrack: Track = {
        id: 'phone_1',
        name: '晴天',
        artist: '周杰伦',
        album: '叶惠美',
        duration: 269,
      };
      player.syncFromPhone(phoneTrack, 60, true);
      expect(player.getCurrentTrack()?.id).toBe('phone_1');
      expect(player.getPlaybackState().status).toBe('playing');
      expect(player.getPlaybackState().progress).toBe(60);
    });

    it('ignores sync when not connected', () => {
      const phoneTrack: Track = {
        id: 'phone_1',
        name: '晴天',
        artist: '周杰伦',
        album: '叶惠美',
        duration: 269,
      };
      player.syncFromPhone(phoneTrack, 60, true);
      // Should not change current track
      expect(player.getCurrentTrack()?.id).toBe('track_1');
    });

    it('syncs paused state from phone', () => {
      player.connectPhoneApp('QQ音乐');
      player.play();
      const phoneTrack: Track = {
        id: 'phone_1',
        name: '晴天',
        artist: '周杰伦',
        album: '叶惠美',
        duration: 269,
      };
      player.syncFromPhone(phoneTrack, 30, false);
      expect(player.getPlaybackState().status).toBe('paused');
      expect(player.getPlaybackState().pauseReason).toBe('phone_sync');
    });

    it('getPhoneSyncState returns a copy', () => {
      player.connectPhoneApp('QQ音乐');
      const state = player.getPhoneSyncState();
      state.connected = false;
      expect(player.getPhoneSyncState().connected).toBe(true);
    });
  });

  // ─── 来电自动暂停 — 需求 13.5 ───

  describe('来电自动暂停 (需求 13.5)', () => {
    it('pauses on incoming call', () => {
      player.play();
      player.onIncomingCall();
      expect(player.getPlaybackState().status).toBe('paused');
      expect(player.getPlaybackState().pauseReason).toBe('incoming_call');
    });

    it('does nothing if not playing', () => {
      player.onIncomingCall();
      expect(player.getPlaybackState().status).toBe('stopped');
    });

    it('resumes after call ends', () => {
      player.play();
      player.onIncomingCall();
      player.onCallEnded();
      expect(player.getPlaybackState().status).toBe('playing');
      expect(player.getPlaybackState().pauseReason).toBeNull();
    });

    it('does not resume if paused by user', () => {
      player.play();
      player.pause('user');
      player.onCallEnded();
      expect(player.getPlaybackState().status).toBe('paused');
    });

    it('does not resume if not paused by call', () => {
      player.play();
      player.pause('phone_sync');
      player.onCallEnded();
      expect(player.getPlaybackState().status).toBe('paused');
    });
  });

  // ─── 播放列表管理 ───

  describe('播放列表管理', () => {
    it('setPlaylist replaces tracks', () => {
      const newTracks = makeTracks(2);
      player.setPlaylist(newTracks);
      expect(player.getPlaylist()).toHaveLength(2);
      expect(player.getCurrentTrack()?.id).toBe('track_1');
    });

    it('setPlaylist resets progress', () => {
      player.play();
      player.setPlaylist(makeTracks(1));
      expect(player.getPlaybackState().progress).toBe(0);
      expect(player.getPlaybackState().status).toBe('stopped');
    });

    it('setPlaylist with empty array clears current track', () => {
      player.setPlaylist([]);
      expect(player.getCurrentTrack()).toBeNull();
    });

    it('getPlaylist returns a copy', () => {
      const list = player.getPlaylist();
      list.length = 0;
      expect(player.getPlaylist()).toHaveLength(3);
    });
  });

  // ─── getPlaybackState ───

  describe('getPlaybackState', () => {
    it('returns complete state', () => {
      const state = player.getPlaybackState();
      expect(state.status).toBeDefined();
      expect(state.currentTrack).toBeDefined();
      expect(state.progress).toBeDefined();
      expect(state.volume).toBeDefined();
      expect(state.pauseReason).toBeDefined();
    });
  });
});
