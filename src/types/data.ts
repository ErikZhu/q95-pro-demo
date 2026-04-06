import type { ScreenZone } from './display';
import type { Location } from './navigation';

export interface DeviceStatus {
  battery: { level: number; isCharging: boolean; isLow: boolean; isCritical: boolean };
  bluetooth: { connected: boolean; deviceName?: string };
  wifi: { connected: boolean; ssid?: string; strength?: number };
  time: string;
}

export interface TaskSummary {
  taskId: string;
  source: string;
  title: string;
  statusText: string;
  priority: number;
  timestamp: number;
}

export type RelayInfoType =
  | 'delivery'
  | 'calendar'
  | 'call'
  | 'flight'
  | 'ride'
  | 'movie'
  | 'wechat'
  | 'music';

export interface RelayInfo {
  type: RelayInfoType;
  data: Record<string, unknown>;
  timestamp: number;
  priority: number;
  isTimeSensitive: boolean;
}

export interface InfoCard {
  cardId: string;
  type: RelayInfoType;
  title: string;
  summary: string;
  priority: number;
  timestamp: number;
  template: CardTemplate;
}

export type CardTemplate =
  | 'delivery_progress'
  | 'calendar_event'
  | 'call_info'
  | 'flight_board'
  | 'ride_status'
  | 'movie_ticket'
  | 'wechat_message'
  | 'music_player';

export interface Notification {
  id: string;
  appId: string;
  appName: string;
  title: string;
  summary: string;
  timestamp: number;
  isRead: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  actionId: string;
}

export interface DeliveryCard {
  orderId: string;
  storeName: string;
  status: 'preparing' | 'picked_up' | 'delivering' | 'arrived';
  riderName: string;
  estimatedTime: number;
  progress: number;
}

export interface FlightCard {
  flightNo: string;
  airline: string;
  departure: { city: string; airport: string; time: string; gate?: string };
  arrival: { city: string; airport: string; time: string };
  status: 'on_time' | 'delayed' | 'boarding' | 'departed';
}

export interface RideCard {
  orderId: string;
  driverName: string;
  carInfo: string;
  estimatedArrival: number;
  driverLocation: Location;
}

export interface MusicCardData {
  trackName: string;
  artist: string;
  albumArt?: string;
  progress: number;
  duration: number;
  isPlaying: boolean;
}

export interface InfoCardDetail extends InfoCard {
  data: Record<string, unknown>;
  isTimeSensitive: boolean;
}

export interface GazeEvent {
  target: ScreenZone;
  duration: number;
  isGazing: boolean;
}
