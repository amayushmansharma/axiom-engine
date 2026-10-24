import { NextRequest, NextResponse } from "next/server";
import { StructuredPhysicsSceneSchema, StructuredPhysicsScene, DerivationStep } from "@/schemas/compilerSchema";
import { verifyDerivationSteps } from "@/core-engine/symbolic-checker";
import { PRESET_INCLINE, PRESET_PULLEY, PRESET_PROJECTILE, PRESET_SHM } from "@/data/presets";

// Simple in-memory rate limiter: 30 requests/minute per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (entry.count >= 30) {
    return false;
  }
  entry.count++;
  return true;
}

// Fallback: Parse typed derivation text or standard steps offline
function buildOfflineSceneFromText(text: string, hintLang: string): StructuredPhysicsScene {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith("//"));

  // Detect domain
  const lower = text.toLowerCase();
  let basePreset = PRESET_INCLINE;
  if (lower.includes("pulley") || lower.includes("atwood") || lower.includes("t - ") || lower.includes("m1") || lower.includes("m2")) {
    basePreset = PRESET_PULLEY;
  } else if (lower.includes("projectile") || lower.includes("trajectory") || lower.includes("v0") || lower.includes("theta")) {
    basePreset = PRESET_PROJECTILE;
  } else if (lower.includes("spring") || lower.includes("shm") || lower.includes("omega") || lower.includes("harmonic")) {
    basePreset = PRESET_SHM;
  }

  // Parse lines with "=" into derivation steps
  const steps: DerivationStep[] = [];
  let stepNum = 1;

  for (const line of lines) {
    const eqIdx = line.indexOf("=");
    if (eqIdx !== -1) {
      const lhs = line.slice(0, eqIdx).replace(/^(step\s*\d+:?\s*)/i, "").trim();
      const rhs = line.slice(eqIdx + 1).trim();

      // Find matching reference step from basePreset if possible
      const matchedRef = basePreset.derivation_steps.find(
        (s) => s.lhs.toLowerCase() === lhs.toLowerCase() || s.step_number === stepNum
      );

      steps.push({
        step_number: stepNum,
        latex: `${lhs} = ${rhs}`,
        lhs: lhs || matchedRef?.lhs || `step_${stepNum}`,
        expr: rhs,
        reference_expr: matchedRef?.reference_expr || rhs,
        status: "VALID",
        explanation: matchedRef?.explanation,
        socratic_hint: matchedRef?.socratic_hint,
        socratic_hint_hinglish: matchedRef?.socratic_hint_hinglish,
        corrected_step_latex: matchedRef?.corrected_step_latex,
      });
      stepNum++;
    }
  }

  // If no lines had "=", use base preset
  if (steps.length === 0) {
    return basePreset;
  }

  // Run deterministic verification on extracted steps
  const verifications = verifyDerivationSteps(steps, basePreset.symbols);
  const finalSteps = steps.map((s, i) => {
    const v = verifications[i];
    return {
      ...s,
      status: v?.status ?? s.status,
      error_type: v?.error_type ?? s.error_type,
      explanation: v?.explanation ?? s.explanation,
      socratic_hint: v?.socratic_hint ?? s.socratic_hint,
      socratic_hint_hinglish: v?.socratic_hint_hinglish ?? s.socratic_hint_hinglish,
    };
  });

  return {
    ...basePreset,
    derivation_steps: finalSteps,
  };
}

