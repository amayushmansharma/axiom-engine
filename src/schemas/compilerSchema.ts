import { z } from "zod";

export const DomainEnum = z.enum([
  "incline",
  "atwood",
  "projectile_collision",
  "shm",
]);
export type Domain = z.infer<typeof DomainEnum>;

export const StepStatusEnum = z.enum([
  "VALID",
  "ERROR_TRIG",
  "ERROR_SIGN",
  "ERROR_ALGEBRAIC",
  "ERROR_CONCEPTUAL",
  "ERROR_DIMENSION",
  "PROPAGATED",
  "UNVERIFIED",
]);
export type StepStatus = z.infer<typeof StepStatusEnum>;

export const SymbolDefinitionSchema = z.object({
  name: z.string(),
  label: z.string(),
  dim: z.string(),
  unit: z.string(),
  value: z.number(),
  min: z.number(),
  max: z.number(),
  step: z.number(),
});
export type SymbolDefinition = z.infer<typeof SymbolDefinitionSchema>;

export const DerivationStepSchema = z.object({
  step_number: z.number(),
  latex: z.string(),
  lhs: z.string(),
  expr: z.string(),
  reference_expr: z.string(),
  status: StepStatusEnum,
  error_type: z.string().optional(),
  explanation: z.string().optional(),
  socratic_hint: z.string().optional(),
  socratic_hint_hinglish: z.string().optional(),
  corrected_step_latex: z.string().optional(),
  bbox: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .nullable()
    .optional(),
});
export type DerivationStep = z.infer<typeof DerivationStepSchema>;

export const SimulationBodySchema = z.object({
  id: z.string(),
  type: z.string(),
  mass_kg: z.number(),
  initial_velocity: z.number().optional(),
  initial_position: z.number().optional(),
  vectors_to_render: z.array(z.string()),
});
export type SimulationBody = z.infer<typeof SimulationBodySchema>;

export const SimulationSceneSchema = z.object({
  gravity: z.number(),
  incline_angle_deg: z.number().optional(),
  friction_coeff: z.number().optional(),
  spring_constant: z.number().optional(),
  damping_coeff: z.number().optional(),
  projectile_v0: z.number().optional(),
  projectile_angle_deg: z.number().optional(),
  target_x0: z.number().optional(),
  target_y0: z.number().optional(),
  target_mass: z.number().optional(),
  projectile_mass: z.number().optional(),
  restitution: z.number().optional(),
  m1: z.number().optional(),
  m2: z.number().optional(),
  bodies: z.array(SimulationBodySchema),
});
export type SimulationScene = z.infer<typeof SimulationSceneSchema>;

export const ProblemMetadataSchema = z.object({
  title: z.string(),
  domain: DomainEnum,
  theme_color: z.string(),
  dimensional_check_passed: z.boolean(),
  notes: z.string().optional(),
});
export type ProblemMetadata = z.infer<typeof ProblemMetadataSchema>;

export const StructuredPhysicsSceneSchema = z.object({
  problem_metadata: ProblemMetadataSchema,
  symbols: z.array(SymbolDefinitionSchema),
  derivation_steps: z.array(DerivationStepSchema),
  simulation_scene: SimulationSceneSchema,
});
export type StructuredPhysicsScene = z.infer<typeof StructuredPhysicsSceneSchema>;
