import { DerivedValues, PhysicsSceneRuntime, TelemetryPoint } from "./types";

export interface SHMParams {
  m: number; // mass (kg)
  k: number; // spring constant (N/m)
  c: number; // damping coefficient (kg/s)
  x0: number; // initial displacement (m)
}

export function computeSHMDerived(params: SHMParams): DerivedValues {
  const { m, k, c, x0 } = params;

  if (m <= 0 || k <= 0) {
    return {
      omega0: 0,
      gamma: 0,
      omegaD: 0,
      initialEnergy: 0,
      energyAt2s: 0,
      dampingRegime: "underdamped",
    };
  }

  const omega0 = Math.sqrt(k / m);
  const gamma = c / (2 * m);
  const diff = omega0 * omega0 - gamma * gamma;

  let omegaD = 0;
  let dampingRegime: "underdamped" | "critically_damped" | "overdamped" = "underdamped";

  if (diff > 1e-7) {
    omegaD = Math.sqrt(diff);
    dampingRegime = "underdamped";
  } else if (Math.abs(diff) <= 1e-7) {
    omegaD = 0;
    dampingRegime = "critically_damped";
  } else {
    omegaD = 0;
    dampingRegime = "overdamped";
  }

  const initialEnergy = 0.5 * k * x0 * x0;
  // Energy decay: E(t) = E0 * exp(- (c/m) * t)
  const energyAt2s = initialEnergy * Math.exp(-(c / m) * 2.0);

  return {
    omega0,
    gamma,
    omegaD,
    initialEnergy,
    energyAt2s,
    dampingRegime,
  };
}

export function createSHMRuntime(initialParams: SHMParams): PhysicsSceneRuntime {
  let params = { ...initialParams };
  let t = 0;
  let x = params.x0;
  let v = 0;

  function reset() {
    t = 0;
    x = params.x0;
    v = 0;
  }

  // Derivatives function for RK4: [dx/dt, dv/dt]
  function derivatives(currX: number, currV: number): [number, number] {
    const dxdt = currV;
    const dvdt = -(params.k / params.m) * currX - (params.c / params.m) * currV;
    return [dxdt, dvdt];
  }

  // RK4 step
  function step(dt: number) {
    const [k1_x, k1_v] = derivatives(x, v);

    const x_mid1 = x + 0.5 * dt * k1_x;
    const v_mid1 = v + 0.5 * dt * k1_v;
    const [k2_x, k2_v] = derivatives(x_mid1, v_mid1);

    const x_mid2 = x + 0.5 * dt * k2_x;
    const v_mid2 = v + 0.5 * dt * k2_v;
    const [k3_x, k3_v] = derivatives(x_mid2, v_mid2);

    const x_end = x + dt * k3_x;
    const v_end = v + dt * k3_v;
    const [k4_x, k4_v] = derivatives(x_end, v_end);

    x += (dt / 6) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x);
    v += (dt / 6) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v);
    t += dt;
  }

  function state() {
    return {
      t,
      x,
      v,
      params,
    };
  }

  function derived() {
    return computeSHMDerived(params);
  }

  function setParam(name: string, value: number) {
    if (name in params) {
      (params as Record<string, number>)[name] = value;
      reset();
    }
  }

  function getTelemetryPoint(): TelemetryPoint {
    const ke = 0.5 * params.m * v * v;
    const pe = 0.5 * params.k * x * x;
    const totalEnergy = ke + pe;
    const a = -(params.k / params.m) * x - (params.c / params.m) * v;

    return {
      t,
      ke,
      pe,
      totalEnergy,
      velocity: v,
      acceleration: a,
      x,
      y: 0,
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
