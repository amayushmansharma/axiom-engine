export interface ForceVector {
  id: string;
  name: string;
  symbol: string;
  label: string;
  magnitude: number;
  unit: string;
  color: string;
  // Direction angle in degrees in screen space (0 = right, 90 = down, 180 = left, 270 = up)
  angleDeg: number;
  origin: { x: number; y: number };
  target: { x: number; y: number };
  clampedLength: number;
}

export interface VectorScaleConfig {
  pixelsPerUnit: number;
  minLength: number;
  maxLength: number;
}

export const DEFAULT_SCALE_CONFIG: VectorScaleConfig = {
  pixelsPerUnit: 1.5,
  minLength: 25,
  maxLength: 120,
};

export function computeScaledLength(
  magnitude: number,
  config: VectorScaleConfig = DEFAULT_SCALE_CONFIG
): number {
  if (magnitude <= 0.001) return 0;
  const raw = magnitude * config.pixelsPerUnit;
  return Math.min(config.maxLength, Math.max(config.minLength, raw));
}

/**
 * Helper to calculate 2D endpoint given origin, angle in degrees, and length.
 */
export function calculateTargetPoint(
  origin: { x: number; y: number },
  angleDeg: number,
  length: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: origin.x + length * Math.cos(rad),
    y: origin.y + length * Math.sin(rad),
  };
}
