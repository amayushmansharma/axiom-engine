import * as math from "mathjs";
import { DerivationStep, StepStatus, SymbolDefinition } from "@/schemas/compilerSchema";
import { checkExpressionUnits } from "../unit-validator";

export interface VerificationResult {
  step_number: number;
  status: StepStatus;
  error_type?: string;
  explanation: string;
  socratic_hint?: string;
  socratic_hint_hinglish?: string;
  corrected_step_latex?: string;
}

interface SampleScope {
  [symbol: string]: number;
}

/**
 * Generate 24 random sample scopes within each symbol's min/max bounds.
 * Angle symbols (like theta) are also converted to radians for math.js trigonometric functions.
 * Any free symbol appearing in steps (like f_k, N, T) is populated with random positive values.
 */
export function generateSampleScopes(
  symbols: SymbolDefinition[],
  count: number = 24,
  extraSymbolNames: string[] = []
): SampleScope[] {
  const scopes: SampleScope[] = [];

  for (let i = 0; i < count; i++) {
    const scope: SampleScope = {};
    for (const sym of symbols) {
      const min = sym.min;
      const max = sym.max;
      // Ensure positive non-zero random value within range
      const val = min + Math.random() * (max - min);
      scope[sym.name] = val;

      // Handle angle conversions for common angle names
      if (sym.name === "theta" || sym.unit === "°" || sym.unit === "deg") {
        scope[sym.name] = (val * Math.PI) / 180;
      }
    }

    // Populate extra symbols (e.g. f_k, N, T) if not already present
    for (const name of extraSymbolNames) {
      if (!(name in scope)) {
        scope[name] = 1 + Math.random() * 10;
      }
    }

    // Also provide standard physics constants/symbols if not defined
    if (!("g" in scope)) scope.g = 9.81;
    if (!("pi" in scope)) scope.pi = Math.PI;
    if (!("e" in scope)) scope.e = Math.E;
    if (!("f_k" in scope)) scope.f_k = 2 + Math.random() * 5;
    if (!("f_s" in scope)) scope.f_s = 2 + Math.random() * 5;
    if (!("N" in scope)) scope.N = 10 + Math.random() * 10;
    if (!("T" in scope)) scope.T = 10 + Math.random() * 10;

    scopes.push(scope);
  }

  return scopes;
}

/**
 * Safely evaluates a math.js expression string with a given scope.
 * Returns null if evaluation fails, times out, or produces NaN / Infinity.
 */
