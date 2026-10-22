import * as math from "mathjs";

export type DimVector = [number, number, number]; // [M, L, T]

export const SYMBOL_DIM_MAP: Record<string, DimVector> = {
  // Mass
  m: [1, 0, 0],
  m1: [1, 0, 0],
  m2: [1, 0, 0],
  mA: [1, 0, 0],
  mB: [1, 0, 0],
  targetMass: [1, 0, 0],

  // Length
  x: [0, 1, 0],
  y: [0, 1, 0],
  h: [0, 1, 0],
  d: [0, 1, 0],
  R: [0, 1, 0],
  A: [0, 1, 0],
  L: [0, 1, 0],
  x0: [0, 1, 0],
  y0: [0, 1, 0],
  y_c: [0, 1, 0],
  s: [0, 1, 0],
  r1: [0, 1, 0],
  r2: [0, 1, 0],

  // Time
  t: [0, 0, 1],
  t_c: [0, 0, 1],

  // Velocity
  v: [0, 1, -1],
  v0: [0, 1, -1],
  v_x0: [0, 1, -1],
  v_y0: [0, 1, -1],
  vx: [0, 1, -1],
  vy: [0, 1, -1],

  // Acceleration
  a: [0, 1, -2],
  g: [0, 1, -2],

  // Force
  F: [1, 1, -2],
  F_net: [1, 1, -2],
  f: [1, 1, -2],
  f_k: [1, 1, -2],
  f_s: [1, 1, -2],
  N: [1, 1, -2],
  W: [1, 1, -2],
  T: [1, 1, -2],
  T_tension: [1, 1, -2],

  // Spring & Damping constants
  k: [1, 0, -2], // N/m = (kg m/s^2)/m = kg/s^2 = M T^-2
  c: [1, 0, -1], // kg/s = M T^-1

  // Energy
  E: [1, 2, -2],
  KE: [1, 2, -2],
  PE: [1, 2, -2],
  E0: [1, 2, -2],

  // Momentum
  p: [1, 1, -1],

  // Angular / Frequency
  omega: [0, 0, -1],
  omega0: [0, 0, -1],
  omega_d: [0, 0, -1],
  gamma: [0, 0, -1],

  // Dimensionless
  theta: [0, 0, 0],
  mu: [0, 0, 0],
  mu_k: [0, 0, 0],
  mu_s: [0, 0, 0],
  e: [0, 0, 0],
};

export function dimToString(d: DimVector): string {
  const [m, l, t] = d;
  if (m === 0 && l === 0 && t === 0) return "dimensionless";
  const parts: string[] = [];
  if (m !== 0) parts.push(m === 1 ? "M" : `M^${m}`);
  if (l !== 0) parts.push(l === 1 ? "L" : `L^${l}`);
  if (t !== 0) parts.push(t === 1 ? "T" : `T^${t}`);
  return parts.join(" ");
}

export function isEqualDim(d1: DimVector, d2: DimVector): boolean {
  return d1[0] === d2[0] && d1[1] === d2[1] && d1[2] === d2[2];
}

export interface UnitCheckResult {
  valid: boolean;
  dim?: DimVector;
  error?: string;
}

