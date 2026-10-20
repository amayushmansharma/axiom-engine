import { DerivedValues, PhysicsSceneRuntime, TelemetryPoint } from "./types";

export interface ProjectileParams {
  m: number; // projectile mass (kg)
  v0: number; // initial speed (m/s)
  theta: number; // launch angle (deg)
  x0: number; // target initial x (m)
  y0: number; // target initial y (m)
  targetMass: number; // target mass (kg)
  g: number; // gravity (m/s^2)
  restitution: number; // coefficient of restitution e (0-1)
  r1?: number; // projectile radius (m)
  r2?: number; // target radius (m)
}

export function computeProjectileDerived(params: ProjectileParams): DerivedValues {
  const { m, v0, theta, x0, y0, targetMass, g } = params;
  const thetaRad = (theta * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);
  const sinTheta = Math.sin(thetaRad);

  const v_x0 = v0 * cosTheta;
  const v_y0 = v0 * sinTheta;

  // Time to reach target x-coordinate:
  const collisionTime = v_x0 !== 0 ? x0 / v_x0 : 0;
  // Elevation at collision time:
  const collisionY = v_y0 * collisionTime - 0.5 * g * collisionTime * collisionTime;

  // Momentum of projectile at launch:
  const p0 = m * v0;

  return {
    v_x0,
    v_y0,
    collisionTime,
    collisionY,
    collisionMomentum: p0,
  };
}

export function createProjectileRuntime(initialParams: ProjectileParams): PhysicsSceneRuntime {
  let params = { ...initialParams, r1: initialParams.r1 || 0.3, r2: initialParams.r2 || 1.0 };
  let t = 0;

  // Projectile state
  let xA = 0;
  let yA = 0;
  let vxA = 0;
  let vyA = 0;

  // Target state
  let xB = params.x0;
  let yB = params.y0;
  let vxB = 0;
  let vyB = 0;

  let collided = false;
  let collisionOccurredTime = -1;

  function initVelocities() {
    const thetaRad = (params.theta * Math.PI) / 180;
    vxA = params.v0 * Math.cos(thetaRad);
    vyA = params.v0 * Math.sin(thetaRad);
    vxB = 0;
    vyB = 0;
    xA = 0;
    yA = 0;
    xB = params.x0;
    yB = params.y0;
    collided = false;
    collisionOccurredTime = -1;
  }

  initVelocities();

  function reset() {
    t = 0;
    initVelocities();
  }

  function step(dt: number) {
    // Check collision condition:
    const dx = xB - xA;
    const dy = yB - yA;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const contactDist = (params.r1 || 0.3) + (params.r2 || 1.0);

    // Also check analytic collision time threshold for exact triggering
    const d = computeProjectileDerived(params);
    const tc = d.collisionTime ?? 2.0;

    if (!collided && (dist <= contactDist || (t >= tc && t - dt < tc))) {
      collided = true;
      collisionOccurredTime = t;

      // 1D horizontal impulse resolution (since relative vertical acceleration is 0)
      const e = params.restitution ?? 0.5;
      const mA = params.m;
      const mB = params.targetMass;

      const vRel = vxA - vxB;
      if (vRel > 0) {
        const impulse = ((1 + e) * vRel) / (1 / mA + 1 / mB);
        vxA -= impulse / mA;
        vxB += impulse / mB;
      }
    }

    // Integrate projectile
    xA += vxA * dt;
    vyA -= params.g * dt;
    yA += vyA * dt;

    // Integrate target
    xB += vxB * dt;
    vyB -= params.g * dt;
    yB += vyB * dt;

    // Stop if both hit the ground (y <= 0)
    if (yA < 0) {
      yA = 0;
      vxA = 0;
      vyA = 0;
    }
    if (yB < 0) {
      yB = 0;
      vxB = 0;
      vyB = 0;
    }

    t += dt;
  }

  function state() {
    return {
      t,
      xA,
      yA,
      vxA,
      vyA,
      xB,
      yB,
      vxB,
      vyB,
      collided,
      collisionOccurredTime,
      params,
    };
  }

  function derived() {
    return computeProjectileDerived(params);
  }

  function setParam(name: string, value: number) {
    if (name in params) {
      (params as Record<string, number>)[name] = value;
      reset();
    }
  }

  function getTelemetryPoint(): TelemetryPoint {
    const mA = params.m;
    const mB = params.targetMass;

    const vA = Math.sqrt(vxA * vxA + vyA * vyA);
    const vB = Math.sqrt(vxB * vxB + vyB * vyB);

    const ke = 0.5 * mA * vA * vA + 0.5 * mB * vB * vB;
    const pe = mA * params.g * Math.max(0, yA) + mB * params.g * Math.max(0, yB);
    const totalEnergy = ke + pe;

    // Total momentum
    const px = mA * vxA + mB * vxB;
    const py = mA * vyA + mB * vyB;
    const totalMomentum = Math.sqrt(px * px + py * py);

    return {
      t,
      ke,
      pe,
      totalEnergy,
      velocity: vA,
      acceleration: params.g,
      momentum: totalMomentum,
      x: xA,
      y: yA,
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
