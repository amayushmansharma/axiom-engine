import { DerivedValues, PhysicsSceneRuntime, TelemetryPoint } from "./types";

export interface AtwoodParams {
  m1: number; // mass on table (kg)
  m2: number; // hanging mass (kg)
  mu: number; // friction coefficient on table
  g: number; // gravity (m/s^2)
  tableLength?: number; // max travel before stop (m)
}

export function computeAtwoodDerived(params: AtwoodParams): DerivedValues {
  const { m1, m2, mu, g } = params;

  // Check if hanging mass overcomes friction
  if (m2 <= mu * m1) {
    return {
      atwoodAcceleration: 0,
      tension: m2 * g,
      frictionForce: m2 * g,
      normalForce: m1 * g,
      staticEquilibrium: true,
    };
  }

  const atwoodAcceleration = ((m2 - mu * m1) * g) / (m1 + m2);
  const tension = m1 * atwoodAcceleration + mu * m1 * g;
  const frictionForce = mu * m1 * g;
  const normalForce = m1 * g;

  return {
    atwoodAcceleration,
    tension,
    frictionForce,
    normalForce,
    staticEquilibrium: false,
  };
}

export function createAtwoodRuntime(initialParams: AtwoodParams): PhysicsSceneRuntime {
  let params = { ...initialParams, tableLength: initialParams.tableLength || 4.0 };
  let t = 0;
  let s = 0; // distance moved (m)
  let v = 0; // velocity (m/s)
  let isStopped = false;

  function reset() {
    t = 0;
    s = 0;
    v = 0;
    isStopped = false;
  }

  function step(dt: number) {
    if (isStopped) return;

    const d = computeAtwoodDerived(params);
    const a = d.atwoodAcceleration ?? 0;

    if (a === 0 && v === 0) {
      t += dt;
      return;
    }

    v += a * dt;
    s += v * dt;
    t += dt;

    const maxTravel = params.tableLength || 4.0;
    if (s >= maxTravel) {
      s = maxTravel;
      v = 0;
      isStopped = true;
    }
  }

  function state() {
    return {
      t,
      s,
      v,
      isStopped,
      params,
    };
  }

  function derived() {
    return computeAtwoodDerived(params);
  }

  function setParam(name: string, value: number) {
    if (name in params) {
      (params as Record<string, number>)[name] = value;
      reset();
    }
  }

  function getTelemetryPoint(): TelemetryPoint {
    const d = computeAtwoodDerived(params);
    const a = isStopped ? 0 : (d.atwoodAcceleration ?? 0);

    // Total KE of both blocks: 1/2 (m1 + m2) v^2
    const ke = 0.5 * (params.m1 + params.m2) * v * v;
    // PE of hanging block relative to lowest point: m2 * g * (maxTravel - s)
    const maxTravel = params.tableLength || 4.0;
    const pe = params.m2 * params.g * Math.max(0, maxTravel - s);
    const totalEnergy = ke + pe;

    return {
      t,
      ke,
      pe,
      totalEnergy,
      velocity: v,
      acceleration: a,
      x: s,
      y: maxTravel - s,
    };
  }

  return {
    reset,
    step,
    state,
    derived,
    setParam,
    getTelemetryPoint,
  };
}
