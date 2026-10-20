import { Domain, StructuredPhysicsScene } from "@/schemas/compilerSchema";
import { computeInclineDerived, createInclineRuntime, InclineParams } from "./incline";
import { computeAtwoodDerived, createAtwoodRuntime, AtwoodParams } from "./atwood";
import { computeProjectileDerived, createProjectileRuntime, ProjectileParams } from "./projectile";
import { computeSHMDerived, createSHMRuntime, SHMParams } from "./shm";
import { DerivedValues, PhysicsSceneRuntime } from "./types";

export * from "./types";
export * from "./incline";
export * from "./atwood";
export * from "./projectile";
export * from "./shm";

export function derived(domain: Domain, params: Record<string, number>): DerivedValues {
  switch (domain) {
    case "incline":
      return computeInclineDerived({
        m: params.m ?? 5,
        g: params.g ?? 9.81,
        theta: params.theta ?? 30,
        mu: params.mu ?? 0.25,
      });
    case "atwood":
      return computeAtwoodDerived({
        m1: params.m1 ?? 5,
        m2: params.m2 ?? 3,
        mu: params.mu ?? 0.2,
        g: params.g ?? 9.81,
      });
    case "projectile_collision":
      return computeProjectileDerived({
        m: params.m ?? 1,
        v0: params.v0 ?? 20,
        theta: params.theta ?? 53.13,
        x0: params.x0 ?? 24,
        y0: params.y0 ?? 32,
        targetMass: params.targetMass ?? 2,
        g: params.g ?? 9.81,
        restitution: params.restitution ?? 0.5,
      });
    case "shm":
      return computeSHMDerived({
        m: params.m ?? 2,
        k: params.k ?? 50,
        c: params.c ?? 1.5,
        x0: params.x0 ?? 0.5,
      });
    default:
      return {};
  }
}

export function createScene(sceneJson: StructuredPhysicsScene): PhysicsSceneRuntime {
  const domain = sceneJson.problem_metadata.domain;
  const paramMap: Record<string, number> = {};
  for (const s of sceneJson.symbols) {
    paramMap[s.name] = s.value;
  }

  switch (domain) {
    case "incline":
      return createInclineRuntime({
        m: paramMap.m ?? 5,
        g: paramMap.g ?? 9.81,
        theta: paramMap.theta ?? 30,
        mu: paramMap.mu ?? 0.25,
      });
    case "atwood":
      return createAtwoodRuntime({
        m1: paramMap.m1 ?? 5,
        m2: paramMap.m2 ?? 3,
        mu: paramMap.mu ?? 0.2,
        g: paramMap.g ?? 9.81,
      });
    case "projectile_collision":
      return createProjectileRuntime({
        m: paramMap.m ?? 1,
        v0: paramMap.v0 ?? 20,
        theta: paramMap.theta ?? 53.13,
        x0: paramMap.x0 ?? 24,
        y0: paramMap.y0 ?? 32,
        targetMass: paramMap.targetMass ?? 2,
        g: paramMap.g ?? 9.81,
        restitution: paramMap.restitution ?? 0.5,
      });
    case "shm":
      return createSHMRuntime({
        m: paramMap.m ?? 2,
        k: paramMap.k ?? 50,
        c: paramMap.c ?? 1.5,
        x0: paramMap.x0 ?? 0.5,
      });
    default:
      throw new Error(`Unsupported physics domain: ${domain}`);
  }
}
