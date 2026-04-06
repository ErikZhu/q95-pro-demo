/**
 * Icon — 统一 SVG 图标系统
 *
 * 现代极简线条风格，灵感来自 SF Symbols / Material Symbols Rounded。
 * 所有图标基于 24×24 viewBox，stroke-based，支持自定义 size 和 color。
 */

export type IconName =
  | 'home' | 'bell' | 'compass' | 'camera' | 'music'
  | 'ai' | 'globe' | 'text' | 'heart' | 'chat' | 'gear'
  | 'battery' | 'battery-low' | 'battery-charging'
  | 'bluetooth' | 'bluetooth-off' | 'wifi' | 'wifi-off'
  | 'grid' | 'loader' | 'alert' | 'glasses' | 'eye'
  | 'charging' | 'mic' | 'speaker' | 'volume-up' | 'volume-down'
  | 'phone' | 'calendar' | 'pin' | 'car' | 'run' | 'gamepad'
  | 'crosshair' | 'hand' | 'wave' | 'thumbsup' | 'fist' | 'pinch'
  | 'power' | 'keyboard' | 'camera-gesture' | 'swap'
  | 'folder' | 'list' | 'link' | 'warning' | 'stop' | 'play'
  | 'pause' | 'skip-forward' | 'skip-back' | 'note'
  | 'brightness' | 'lock' | 'signal' | 'touch'
  | 'nod' | 'shake' | 'point' | 'confirm' | 'back'
  | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right'
  | 'package' | 'check' | 'cooking' | 'scooter' | 'watch';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const paths: Record<IconName, string> = {
  home: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0 l3.5 6.5L12 12l-3.5-3.5z',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  ai: 'M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4zm-2 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z',
  text: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6M8 9h2',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  battery: 'M17 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm6 5v2',
  'battery-low': 'M17 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm6 5v2M4 10h3v4H4z',
  'battery-charging': 'M17 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm6 5v2M11 9l-3 3h4l-3 3',
  bluetooth: 'M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11',
  'bluetooth-off': 'M6.5 6.5l11 11L12 23V12M12 6.5V1l5.5 5.5-3.5 3.5',
  wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  'wifi-off': 'M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  loader: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  glasses: 'M2 10a4 4 0 0 0 4 4h2a2 2 0 0 0 2-2V10a4 4 0 0 0-4-4H4a2 2 0 0 0-2 2zm12 0a4 4 0 0 0 4 4h2a2 2 0 0 0 2-2V10a4 4 0 0 0-4-4h-2a2 2 0 0 0-2 2zM10 10h4',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  charging: 'M13 2L3 14h9l-1 8 10-12h-9z',
  mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  speaker: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  'volume-up': 'M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14',
  'volume-down': 'M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  car: 'M16 6l2 6h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2l2-6zM6 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  run: 'M13 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 22l3-9 3 3v6M10 13l-2-2-4 4M17 22l-3-6 2-4 4 3',
  gamepad: 'M6 12H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4l2-2h8l2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-4M6 12V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4M9 16h.01M15 16h.01',
  crosshair: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM22 12h-4M6 12H2M12 6V2M12 22v-4',
  hand: 'M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v7M10 10.5V6a2 2 0 0 0-4 0v8M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.5 0-4-1.5-5.5-3L4 15',
  wave: 'M7 11c-1.5-1.5-3-2-4-1M12 6c-1.5-1.5-3-2-4-1M17 11c1.5-1.5 3-2 4-1M12 18c1.5 1.5 3 2 4 1M7 11l5 7M17 11l-5 7',
  thumbsup: 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3',
  fist: 'M12 3a2 2 0 0 0-2 2v5M16 5a2 2 0 0 0-2 2v3M8 5a2 2 0 0 0-2 2v5M20 9a2 2 0 0 0-2 2v1M6 12a6 6 0 0 0 6 10h2a6 6 0 0 0 6-6v-4',
  pinch: 'M12 2v6M8 4l4 4 4-4M12 22v-6M8 20l4-4 4 4',
  power: 'M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10',
  keyboard: 'M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM7 7h.01M12 7h.01M17 7h.01M7 11h.01M17 11h.01M8 15h8',
  'camera-gesture': 'M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M21 15v4a2 2 0 0 1-2 2h-4M3 9V5a2 2 0 0 1 2-2h4M12 8v8M8 12h8',
  swap: 'M7 16V4M7 4l-4 4M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  stop: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  play: 'M5 3l14 9-14 9V3z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  'skip-forward': 'M5 4l10 8-10 8V4zM19 5v14',
  'skip-back': 'M19 20L9 12l10-8v16zM5 19V5',
  note: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  brightness: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  signal: 'M2 20h.01M6 16v4M10 12v8M14 8v12M18 4v16',
  touch: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5',
  nod: 'M12 2v4M12 18v4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  shake: 'M2 12h4M18 12h4M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0z',
  point: 'M12 2v8M8 6l4 4 4-4M12 14v0M12 18v0M12 22v0',
  confirm: 'M20 6L9 17l-5-5',
  back: 'M19 12H5M12 19l-7-7 7-7',
  'arrow-up': 'M12 19V5M5 12l7-7 7 7',
  'arrow-down': 'M12 5v14M19 12l-7 7-7-7',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  check: 'M20 6L9 17l-5-5',
  cooking: 'M12 2v4M6 6h12M6 6a6 6 0 0 0 12 0M8 18h8M10 22h4M9 14v4M15 14v4',
  scooter: 'M12 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 15h14M12 6v9M9 6h6',
  watch: 'M12 8v4l2 2M16.24 7.76a6 6 0 1 1-8.49 0M9 2h6M9 22h6M7.76 4.05l-1.42-1.42M17.66 4.05l1.42-1.42',
};

export function Icon({ name, size = 24, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
