import { DerivedValues, PhysicsSceneRuntime, TelemetryPoint } from "./types";

export interface InclineParams {
  m: number;
  g: number;
  theta: number; // degrees
  mu: number;
  length?: number; // length of ramp in meters (default 5m)
}

export function computeInclineDerived(params: InclineParams): DerivedValues {
  const { m, g, theta, mu } = params;
  const thetaRad = (theta * Math.PI) / 180;
  const sinTheta = Math.sin(thetaRad);
  const cosTheta = Math.cos(thetaRad);
  const tanTheta = Math.tan(thetaRad);

  const normalForce = m * g * cosTheta;
  const parallelGravity = m * g * sinTheta;

  // Static equilibrium check: block at rest remains at rest if tan(theta) <= mu
  const staticEquilibrium = tanTheta <= mu;

  let frictionForce: number;
  let netForce: number;
  let acceleration: number;

  if (staticEquilibrium) {
    frictionForce = parallelGravity;
    netForce = 0;
    acceleration = 0;
  } else {
    frictionForce = mu * normalForce;
    netForce = parallelGravity - frictionForce;
    acceleration = g * (sinTheta - mu * cosTheta);
    if (acceleration < 0) acceleration = 0;
  }

  return {
    normalForce,
    frictionForce,
    netForce,
    acceleration,
    staticEquilibrium,
  };
}

export function createInclineRuntime(initialParams: InclineParams): PhysicsSceneRuntime {
  let params = { ...initialParams, length: initialParams.length || 5.0 };
  let t = 0;
  let s = 0; // distance along ramp
  let v = 0; // velocity along ramp
  let isStoppedAtBottom = false;

  function reset() {
    t = 0;
    s = 0;
    v = 0;
    isStoppedAtBottom = false;
  }

  function step(dt: number) {
    if (isStoppedAtBottom) return;

    const d = computeInclineDerived(params);
    const a = d.acceleration ?? 0;

    if (a === 0 && v === 0) {
      t += dt;
      return;
    }

    v += a * dt;
    s += v * dt;
    t += dt;

    const rampLength = params.length || 5.0;
    if (s >= rampLength) {
      s = rampLength;
      v = 0;
      isStoppedAtBottom = true;
    }
  }

  function state() {
    const thetaRad = (params.theta * Math.PI) / 180;
    const rampLength = params.length || 5.0;
    const h = (rampLength - s) * Math.sin(thetaRad);
    return {
      t,
      s,
      v,
      h,
      isStoppedAtBottom,
      params,
    };
  }

  function derived() {
    return computeInclineDerived(params);
  }

  function setParam(name: string, value: number) {
    if (name in params) {
      (params as Record<string, number>)[name] = value;
      reset();
    }
  }

  function getTelemetryPoint(): TelemetryPoint {
    const d = computeInclineDerived(params);
    const a = isStoppedAtBottom ? 0 : (d.acceleration ?? 0);
    const thetaRad = (params.theta * Math.PI) / 180;
    const rampLength = params.length || 5.0;
    const h = Math.max(0, (rampLength - s) * Math.sin(thetaRad));

    const ke = 0.5 * params.m * v * v;
    const pe = params.m * params.g * h;
    const totalEnergy = ke + pe;

    return {
      t,
      ke,
      pe,
      totalEnergy,
      velocity: v,
      acceleration: a,
      x: s * Math.cos(thetaRad),
      y: (rampLength - s) * Math.sin(thetaRad),
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