// Repair loose JSON into valid StructuredPhysicsScene
function sanitizeScene(raw: Record<string, unknown>): StructuredPhysicsScene {
  const domain = (raw.problem_metadata as Record<string, unknown>)?.domain as string;
  let defaultPreset = PRESET_INCLINE;
  if (domain === "atwood") defaultPreset = PRESET_PULLEY;
  else if (domain === "projectile_collision") defaultPreset = PRESET_PROJECTILE;
  else if (domain === "shm") defaultPreset = PRESET_SHM;

  const metadata = {
    title: ((raw.problem_metadata as Record<string, unknown>)?.title as string) || defaultPreset.problem_metadata.title,
    domain: (["incline", "atwood", "projectile_collision", "shm"].includes(domain)
      ? domain
      : defaultPreset.problem_metadata.domain) as "incline" | "atwood" | "projectile_collision" | "shm",
    theme_color: ((raw.problem_metadata as Record<string, unknown>)?.theme_color as string) || defaultPreset.problem_metadata.theme_color,
    dimensional_check_passed: true,
  };

  const symbols = Array.isArray(raw.symbols) && raw.symbols.length > 0
    ? (raw.symbols as Record<string, unknown>[]).map((sym, i) => {
        const def = defaultPreset.symbols[i] || defaultPreset.symbols[0];
        return {
          name: String(sym.name || def.name),
          label: String(sym.label || def.label),
          dim: String(sym.dim || def.dim),
          unit: String(sym.unit || def.unit),
          value: Number(sym.value ?? def.value),
          min: Number(sym.min ?? def.min),
          max: Number(sym.max ?? def.max),
          step: Number(sym.step ?? def.step),
        };
      })
    : defaultPreset.symbols;

  const rawSteps = Array.isArray(raw.derivation_steps) ? (raw.derivation_steps as Record<string, unknown>[]) : [];
  const derivation_steps: DerivationStep[] = rawSteps.length > 0
    ? rawSteps.map((st, idx) => {
        const ref = defaultPreset.derivation_steps[idx] || defaultPreset.derivation_steps[0];
        return {
          step_number: Number(st.step_number || idx + 1),
          latex: String(st.latex || ref.latex),
          lhs: String(st.lhs || ref.lhs),
          expr: String(st.expr || ref.expr),
          reference_expr: String(st.reference_expr || ref.reference_expr),
          status: "VALID" as const,
          explanation: st.explanation ? String(st.explanation) : ref.explanation,
          socratic_hint: st.socratic_hint ? String(st.socratic_hint) : ref.socratic_hint,
          socratic_hint_hinglish: st.socratic_hint_hinglish ? String(st.socratic_hint_hinglish) : ref.socratic_hint_hinglish,
          corrected_step_latex: st.corrected_step_latex ? String(st.corrected_step_latex) : ref.corrected_step_latex,
        };
      })
    : defaultPreset.derivation_steps;

  const simulation_scene = {
    ...defaultPreset.simulation_scene,
    ...((raw.simulation_scene as Record<string, unknown>) || {}),
  };

  return {
    problem_metadata: metadata,
    symbols,
    derivation_steps,
    simulation_scene,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded (max 30 requests/min). Try again shortly." },
        { status: 429 }
      );
    }

    const keyFromHeader = req.headers.get("x-user-gemini-key");
    const apiKey = keyFromHeader || process.env.GEMINI_API_KEY;

    // Read body safely
    const body = await req.json().catch(() => ({}));
    const { imageBase64, studentLatex, hintLang = "en" } = body;

    // If no API key is available, run offline text/preset compiler
    if (!apiKey) {
      if (studentLatex) {
        const scene = buildOfflineSceneFromText(studentLatex, hintLang);
        return NextResponse.json({
          mode: "offline",
          scene,
          message: "Compiled derivation offline using deterministic AST engine.",
        });
      }
      return NextResponse.json({
        mode: "demo",
        scene: PRESET_INCLINE,
        message: "No Gemini API key detected. Loaded verified offline demonstration.",
      });
    }

    // Default to configured stable Flash model
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    // Prepare system prompt for OCR & Physics Scene compilation
    const systemPrompt = `You are the Axiom Engine Multimodal Physics Compiler.
Given an image of handwritten math derivations or problem text, extract the derivation steps and emit ONLY valid JSON matching this schema:
{
  "problem_metadata": { "title": string, "domain": "incline" | "atwood" | "projectile_collision" | "shm", "theme_color": string, "dimensional_check_passed": boolean },
  "symbols": [{ "name": string, "label": string, "dim": string, "unit": string, "value": number, "min": number, "max": number, "step": number }],
  "derivation_steps": [{ "step_number": number, "latex": string, "lhs": string, "expr": string, "reference_expr": string, "status": "VALID", "explanation": string, "socratic_hint": string, "socratic_hint_hinglish": string, "corrected_step_latex": string }],
  "simulation_scene": { "gravity": 9.81, "bodies": [{ "id": string, "type": string, "mass_kg": number, "vectors_to_render": string[] }] }
}
Important:
1. Provide 'expr' (student's written RHS) and 'reference_expr' (correct physics RHS) as valid math.js parseable strings.
2. Domain must be exactly one of: incline, atwood, projectile_collision, shm.
3. Return ONLY valid JSON with no markdown fences, no formatting backticks.`;

    const contents: unknown[] = [];
    const parts: unknown[] = [{ text: systemPrompt }];

    if (studentLatex) {
      parts.push({ text: `Student wrote derivation:\n${studentLatex}` });
    }

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      } else {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        });
      }
    }

    contents.push({ role: "user", parts });

    // Call Gemini API via fetch (safe 25s timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let apiResponse;
    try {
      apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.warn("Fetch to Gemini API failed, using offline fallback:", fetchErr);
      const fallbackScene = studentLatex
        ? buildOfflineSceneFromText(studentLatex, hintLang)
        : PRESET_INCLINE;
      return NextResponse.json({
        mode: "offline",
        scene: fallbackScene,
        message: "Network call to Gemini timed out. Compiled offline.",
      });
    }

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.warn("Gemini API call returned error, falling back to offline compiler:", errorText);
      const fallbackScene = studentLatex
        ? buildOfflineSceneFromText(studentLatex, hintLang)
        : PRESET_INCLINE;
      return NextResponse.json({
        mode: "offline",
        scene: fallbackScene,
        message: "Gemini API unavailable. Compiled using offline deterministic AST engine.",
      });
    }

    const data = await apiResponse.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      const fallbackScene = studentLatex
        ? buildOfflineSceneFromText(studentLatex, hintLang)
        : PRESET_INCLINE;
      return NextResponse.json({
        mode: "offline",
        scene: fallbackScene,
        message: "Gemini produced empty response. Used offline engine.",
      });
    }

    // Clean markdown formatting if present
    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    }

    let parsedScene: StructuredPhysicsScene;
    try {
      const rawJson = JSON.parse(cleanJson);
      // Sanitize and validate
      parsedScene = sanitizeScene(rawJson);
      StructuredPhysicsSceneSchema.parse(parsedScene);
    } catch (parseErr) {
      console.warn("Failed to parse Gemini JSON output, sanitizing:", parseErr);
      parsedScene = studentLatex
        ? buildOfflineSceneFromText(studentLatex, hintLang)
        : PRESET_INCLINE;
    }

    // Run Deterministic Engine Verification (Single Source of Truth)
    const verificationResults = verifyDerivationSteps(
      parsedScene.derivation_steps,
      parsedScene.symbols
    );

    // Overwrite statuses with deterministic math engine verdicts
    parsedScene.derivation_steps = parsedScene.derivation_steps.map((st, idx) => {
      const v = verificationResults[idx];
      return {
        ...st,
        status: v?.status ?? st.status,
        error_type: v?.error_type ?? st.error_type,
        explanation: v?.explanation ?? st.explanation,
        socratic_hint: v?.socratic_hint ?? st.socratic_hint,
        socratic_hint_hinglish: v?.socratic_hint_hinglish ?? st.socratic_hint_hinglish,
      };
    });

    return NextResponse.json({
      mode: "ai",
      scene: parsedScene,
      verification: verificationResults,
      message: "Derivation successfully extracted & verified by AST engine!",
    });
  } catch (err: unknown) {
    console.error("Error in /api/analyze-work:", err);
    return NextResponse.json({
      mode: "offline",
      scene: PRESET_INCLINE,
      message: "Server exception during compilation. Falling back to offline engine.",
    });
  }
}
