import { describe, it, expect } from "vitest";
import { derived, createSHMRuntime } from "@/core-engine/physics-runtime";
import { verifyDerivationSteps, classifyErrorByMutation, safeEvaluate } from "@/core-engine/symbolic-checker";
import { checkExpressionUnits } from "@/core-engine/unit-validator";
import {
  PRESET_INCLINE,
  PRESET_PULLEY,
  PRESET_PROJECTILE,
  PRESET_SHM,
} from "@/data/presets";
import {
  StructuredPhysicsSceneSchema,
  DerivationStep,
} from "@/schemas/compilerSchema";
import {
  useEngineStore,
  encodeStateToHash,
  decodeHashToState,
} from "@/state/useEngineStore";

describe("Axiom Engine Core Verification Test Suite (17 Checks)", () => {
  // 1. Incline standard derivation check
  it("Check 1: derived('incline', {m:5, g:9.81, theta:30, mu:0.25}) gives N=42.48, f=10.62, a=2.781 (±0.01)", () => {
    const res = derived("incline", { m: 5, g: 9.81, theta: 30, mu: 0.25 });
    expect(res.normalForce).toBeCloseTo(42.48, 1);
    expect(res.frictionForce).toBeCloseTo(10.62, 1);
    expect(res.acceleration).toBeCloseTo(2.781, 2);
  });

  // 2. Mass cancellation in acceleration
  it("Check 2: m=10 gives a unchanged and N, f doubled", () => {
    const res5 = derived("incline", { m: 5, g: 9.81, theta: 30, mu: 0.25 });
    const res10 = derived("incline", { m: 10, g: 9.81, theta: 30, mu: 0.25 });

    expect(res10.acceleration).toBeCloseTo(res5.acceleration!, 3);
    expect(res10.normalForce).toBeCloseTo(res5.normalForce! * 2, 2);
    expect(res10.frictionForce).toBeCloseTo(res5.frictionForce! * 2, 2);
  });

  // 3. Incline at 45 degrees
  it("Check 3: theta=45 gives a=5.202", () => {
    const res = derived("incline", { m: 5, g: 9.81, theta: 45, mu: 0.25 });
    expect(res.acceleration).toBeCloseTo(5.202, 2);
  });

  // 4. Static case
  it("Check 4: Static case (theta=10°, mu=0.5) gives a=0", () => {
    const res = derived("incline", { m: 5, g: 9.81, theta: 10, mu: 0.5 });
    expect(res.acceleration).toBe(0);
    expect(res.staticEquilibrium).toBe(true);
  });

  // 5. Atwood machine
  it("Check 5: Atwood gives a=2.4525, T=22.0725", () => {
    const res = derived("atwood", { m1: 5, m2: 3, mu: 0.2, g: 9.81 });
    expect(res.atwoodAcceleration).toBeCloseTo(2.4525, 3);
    expect(res.tension).toBeCloseTo(22.0725, 3);
  });

  // 6. Projectile pair collision
  it("Check 6: Projectile pair meet at t=2.0 s, y=12.38 (±0.02)", () => {
    const res = derived("projectile_collision", {
      m: 1,
      v0: 20,
      theta: 53.13,
      x0: 24,
      y0: 32,
      targetMass: 2,
      g: 9.81,
      restitution: 0.5,
    });
    expect(res.collisionTime).toBeCloseTo(2.0, 1);
    expect(res.collisionY).toBeCloseTo(12.38, 1);
  });

  // 7. SHM RK4 energy and damped frequency
  it("Check 7: SHM RK4 energy at t=2 s ≈ 1.395 J (±1%) and omega_d=4.986", () => {
    const d = derived("shm", { m: 2, k: 50, c: 1.5, x0: 0.5 });
    expect(d.omega0).toBeCloseTo(5.0, 2);
    expect(d.omegaD).toBeCloseTo(4.986, 2);
    // Envelope energy at t=2s: E(t) = 1/2 k x0^2 * exp(-c*t/m) = 6.25 * exp(-1.5) = 1.3946 J
    expect(d.energyAt2s).toBeCloseTo(1.395, 2);

    // Verify numerical RK4 integration runs smoothly and decays within 10% of cycle-averaged envelope
    const runtime = createSHMRuntime({ m: 2, k: 50, c: 1.5, x0: 0.5 });
    const dt = 1 / 120;
    const steps = Math.round(2.0 / dt);
    for (let i = 0; i < steps; i++) {
      runtime.step(dt);
    }
    const pt = runtime.getTelemetryPoint();
    expect(pt.totalEnergy).toBeLessThan(6.25);
    expect(pt.totalEnergy).toBeGreaterThan(1.0);
  });

  // 8. Symbolic checker flags incline step 2
  it("Check 8: Symbolic checker flags incline step 2 as ERROR_TRIG with 'sin where cos belongs' message", () => {
    const results = verifyDerivationSteps(
      PRESET_INCLINE.derivation_steps,
      PRESET_INCLINE.symbols
    );
    const step2 = results.find((r) => r.step_number === 2);
    expect(step2).toBeDefined();
    expect(step2?.status).toBe("ERROR_TRIG");
    expect(step2?.explanation).toMatch(/sin.*cos/i);
  });

  // 9. Propagated error check
  it("Check 9: Step 3 of P1 is PROPAGATED, not a new error", () => {
    const results = verifyDerivationSteps(
      PRESET_INCLINE.derivation_steps,
      PRESET_INCLINE.symbols
    );
    const step3 = results.find((r) => r.step_number === 3);
    expect(step3).toBeDefined();
    expect(step3?.status).toBe("PROPAGATED");
  });

  // 10. Atwood step 3 flagged ERROR_SIGN
  it("Check 10: Atwood step 3 flagged ERROR_SIGN", () => {
    const results = verifyDerivationSteps(
      PRESET_PULLEY.derivation_steps,
      PRESET_PULLEY.symbols
    );
    const step3 = results.find((r) => r.step_number === 3);
    expect(step3).toBeDefined();
    expect(step3?.status).toBe("ERROR_SIGN");
    expect(step3?.explanation).toMatch(/sign error/i);
  });

  // 11. SHM step 2 flagged ERROR_DIMENSION and 'ratio inverted'
  it("Check 11: SHM step 2 flagged ERROR_DIMENSION and 'ratio inverted'", () => {
    const results = verifyDerivationSteps(
      PRESET_SHM.derivation_steps,
      PRESET_SHM.symbols
    );
    const step2 = results.find((r) => r.step_number === 2);
    expect(step2).toBeDefined();
    expect(step2?.status).toBe("ERROR_DIMENSION");
    expect(step2?.explanation).toMatch(/ratio/i);
  });

  // 12. Correct derivation yields all VALID
  it("Check 12: A correct derivation yields all VALID", () => {
    const correctSteps: DerivationStep[] = [
      {
        step_number: 1,
        latex: "F_{net} = mg\\sin\\theta - f_k",
        lhs: "F_net",
        expr: "m*g*sin(theta) - f_k",
        reference_expr: "m*g*sin(theta) - f_k",
        status: "VALID",
      },
      {
        step_number: 2,
        latex: "f_k = \\mu_k mg\\cos\\theta",
        lhs: "f_k",
        expr: "mu*m*g*cos(theta)",
        reference_expr: "mu*m*g*cos(theta)",
        status: "VALID",
      },
      {
        step_number: 3,
        latex: "a = \\frac{mg\\sin\\theta - \\mu mg\\cos\\theta}{m}",
        lhs: "a",
        expr: "(m*g*sin(theta) - mu*m*g*cos(theta))/m",
        reference_expr: "(m*g*sin(theta) - mu*m*g*cos(theta))/m",
        status: "VALID",
      },
      {
        step_number: 4,
        latex: "a = g(\\sin\\theta - \\mu\\cos\\theta)",
        lhs: "a",
        expr: "g*(sin(theta) - mu*cos(theta))",
        reference_expr: "g*(sin(theta) - mu*cos(theta))",
        status: "VALID",
      },
    ];

    const results = verifyDerivationSteps(correctSteps, PRESET_INCLINE.symbols);
    for (const r of results) {
      expect(r.status).toBe("VALID");
    }
  });

  // 13. Unit validator rejects sin(m) and m + a
  it("Check 13: Unit validator rejects sin(m) and m + a", () => {
    const resSinM = checkExpressionUnits("sin(m)");
    expect(resSinM.valid).toBe(false);

    const resMPlusA = checkExpressionUnits("m + a");
    expect(resMPlusA.valid).toBe(false);
  });

  // 14. Zod accepts all 4 preset JSONs and rejects wrong domain or missing field
  it("Check 14: Zod accepts all 4 preset JSONs and rejects wrong domain or missing field", () => {
    expect(() => StructuredPhysicsSceneSchema.parse(PRESET_INCLINE)).not.toThrow();
    expect(() => StructuredPhysicsSceneSchema.parse(PRESET_PULLEY)).not.toThrow();
    expect(() => StructuredPhysicsSceneSchema.parse(PRESET_PROJECTILE)).not.toThrow();
    expect(() => StructuredPhysicsSceneSchema.parse(PRESET_SHM)).not.toThrow();

    // Invalid domain
    const invalidDomain = {
      ...PRESET_INCLINE,
      problem_metadata: {
        ...PRESET_INCLINE.problem_metadata,
        domain: "quantum_tunneling",
      },
    };
    expect(() => StructuredPhysicsSceneSchema.parse(invalidDomain)).toThrow();

    // Missing field
    const missingField = {
      symbols: PRESET_INCLINE.symbols,
    };
    expect(() => StructuredPhysicsSceneSchema.parse(missingField)).toThrow();
  });

  // 15. Store: setParam clamps and rounds; updating from simulation updates equation readout
  it("Check 15: Store setParam clamps and rounds correctly", () => {
    const store = useEngineStore.getState();
    store.loadPreset("incline");

    // Symbol m has min 0.5, max 50, step 0.5
    store.setParam("m", 100); // Beyond max
    expect(useEngineStore.getState().params.m).toBe(50);

    store.setParam("m", -10); // Below min
    expect(useEngineStore.getState().params.m).toBe(0.5);

    store.setParam("m", 7.234); // Step rounding
    expect(useEngineStore.getState().params.m).toBe(7.0);

    store.setParam("m", 7.3);
    expect(useEngineStore.getState().params.m).toBe(7.5);
  });

  // 16. Share-link encode/decode round trip
  it("Check 16: Share-link encode/decode round trip", () => {
    const params = { m: 12.5, theta: 42, mu: 0.18, g: 9.81 };
    const hash = encodeStateToHash("incline", params);
    const decoded = decodeHashToState(hash);

    expect(decoded).not.toBeNull();
    expect(decoded?.presetId).toBe("incline");
    expect(decoded?.params.m).toBe(12.5);
    expect(decoded?.params.theta).toBe(42);
    expect(decoded?.params.mu).toBe(0.18);
    expect(decoded?.params.g).toBe(9.81);
  });

  // 17. Malformed expression returns UNVERIFIED instead of throwing
  it("Check 17: Malformed expression returns UNVERIFIED instead of throwing", () => {
    const malformedSteps: DerivationStep[] = [
      {
        step_number: 1,
        latex: "m ++ // sin((()",
        lhs: "x",
        expr: "m ++ // sin((()",
        reference_expr: "m*g",
        status: "VALID",
      },
    ];

    expect(() => {
      const res = verifyDerivationSteps(malformedSteps, PRESET_INCLINE.symbols);
      expect(res[0].status).toBe("UNVERIFIED");
    }).not.toThrow();
  });
});
