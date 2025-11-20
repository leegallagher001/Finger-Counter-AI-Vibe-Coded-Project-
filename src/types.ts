export enum AppStatus {
  IDLE = 'IDLE',
  LOADING_MODEL = 'LOADING_MODEL',
  DETECTING = 'DETECTING',
  ERROR = 'ERROR',
}

export interface DetectionResult {
  fingerCount: number;
  isHandDetected: boolean;
  timestamp: number;
}

export interface FingerCountResponse {
  fingerCount: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}