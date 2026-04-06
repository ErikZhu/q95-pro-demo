import { useMemo } from 'react';
import type { RecordingState, StorageInfo } from '../../services/CameraModule';
import { Icon } from '../icons/Icon';

/**
 * CameraView — 拍照与录像界面组件
 *
 * 显示：
 * - 录制状态指示（红色圆点闪烁） — 需求 12.2
 * - 录制时长 — 需求 12.4
 * - 存储剩余空间 — 需求 12.4, 12.5
 * - 拍照/录像按钮
 * - 存储不足警告 — 需求 12.5
 *
 * 需求: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

export interface CameraViewProps {
  /** 录制状态 */
  recordingState: RecordingState;
  /** 存储信息 */
  storageInfo: StorageInfo;
  /** 拍照回调 */
  onCapture?: () => void;
  /** 开始/停止录像回调 */
  onToggleRecording?: () => void;
  /** 同步队列长度 */
  syncPending?: number;
}

/** 格式化录制时长 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/** 格式化存储空间 */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

const S = {
  container: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(10, 10, 26, 0.92)',
    display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'rgba(255, 255, 255, 0.92)', zIndex: 1400,
  },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' },
  recordingIndicator: { display: 'flex', alignItems: 'center', gap: 8 },
  redDot: { width: 8, height: 8, borderRadius: '50%', background: 'rgba(255, 90, 90, 0.95)', boxShadow: '0 0 8px rgba(255, 90, 90, 0.5)' },
  recordingTime: { fontSize: 14, fontWeight: 600, color: 'rgba(255, 90, 90, 0.95)', fontFamily: "'SF Mono', 'Fira Code', monospace", fontVariantNumeric: 'tabular-nums' as const },
  storageInfo: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' },
  storageLow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255, 180, 60, 0.9)' },
  viewfinder: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const },
  crosshair: { width: 200, height: 200, border: '1px solid rgba(100, 200, 255, 0.15)', borderRadius: 8, boxShadow: '0 0 16px rgba(100, 200, 255, 0.04)' },
  bottomBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '20px 16px 32px' },
  captureBtn: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.85)', border: '3px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 16px rgba(255, 255, 255, 0.1)', transition: 'transform 0.15s, box-shadow 0.15s',
  },
  recordBtn: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'transparent', border: '2px solid rgba(255, 255, 255, 0.4)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.15s',
  },
  recordDot: { width: 24, height: 24, borderRadius: '50%', background: 'rgba(255, 90, 90, 0.9)' },
  recordStop: { width: 20, height: 20, borderRadius: 4, background: 'rgba(255, 90, 90, 0.9)' },
  syncBadge: { fontSize: 11, color: 'rgba(100, 200, 255, 0.7)', display: 'flex', alignItems: 'center', gap: 4 },
  lowStorageWarning: {
    background: 'rgba(255, 180, 60, 0.08)', border: '1px solid rgba(255, 180, 60, 0.2)',
    borderRadius: 8, padding: '6px 12px', margin: '0 16px 8px',
    fontSize: 12, color: 'rgba(255, 180, 60, 0.95)', textAlign: 'center' as const,
  },
  resolution: { fontSize: 11, color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center' as const, paddingBottom: 4, fontFamily: "'SF Mono', 'Fira Code', monospace" },
};

export function CameraView({
  recordingState,
  storageInfo,
  onCapture,
  onToggleRecording,
  syncPending = 0,
}: CameraViewProps) {
  const storageStyle = useMemo(
    () => (storageInfo.isLow ? S.storageLow : S.storageInfo),
    [storageInfo.isLow],
  );

  return (
    <div
      data-testid="camera-view"
      role="region"
      aria-label="相机"
      style={S.container}
    >
      {/* Top bar: recording indicator + storage */}
      <div style={S.topBar} data-testid="camera-top-bar">
        {/* Recording indicator — 需求 12.2, 12.4 */}
        {recordingState.isRecording ? (
          <div style={S.recordingIndicator} data-testid="recording-indicator">
            <span style={S.redDot} data-testid="recording-dot" aria-hidden="true" />
            <span style={S.recordingTime} data-testid="recording-duration">
              {formatDuration(recordingState.duration)}
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Storage info — 需求 12.4 */}
        <div style={storageStyle} data-testid="storage-info">
          {storageInfo.isLow && <span aria-hidden="true"><Icon name="warning" size={12} /></span>}
          <span data-testid="storage-remaining">
            {formatStorage(storageInfo.remaining)} 可用
          </span>
        </div>
      </div>

      {/* Low storage warning — 需求 12.5 */}
      {storageInfo.isLow && (
        <div style={S.lowStorageWarning} data-testid="low-storage-warning" role="alert">
          存储空间不足 {formatStorage(storageInfo.remaining)}，请清理空间
        </div>
      )}

      {/* Viewfinder area */}
      <div style={S.viewfinder} data-testid="viewfinder">
        <div style={S.crosshair} />
      </div>

      {/* Resolution label — 需求 12.3 */}
      <div style={S.resolution} data-testid="resolution-label">
        {recordingState.resolution.width}×{recordingState.resolution.height}
      </div>

      {/* Sync status — 需求 12.6 */}
      {syncPending > 0 && (
        <div style={{ ...S.syncBadge, justifyContent: 'center', paddingBottom: 4 }} data-testid="sync-status">
          <span aria-hidden="true">↑</span>
          同步中 ({syncPending})
        </div>
      )}

      {/* Bottom bar: capture + record buttons */}
      <div style={S.bottomBar} data-testid="camera-controls">
        {/* Capture button — 需求 12.1 */}
        <button
          style={S.captureBtn}
          onClick={onCapture}
          data-testid="capture-btn"
          aria-label="拍照"
          disabled={recordingState.isRecording}
        />

        {/* Record button — 需求 12.2 */}
        <button
          style={S.recordBtn}
          onClick={onToggleRecording}
          data-testid="record-btn"
          aria-label={recordingState.isRecording ? '停止录像' : '开始录像'}
        >
          <span
            style={recordingState.isRecording ? S.recordStop : S.recordDot}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
