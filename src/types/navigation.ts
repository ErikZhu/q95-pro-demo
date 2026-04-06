export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface Route {
  origin: Location;
  destination: Location;
  waypoints: Location[];
  distance: number;
  estimatedTime: number;
  mode: 'walk' | 'bike';
}

export interface NavigationState {
  isActive: boolean;
  currentPosition: Location;
  nextTurn: TurnInstruction;
  remainingDistance: number;
  estimatedArrival: number;
  gpsSignal: 'strong' | 'weak' | 'lost';
}

export interface TurnInstruction {
  direction: 'left' | 'right' | 'straight' | 'uturn';
  distance: number;
  streetName?: string;
}