export function evaluateNodeDimension(
  node: math.MathNode,
  customSymbols: Record<string, DimVector> = {}
): DimVector {
  const symbols = { ...SYMBOL_DIM_MAP, ...customSymbols };

  if (node.type === "ConstantNode") {
    return [0, 0, 0];
  }

  if (node.type === "SymbolNode") {
    const symbolNode = node as math.SymbolNode;
    const name = symbolNode.name;
    if (name in symbols) {
      return symbols[name];
    }
    // Constants like pi, e
    if (name === "pi" || name === "e") {
      return [0, 0, 0];
    }
    // Default fallback: dimensionless if unknown
    return [0, 0, 0];
  }

  if (node.type === "ParenthesisNode") {
    const pNode = node as unknown as { content: math.MathNode };
    return evaluateNodeDimension(pNode.content, customSymbols);
  }

  if (node.type === "OperatorNode") {
    const opNode = node as math.OperatorNode;
    const op = opNode.op;
    const args = opNode.args;

    if (op === "+" || op === "-") {
      if (args.length === 1) {
        // Unary minus or plus
        return evaluateNodeDimension(args[0], customSymbols);
      }
      const d0 = evaluateNodeDimension(args[0], customSymbols);
      const d1 = evaluateNodeDimension(args[1], customSymbols);
      if (!isEqualDim(d0, d1)) {
        throw new Error(
          `Cannot add/subtract incompatible dimensions: [${dimToString(d0)}] and [${dimToString(d1)}]`
        );
      }
      return d0;
    }

    if (op === "*") {
      let result: DimVector = [0, 0, 0];
      for (const arg of args) {
        const d = evaluateNodeDimension(arg, customSymbols);
        result = [result[0] + d[0], result[1] + d[1], result[2] + d[2]];
      }
      return result;
    }

    if (op === "/") {
      const d0 = evaluateNodeDimension(args[0], customSymbols);
      const d1 = evaluateNodeDimension(args[1], customSymbols);
      return [d0[0] - d1[0], d0[1] - d1[1], d0[2] - d1[2]];
    }

    if (op === "^") {
      const baseDim = evaluateNodeDimension(args[0], customSymbols);
      // Power must be a numeric constant
      let power = 1;
      const expNode = args[1];
      if (expNode.type === "ConstantNode") {
        power = Number((expNode as math.ConstantNode).value);
      } else if (
        expNode.type === "OperatorNode" &&
        (expNode as math.OperatorNode).op === "/"
      ) {
        // Fraction exponent, e.g. 1/2
        const subArgs = (expNode as math.OperatorNode).args;
        if (
          subArgs[0].type === "ConstantNode" &&
          subArgs[1].type === "ConstantNode"
        ) {
          power =
            Number((subArgs[0] as math.ConstantNode).value) /
            Number((subArgs[1] as math.ConstantNode).value);
        }
      } else {
        const expDim = evaluateNodeDimension(expNode, customSymbols);
        if (!isEqualDim(expDim, [0, 0, 0])) {
          throw new Error("Exponent must be dimensionless");
        }
      }
      return [baseDim[0] * power, baseDim[1] * power, baseDim[2] * power];
    }
  }

  if (node.type === "FunctionNode") {
    const fnNode = node as unknown as { name?: string; fn?: { name?: string }; args: math.MathNode[] };
    const name = fnNode.name || fnNode.fn?.name || "";
    const args = fnNode.args || [];

    if (name === "sin" || name === "cos" || name === "tan") {
      const argDim = evaluateNodeDimension(args[0], customSymbols);
      if (!isEqualDim(argDim, [0, 0, 0])) {
        throw new Error(
          `Trigonometric function ${name} argument must be dimensionless, got [${dimToString(argDim)}]`
        );
      }
      return [0, 0, 0];
    }

    if (name === "exp") {
      const argDim = evaluateNodeDimension(args[0], customSymbols);
      if (!isEqualDim(argDim, [0, 0, 0])) {
        throw new Error(
          `Exponential function argument must be dimensionless, got [${dimToString(argDim)}]`
        );
      }
      return [0, 0, 0];
    }

    if (name === "sqrt") {
      const argDim = evaluateNodeDimension(args[0], customSymbols);
      return [argDim[0] * 0.5, argDim[1] * 0.5, argDim[2] * 0.5];
    }
  }

  return [0, 0, 0];
}

export function checkExpressionUnits(
  exprStr: string,
  lhsSymbol?: string,
  customSymbols: Record<string, DimVector> = {}
): UnitCheckResult {
  try {
    const parsed = math.parse(exprStr);
    const computedDim = evaluateNodeDimension(parsed, customSymbols);

    if (lhsSymbol) {
      const symbols = { ...SYMBOL_DIM_MAP, ...customSymbols };
      const expectedDim = symbols[lhsSymbol];
      if (expectedDim && !isEqualDim(computedDim, expectedDim)) {
        return {
          valid: false,
          dim: computedDim,
          error: `Dimensional mismatch for ${lhsSymbol}: expected [${dimToString(
            expectedDim
          )}], but RHS evaluates to [${dimToString(computedDim)}]`,
        };
      }
    }

    return {
      valid: true,
      dim: computedDim,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      error: message,
    };
  }
}
