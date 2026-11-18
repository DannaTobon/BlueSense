export type ConnectionStatus = 'online' | 'offline';

export type MonitoringSnapshot = {
  connectionStatus: ConnectionStatus;
  levelPercentage: number;
  estimatedLiters: number;
  capacityLiters: number;
  distanceCm: number;
  lastSeenLabel: string;
  recommendation: string;
};

export type MonitoringReading = {
  id: string;
  timeLabel: string;
  levelPercentage: number;
  estimatedLiters: number;
  changeLabel: string;
};

export const DEMO_MONITORING_SNAPSHOT: MonitoringSnapshot = {
  connectionStatus: 'online',
  levelPercentage: 68,
  estimatedLiters: 816,
  capacityLiters: 1200,
  distanceCm: 42,
  lastSeenLabel: 'Hace 4 minutos',
  recommendation: 'El nivel es suficiente. Revisa de nuevo durante el día.',
};

export const DEMO_MONITORING_READINGS: MonitoringReading[] = [
  {
    id: 'reading-1200',
    timeLabel: 'Hoy, 12:00',
    levelPercentage: 68,
    estimatedLiters: 816,
    changeLabel: 'Sin cambios importantes',
  },
  {
    id: 'reading-1155',
    timeLabel: 'Hoy, 11:55',
    levelPercentage: 69,
    estimatedLiters: 828,
    changeLabel: '-12 L',
  },
  {
    id: 'reading-1150',
    timeLabel: 'Hoy, 11:50',
    levelPercentage: 69,
    estimatedLiters: 828,
    changeLabel: 'Sin cambios',
  },
  {
    id: 'reading-1145',
    timeLabel: 'Hoy, 11:45',
    levelPercentage: 70,
    estimatedLiters: 840,
    changeLabel: '-12 L',
  },
  {
    id: 'reading-1140',
    timeLabel: 'Hoy, 11:40',
    levelPercentage: 70,
    estimatedLiters: 840,
    changeLabel: 'Sin cambios',
  },
];
