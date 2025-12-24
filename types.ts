import { Vector3 } from 'three';

export enum AppState {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE',
}

export interface ParticleData {
  position: Vector3;
  scale: number;
  rotation: Vector3;
}

export interface HandGesture {
  isPinching: boolean;
  handPresent: boolean;
  palmPositionX: number; // Normalized 0-1
}

export interface GeneratorParams {
  count: number;
  type: 'leaf' | 'ribbon' | 'decor';
}