export function safeEvaluate(exprStr: string, scope: SampleScope): number | null {
  try {
    const compiled = math.compile(exprStr);
    const result = compiled.evaluate(scope);
    if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Compares two expressions numerically over the sample scopes.
 * Returns true if relative difference is within tolerance for all valid points.
 */
export function areNumericallyEquivalent(
  expr1: string,
  expr2: string,
  scopes: SampleScope[],
  relTol: number = 1e-5
): boolean {
  let validPoints = 0;

  for (const scope of scopes) {
    const v1 = safeEvaluate(expr1, scope);
    const v2 = safeEvaluate(expr2, scope);

    if (v1 === null || v2 === null) {
      continue;
    }

    const diff = Math.abs(v1 - v2);
    const denom = Math.max(Math.abs(v1), Math.abs(v2)) + 1e-12;
    if (diff / denom > relTol) {
      return false;
    }
    validPoints++;
  }

  return validPoints > 0;
}

/**
 * Single-mutation search: mutate the reference AST to see if one mutation matches the student expr.
 */
export function classifyErrorByMutation(
  studentExpr: string,
  refExpr: string,
  scopes: SampleScope[]
): {
  status: StepStatus;
  error_type: string;
  explanation: string;
  hint: string;
  hint_hinglish: string;
} | null {
  try {
    // 1. Swap sin <-> cos
    if (refExpr.includes("cos(") || refExpr.includes("sin(")) {
      const swapped = refExpr
        .replace(/cos\(/g, "__TEMP_SIN__")
        .replace(/sin\(/g, "cos(")
        .replace(/__TEMP_SIN__/g, "sin(");

      if (areNumericallyEquivalent(studentExpr, swapped, scopes)) {
        const usedSinWhereCosBelongs = refExpr.includes("cos(") && studentExpr.includes("sin(");
        return {
          status: "ERROR_TRIG",
          error_type: "NORMAL_FORCE_MISCALCULATION",
          explanation: usedSinWhereCosBelongs
            ? "Between steps, you used sin(θ) where cos(θ) belongs. The normal force on an incline is N = mg cosθ."
            : "Trigonometric error: you swapped sin(θ) and cos(θ).",
          hint: "Check the component perpendicular to the incline. Is normal force mg·sinθ or mg·cosθ?",
          hint_hinglish: "Incline ke perpendicular direction dekho. Normal force mg·sinθ hai ya mg·cosθ?",
        };
      }
    }

    // 2. Invert ratio: e.g. sqrt(k/m) -> sqrt(m/k) or (a/b) -> (b/a)
    if (refExpr.includes("k/m") || refExpr.includes("k / m")) {
      const inverted = refExpr.replace(/k\s*\/\s*m/g, "m/k");
      if (areNumericallyEquivalent(studentExpr, inverted, scopes)) {
        return {
          status: "ERROR_DIMENSION",
          error_type: "INVERTED_RATIO",
          explanation: "You inverted a ratio (k/m became m/k).",
          hint: "Recall that stiffness increases frequency while inertia decreases it: ω = √(k/m).",
          hint_hinglish: "Yaad karo spring stiffness badhne se frequency badhti hai: ω = √(k/m).",
        };
      }
    }

    if (refExpr.includes("m/k") || refExpr.includes("m / k")) {
      const inverted = refExpr.replace(/m\s*\/\s*k/g, "k/m");
      if (areNumericallyEquivalent(studentExpr, inverted, scopes)) {
        return {
          status: "ERROR_DIMENSION",
          error_type: "INVERTED_RATIO",
          explanation: "You inverted a ratio (m/k became k/m).",
          hint: "Check the dimension of √(m/k) — it has units of time, not frequency.",
          hint_hinglish: "√(m/k) ki dimension dekho — yeh time hai, frequency nahi.",
        };
      }
    }

    // 3. Sign flip: flip one + to - or - to +
    // Test flipping + to -
    if (refExpr.includes("+")) {
      // Try replacing occurrences of +
      const plusIndices: number[] = [];
      for (let i = 0; i < refExpr.length; i++) {
        if (refExpr[i] === "+") plusIndices.push(i);
      }
      for (const idx of plusIndices) {
        const mutated = refExpr.slice(0, idx) + "-" + refExpr.slice(idx + 1);
        if (areNumericallyEquivalent(studentExpr, mutated, scopes)) {
          return {
            status: "ERROR_SIGN",
            error_type: "SIGN_FLIP",
            explanation: "Sign error: a + became a −.",
            hint: "Check the direction of the forces or whether masses add up in Newton's second law.",
            hint_hinglish: "Forces ki direction check karo, kya denominator mein mass add hona chahiye?",
          };
        }
      }
    }

    // Test flipping - to +
    if (refExpr.includes("-")) {
      const minusIndices: number[] = [];
      for (let i = 0; i < refExpr.length; i++) {
        if (refExpr[i] === "-") minusIndices.push(i);
      }
      for (const idx of minusIndices) {
        const mutated = refExpr.slice(0, idx) + "+" + refExpr.slice(idx + 1);
        if (areNumericallyEquivalent(studentExpr, mutated, scopes)) {
          return {
            status: "ERROR_SIGN",
            error_type: "SIGN_FLIP",
            explanation: "Sign error: a − became a +.",
            hint: "Check the sign of the opposing force (friction or resistance).",
            hint_hinglish: "Opposing force ka sign check karo (+ ya -).",
          };
        }
      }
    }

    // 4. Missing or extra factor of g, m, 2, 1/2
    const factors = [
      { factor: "* g", note: "A factor of g was added" },
      { factor: "/ g", note: "A factor of g is missing" },
      { factor: "* m", note: "A factor of m was added" },
      { factor: "/ m", note: "A factor of m is missing" },
      { factor: "* 2", note: "An extra factor of 2 was added" },
      { factor: "/ 2", note: "Missing a factor of 1/2" },
      { factor: "* -1", note: "Overall sign is negated" },
    ];

    for (const f of factors) {
      const mutated = `(${refExpr}) ${f.factor}`;
      if (areNumericallyEquivalent(studentExpr, mutated, scopes)) {
        return {
          status: "ERROR_ALGEBRAIC",
          error_type: "FACTOR_MISMATCH",
          explanation: f.note,
          hint: `Double check your algebraic steps. ${f.note}.`,
          hint_hinglish: `Apne algebraic steps check karo. ${f.note}.`,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

const BUILTIN_MATH_IDENTIFIERS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sqrt",
  "exp",
  "log",
  "abs",
  "pow",
  "pi",
  "e",
]);

/**
 * Verify a full list of derivation steps deterministically.
 */
export function verifyDerivationSteps(
  steps: DerivationStep[],
  symbols: SymbolDefinition[]
): VerificationResult[] {
  // Collect all free symbol names used in steps, excluding built-in math functions
  const extraSymbols = new Set<string>();
  for (const step of steps) {
    try {
      const parsed = math.parse(step.expr);
      parsed.traverse((n) => {
        if (n.type === "SymbolNode") {
          const symName = (n as math.SymbolNode).name;
          if (!BUILTIN_MATH_IDENTIFIERS.has(symName)) {
            extraSymbols.add(symName);
          }
        }
      });
    } catch {
      // ignore parse error here, will be caught in step loop
    }
  }

  const scopes = generateSampleScopes(symbols, 24, Array.from(extraSymbols));
  const results: VerificationResult[] = [];

  // Track reference substitutions for previously defined lhs symbols
  const refSubstitutions: Record<string, string> = {};
  // Track student substitutions for earlier steps to detect propagated errors
  const studentSubstitutions: Record<string, string> = {};

  let earliestErrorStepIndex = -1;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const { step_number, lhs, expr, reference_expr, socratic_hint, socratic_hint_hinglish } = step;

    // Check expression validity: try mathjs parse
    let parsedExpr: math.MathNode;
    let parsedRef: math.MathNode;
    try {
      parsedExpr = math.parse(expr);
      parsedRef = math.parse(reference_expr);
    } catch {
      results.push({
        step_number,
        status: "UNVERIFIED",
        explanation: "Malformed mathematical expression that could not be parsed.",
        socratic_hint: "Check the syntax of this equation for unmatched brackets or symbols.",
        socratic_hint_hinglish: "Equation ka syntax check karo, kahi bracket ya symbol galat toh nahi?",
      });
      continue;
    }

    // 1. Dimensional / Unit Check
    const unitCheck = checkExpressionUnits(expr, lhs);
    if (!unitCheck.valid) {
      if (earliestErrorStepIndex === -1) earliestErrorStepIndex = i;

      // Check if mutation classifier detects inverted ratio
      const mutation = classifyErrorByMutation(expr, reference_expr, scopes);

      results.push({
        step_number,
        status: "ERROR_DIMENSION",
        error_type: mutation?.error_type || "DIMENSIONAL_MISMATCH",
        explanation: mutation
          ? `${mutation.explanation} ${unitCheck.error || ""}`
          : unitCheck.error || "Dimensional mismatch in expression.",
        socratic_hint: mutation?.hint || socratic_hint || "Check the units of each side of the equation.",
        socratic_hint_hinglish:
          mutation?.hint_hinglish || socratic_hint_hinglish || "Equation ke dono sides ke units check karo.",
        corrected_step_latex: step.corrected_step_latex,
      });

      studentSubstitutions[lhs] = expr;
      refSubstitutions[lhs] = reference_expr;
      continue;
    }

    // Substitute reference values of prior symbols into reference_expr
    let resolvedRefExpr = reference_expr;
    for (const [sym, sub] of Object.entries(refSubstitutions)) {
      // Regex replace symbol boundary
      resolvedRefExpr = resolvedRefExpr.replace(new RegExp(`\\b${sym}\\b`, "g"), `(${sub})`);
    }

    // Substitute reference values into student expr for independent reference check
    let studentExprWithRefPrior = expr;
    for (const [sym, sub] of Object.entries(refSubstitutions)) {
      studentExprWithRefPrior = studentExprWithRefPrior.replace(
        new RegExp(`\\b${sym}\\b`, "g"),
        `(${sub})`
      );
    }

    // Test equivalence with reference
    const isReferenceMatch = areNumericallyEquivalent(
      studentExprWithRefPrior,
      resolvedRefExpr,
      scopes
    );

    if (isReferenceMatch) {
      results.push({
        step_number,
        status: "VALID",
        explanation: step.explanation || "Correct step, matches physical principles.",
        socratic_hint: undefined,
        socratic_hint_hinglish: undefined,
      });
      studentSubstitutions[lhs] = expr;
      refSubstitutions[lhs] = reference_expr;
      continue;
    }

    // If it did NOT match reference, check if it's a PROPAGATED error from an earlier flawed step:
    if (earliestErrorStepIndex !== -1 && earliestErrorStepIndex < i) {
      // Substitute student's OWN earlier flawed definitions into the reference derivation
      let studentPropagatedExpr = resolvedRefExpr;
      for (const [sym, sub] of Object.entries(studentSubstitutions)) {
        studentPropagatedExpr = studentPropagatedExpr.replace(
          new RegExp(`\\b${sym}\\b`, "g"),
          `(${sub})`
        );
      }

      // Check if student's current expression is consistent with their previous mistake
      let currentWithStudentPrior = expr;
      for (const [sym, sub] of Object.entries(studentSubstitutions)) {
        currentWithStudentPrior = currentWithStudentPrior.replace(
          new RegExp(`\\b${sym}\\b`, "g"),
          `(${sub})`
        );
      }

      const isPropagatedFromMistake =
        areNumericallyEquivalent(expr, studentPropagatedExpr, scopes) ||
        areNumericallyEquivalent(currentWithStudentPrior, studentPropagatedExpr, scopes);

      if (isPropagatedFromMistake) {
        const badStepNum = steps[earliestErrorStepIndex].step_number;
        results.push({
          step_number,
          status: "PROPAGATED",
          error_type: "PROPAGATED_ERROR",
          explanation: `Algebraically consistent with step ${badStepNum}, but inherits the mistake from step ${badStepNum}. Fix step ${badStepNum} first.`,
          socratic_hint: `This step would be right if step ${badStepNum} were right. Go back and check step ${badStepNum}.`,
          socratic_hint_hinglish: `Yeh step step ${badStepNum} par depend karta hai. Pehle step ${badStepNum} theek karo.`,
          corrected_step_latex: step.corrected_step_latex,
        });
        studentSubstitutions[lhs] = expr;
        refSubstitutions[lhs] = reference_expr;
        continue;
      }
    }

    // It's a new error in this step!
    if (earliestErrorStepIndex === -1) {
      earliestErrorStepIndex = i;
    }

    // Classify error via single-mutation search
    const mutation = classifyErrorByMutation(expr, reference_expr, scopes);

    const errorStatus: StepStatus = mutation?.status || (step.status !== "VALID" ? step.status : "ERROR_ALGEBRAIC");
    const errorType = mutation?.error_type || step.error_type || "UNKNOWN_ERROR";
    const explanation =
      mutation?.explanation ||
      step.explanation ||
      "Numerical values diverge from the correct physical derivation.";
    const hint = mutation?.hint || socratic_hint || "Review the physics principles applied in this step.";
    const hintHinglish =
      mutation?.hint_hinglish || socratic_hint_hinglish || "Is step mein lagaye gaye physics formulas ko re-check karo.";

    results.push({
      step_number,
      status: errorStatus,
      error_type: errorType,
      explanation,
      socratic_hint: hint,
      socratic_hint_hinglish: hintHinglish,
      corrected_step_latex: step.corrected_step_latex,
    });

    studentSubstitutions[lhs] = expr;
    refSubstitutions[lhs] = reference_expr;
  }

  return results;
}
