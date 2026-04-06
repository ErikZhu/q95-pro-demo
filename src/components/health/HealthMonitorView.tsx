import { useMemo } from 'react';
import type { HealthMonitorState } from '../../services/HealthMonitor';
import { Icon } from '../icons/Icon';

/**
 * HealthMonitorView — 健康与运动数据界面组件
 *
 * 显示：
 * - 步数、心率、卡路里等基础健康数据 — 需求 16.1
 * - 运动类型与运动数据实时显示 — 需求 16.2, 16.3
 * - 设备同步状态 — 需求 16.4
 * - 心率异常警告 — 需求 16.5
 *
 * 需求: 16.1, 16.2, 16.3, 16.4, 16.5
 */

export interface HealthMonitorViewProps {
  /** 健康监测状态 */
  state: HealthMonitorState;
  /** 开始运动 */
  onStartWorkout?: () => void;
  /** 停止运动 */
  onStopWorkout?: () => void;
  /** 清除警告 */
  onClearAlerts?: () => void;
}

/** 格式化运动时长 mm:ss */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** 格式化距离 */
function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

/** 运动类型中文名 */
function getExerciseLabel(type: string): string {
  const map: Record<string, string> = {
    walking: '步行',
    running: '跑步',
    cycling: '骑行',
    swimming: '游泳',
    hiking: '徒步',
    unknown: '运动',
  };
  return map[type] ?? '运动';
}

