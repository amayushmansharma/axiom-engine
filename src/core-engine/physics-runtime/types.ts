import { Domain, StructuredPhysicsScene } from "@/schemas/compilerSchema";

export interface TelemetryPoint {
  t: number;
  ke: number;
  pe: number;
  totalEnergy: number;
  velocity: number;
  acceleration: number;
  momentum?: number;
  x?: number;
  y?: number;
}

export interface DerivedValues {
  // Incline
  normalForce?: number;
  frictionForce?: number;
  netForce?: number;
  acceleration?: number;
  staticEquilibrium?: boolean;

  // Atwood
  tension?: number;
  atwoodAcceleration?: number;

  // Projectile
  v_x0?: number;
  v_y0?: number;
  collisionTime?: number;
  collisionY?: number;
  collisionMomentum?: number;

  // SHM
  omega0?: number;
  gamma?: number;
  omegaD?: number;
  initialEnergy?: number;
  energyAt2s?: number;
  dampingRegime?: "underdamped" | "critically_damped" | "overdamped";

  [key: string]: number | boolean | string | undefined;
}

export interface PhysicsSceneRuntime {
  reset: () => void;
  step: (dt: number) => void;
  state: () => Record<string, unknown>;
  derived: () => DerivedValues;
  setParam: (name: string, value: number) => void;
  getTelemetryPoint: () => TelemetryPoint;
}
