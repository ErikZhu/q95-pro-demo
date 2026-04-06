import type { InputSource } from './interaction';
import type { RelayInfoType } from './data';

export interface UserSettings {
  displayBrightness: number;
  fontSize: number;
  notificationPrefs: Record<string, boolean>;
  interactionPriority: InputSource[];
  relayAllowedTypes: RelayInfoType[];
  autoBrightness: boolean;
  wakeWord: string;
}