const S = {
  container: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(15, 30, 25, 0.96), rgba(10, 10, 26, 0.98))', display: 'flex', flexDirection: 'column' as const, fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(255, 255, 255, 0.92)', zIndex: 1400 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(10, 15, 30, 0.96)', borderBottom: '1px solid rgba(100, 200, 255, 0.06)' },
  title: { fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)' },
  deviceBadge: { fontSize: 11, color: 'rgba(80, 220, 160, 0.9)', background: 'rgba(80, 220, 160, 0.08)', borderRadius: 10, padding: '2px 8px', border: '1px solid rgba(80, 220, 160, 0.15)' },
  deviceDisconnected: { fontSize: 11, color: 'rgba(255, 180, 60, 0.9)', background: 'rgba(255, 180, 60, 0.08)', borderRadius: 10, padding: '2px 8px', border: '1px solid rgba(255, 180, 60, 0.15)' },
  content: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 24, padding: '24px 16px' },
  statsGrid: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, justifyContent: 'center' },
  statCard: { background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: '16px 20px', minWidth: 100, textAlign: 'center' as const, border: '1px solid rgba(100, 200, 255, 0.06)' },
  statValue: { fontSize: 28, fontWeight: 700, fontFamily: "'SF Mono', 'Fira Code', monospace", fontVariantNumeric: 'tabular-nums' as const },
  statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', marginTop: 4, letterSpacing: 0.3 },
  workoutSection: { width: '100%', maxWidth: 320, background: 'rgba(100, 200, 255, 0.04)', borderRadius: 12, padding: 16, border: '1px solid rgba(100, 200, 255, 0.1)' },
  workoutTitle: { fontSize: 14, fontWeight: 600, color: 'rgba(100, 200, 255, 0.9)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 },
  workoutStats: { display: 'flex', justifyContent: 'space-around', gap: 8 },
  workoutStat: { textAlign: 'center' as const },
  workoutStatValue: { fontSize: 20, fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', fontFamily: "'SF Mono', 'Fira Code', monospace", fontVariantNumeric: 'tabular-nums' as const },
  workoutStatLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.35)', marginTop: 2 },
  alertBanner: { width: '100%', maxWidth: 320, background: 'rgba(255, 90, 90, 0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255, 90, 90, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  alertText: { fontSize: 13, color: 'rgba(255, 90, 90, 0.95)', flex: 1 },
  clearBtn: { fontSize: 11, color: 'rgba(255, 255, 255, 0.45)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(100, 200, 255, 0.1)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', transition: 'background 0.15s' },
  controlBar: { padding: '12px 16px', background: 'rgba(10, 15, 30, 0.96)', borderTop: '1px solid rgba(100, 200, 255, 0.06)', display: 'flex', justifyContent: 'center' },
  workoutBtn: { padding: '10px 32px', borderRadius: 24, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'background 0.15s, box-shadow 0.15s' },
  startBtn: { background: 'rgba(80, 220, 160, 0.1)', color: 'rgba(80, 220, 160, 0.95)', border: '1px solid rgba(80, 220, 160, 0.3)' },
  stopBtn: { background: 'rgba(255, 90, 90, 0.1)', color: 'rgba(255, 90, 90, 0.95)', border: '1px solid rgba(255, 90, 90, 0.3)' },
};

function getHeartRateColor(bpm: number): string {
  if (bpm > 180 || (bpm > 0 && bpm < 50)) return 'rgba(255, 80, 80, 0.95)';
  if (bpm > 140) return 'rgba(255, 180, 50, 0.95)';
  return 'rgba(100, 220, 100, 0.95)';
}

export function HealthMonitorView({
  state,
  onStartWorkout,
  onStopWorkout,
  onClearAlerts,
}: HealthMonitorViewProps) {
  const { healthData, currentWorkout, alerts, deviceConnected, deviceName } = state;

  const latestAlert = useMemo(
    () => (alerts.length > 0 ? alerts[alerts.length - 1] : null),
    [alerts],
  );

  const heartRateColor = useMemo(
    () => getHeartRateColor(healthData.heartRate),
    [healthData.heartRate],
  );

  const isWorkoutActive = currentWorkout?.isActive ?? false;

  return (
    <div
      data-testid="health-monitor-view"
      role="region"
      aria-label="健康监测"
      style={S.container}
    >
      {/* Top bar */}
      <div style={S.topBar} data-testid="health-top-bar">
        <span style={S.title}>健康监测</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {deviceConnected ? (
            <span style={S.deviceBadge} data-testid="device-connected">
              <Icon name="watch" size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {deviceName ?? '已连接'}
            </span>
          ) : (
            <span style={S.deviceDisconnected} data-testid="device-disconnected">
              <Icon name="watch" size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} /> 未连接
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {/* Heart rate alert — 需求 16.5 */}
        {latestAlert && (
          <div style={S.alertBanner} data-testid="heart-rate-alert" role="alert">
            <span style={S.alertText}><Icon name="warning" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{latestAlert.message}</span>
            <button
              style={S.clearBtn}
              onClick={onClearAlerts}
              data-testid="clear-alerts-btn"
              aria-label="清除警告"
            >
              清除
            </button>
          </div>
        )}

        {/* Basic health stats — 需求 16.1 */}
        <div style={S.statsGrid} data-testid="health-stats">
          <div style={S.statCard} data-testid="stat-steps">
            <div style={{ ...S.statValue, color: 'rgba(100, 200, 255, 0.95)' }}>
              {healthData.steps.toLocaleString()}
            </div>
            <div style={S.statLabel}>步数</div>
          </div>
          <div style={S.statCard} data-testid="stat-heart-rate">
            <div style={{ ...S.statValue, color: heartRateColor }}>
              {healthData.heartRate}
            </div>
            <div style={S.statLabel}>心率 BPM</div>
          </div>
          <div style={S.statCard} data-testid="stat-calories">
            <div style={{ ...S.statValue, color: 'rgba(255, 180, 50, 0.95)' }}>
              {Math.round(healthData.calories)}
            </div>
            <div style={S.statLabel}>卡路里</div>
          </div>
        </div>

        {/* Workout session — 需求 16.2, 16.3 */}
        {isWorkoutActive && currentWorkout && (
          <div style={S.workoutSection} data-testid="workout-session">
            <div style={S.workoutTitle}>
              <Icon name="run" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{getExerciseLabel(currentWorkout.type)} 记录中
            </div>
            <div style={S.workoutStats}>
              <div style={S.workoutStat}>
                <div style={S.workoutStatValue} data-testid="workout-duration">
                  {formatDuration(currentWorkout.duration)}
                </div>
                <div style={S.workoutStatLabel}>时长</div>
              </div>
              <div style={S.workoutStat}>
                <div style={S.workoutStatValue} data-testid="workout-distance">
                  {formatDistance(currentWorkout.distance)}
                </div>
                <div style={S.workoutStatLabel}>距离</div>
              </div>
              <div style={S.workoutStat}>
                <div style={S.workoutStatValue} data-testid="workout-heart-rate">
                  {currentWorkout.heartRate}
                </div>
                <div style={S.workoutStatLabel}>心率</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div style={S.controlBar} data-testid="control-bar">
        {isWorkoutActive ? (
          <button
            style={{ ...S.workoutBtn, ...S.stopBtn }}
            onClick={onStopWorkout}
            data-testid="stop-workout-btn"
            aria-label="停止运动"
          >
            <Icon name="stop" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 停止运动
          </button>
        ) : (
          <button
            style={{ ...S.workoutBtn, ...S.startBtn }}
            onClick={onStartWorkout}
            data-testid="start-workout-btn"
            aria-label="开始运动"
          >
            <Icon name="play" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 开始运动
          </button>
        )}
      </div>
    </div>
  );
}
