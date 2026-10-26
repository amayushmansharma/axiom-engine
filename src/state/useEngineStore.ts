import { create } from "zustand";
import {
  DerivationStep,
  StepStatus,
  StructuredPhysicsScene,
  SymbolDefinition,
} from "@/schemas/compilerSchema";
import { PRESET_INCLINE, getPresetById } from "@/data/presets";
import {
  VerificationResult,
  verifyDerivationSteps,
} from "@/core-engine/symbolic-checker";
import { TelemetryPoint } from "@/core-engine/physics-runtime";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export interface EngineStep extends DerivationStep {
  verifiedStatus?: StepStatus;
  verifiedExplanation?: string;
  verifiedErrorType?: string;
}

export interface EngineState {
  // Preset & Configuration
  preset: StructuredPhysicsScene;
  symbols: SymbolDefinition[];
  params: Record<string, number>;
  steps: EngineStep[];
  selectedStepIndex: number;
  revealedSteps: Record<number, boolean>;

  // Modes & UI flags
  mode: "demo" | "ai";
  hintLang: "en" | "hinglish";
  activeTab: "draw" | "upload" | "type";
  typedLatex: string;
  canvasImageBase64: string | null;

  // Simulation Controls
  isPlaying: boolean;
  simSpeed: number;
  showVectors: boolean;
  showTrails: boolean;
  showGrid: boolean;
  resetSignal: number;

  // Telemetry Ring Buffer
  telemetry: TelemetryPoint[];
  enabledSeries: {
    ke: boolean;
    pe: boolean;
    totalEnergy: boolean;
    velocity: boolean;
    acceleration: boolean;
    momentum: boolean;
  };
  isTelemetryFrozen: boolean;

  // Tour / Demo / Modals
  autoDemoActive: boolean;
  autoDemoStepIndex: number;
  activeCoachStep: number | null;
  shortcutsModalOpen: boolean;
  settingsModalOpen: boolean;
  userApiKey: string | null;
  toasts: ToastItem[];

  // Actions
  loadPreset: (presetId: string) => void;
  loadCustomScene: (scene: StructuredPhysicsScene) => void;
  setParam: (name: string, value: number, source?: string) => void;
  setSelectedStepIndex: (index: number) => void;
  revealStep: (stepNumber: number) => void;
  setHintLang: (lang: "en" | "hinglish") => void;
  setActiveTab: (tab: "draw" | "upload" | "type") => void;
  setTypedLatex: (text: string) => void;
  setCanvasImageBase64: (data: string | null) => void;

  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  resetSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  toggleVectors: () => void;
  toggleTrails: () => void;
  toggleGrid: () => void;

  addTelemetryPoint: (pt: TelemetryPoint) => void;
  clearTelemetry: () => void;
  toggleSeries: (
    series: keyof EngineState["enabledSeries"]
  ) => void;
  toggleTelemetryFreeze: () => void;

  startAutoDemo: () => void;
  stopAutoDemo: () => void;
  setAutoDemoStepIndex: (idx: number) => void;

  setCoachStep: (step: number | null) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setUserApiKey: (key: string | null) => void;
  addToast: (message: string, type?: ToastItem["type"]) => void;
  removeToast: (id: string) => void;
  runVerification: () => void;
}

const MAX_TELEMETRY_POINTS = 600; // ~10 seconds at 60 FPS

function buildParamMap(symbols: SymbolDefinition[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of symbols) {
    map[s.name] = s.value;
  }
  return map;
}

export function encodeStateToHash(
  presetId: string,
  params: Record<string, number>
): string {
  const query = new URLSearchParams();
  query.set("preset", presetId);
  for (const [key, val] of Object.entries(params)) {
    query.set(key, String(val));
  }
  return query.toString();
}

export function decodeHashToState(
  hashString: string
): { presetId: string; params: Record<string, number> } | null {
  try {
    const cleanHash = hashString.startsWith("#") ? hashString.slice(1) : hashString;
    if (!cleanHash) return null;
    const query = new URLSearchParams(cleanHash);
    const presetId = query.get("preset");
    if (!presetId) return null;

    const params: Record<string, number> = {};
    query.forEach((value, key) => {
      if (key !== "preset") {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          params[key] = num;
        }
      }
    });

    return { presetId, params };
  } catch {
    return null;
  }
}

export const useEngineStore = create<EngineState>((set, get) => {
  // Initial verification of default preset
  const defaultPreset = PRESET_INCLINE;
  const initialSymbols = defaultPreset.symbols;
  const initialParams = buildParamMap(initialSymbols);
  const initialVerification = verifyDerivationSteps(
    defaultPreset.derivation_steps,
    initialSymbols
  );
  const initialSteps: EngineStep[] = defaultPreset.derivation_steps.map((st, idx) => {
    const v = initialVerification[idx];
    return {
      ...st,
      verifiedStatus: v?.status ?? st.status,
      verifiedExplanation: v?.explanation ?? st.explanation,
      verifiedErrorType: v?.error_type ?? st.error_type,
    };
  });

  return {
    preset: defaultPreset,
    symbols: initialSymbols,
    params: initialParams,
    steps: initialSteps,
    selectedStepIndex: 1, // Step 2 (the bug step) highlighted by default
    revealedSteps: {},

    mode: "demo",
    hintLang: "en",
    activeTab: "draw",
    typedLatex: "",
    canvasImageBase64: null,

    isPlaying: true,
    simSpeed: 1.0,
    showVectors: true,
    showTrails: true,
    showGrid: true,
    resetSignal: 0,

    telemetry: [],
    enabledSeries: {
      ke: true,
      pe: true,
      totalEnergy: true,
      velocity: true,
      acceleration: true,
      momentum: true,
    },
    isTelemetryFrozen: false,

    autoDemoActive: false,
    autoDemoStepIndex: 0,
    activeCoachStep: null,
    shortcutsModalOpen: false,
    settingsModalOpen: false,
    userApiKey: null,
    toasts: [],

    loadPreset: (presetId: string) => {
      const p = getPresetById(presetId);
      const params = buildParamMap(p.symbols);
      const verification = verifyDerivationSteps(p.derivation_steps, p.symbols);
      const steps: EngineStep[] = p.derivation_steps.map((st, idx) => {
        const v = verification[idx];
        return {
          ...st,
          verifiedStatus: v?.status ?? st.status,
          verifiedExplanation: v?.explanation ?? st.explanation,
          verifiedErrorType: v?.error_type ?? st.error_type,
        };
      });

      // Find first error step to focus on
      const firstErrorIdx = steps.findIndex(
        (s) => s.verifiedStatus !== "VALID"
      );

      set({
        preset: p,
        symbols: p.symbols,
        params,
        steps,
        selectedStepIndex: firstErrorIdx !== -1 ? firstErrorIdx : 0,
        revealedSteps: {},
        telemetry: [],
        resetSignal: get().resetSignal + 1,
      });

      get().addToast(`Loaded preset: ${p.problem_metadata.title}`, "info");
    },

    loadCustomScene: (scene: StructuredPhysicsScene) => {
      const params = buildParamMap(scene.symbols);
      const verification = verifyDerivationSteps(scene.derivation_steps, scene.symbols);
      const steps: EngineStep[] = scene.derivation_steps.map((st, idx) => {
        const v = verification[idx];
        return {
          ...st,
          verifiedStatus: v?.status ?? st.status,
          verifiedExplanation: v?.explanation ?? st.explanation,
          verifiedErrorType: v?.error_type ?? st.error_type,
        };
      });

      const firstErrorIdx = steps.findIndex(
        (s) => s.verifiedStatus !== "VALID"
      );

      set({
        preset: scene,
        symbols: scene.symbols,
        params,
        steps,
        selectedStepIndex: firstErrorIdx !== -1 ? firstErrorIdx : 0,
        revealedSteps: {},
        telemetry: [],
        resetSignal: get().resetSignal + 1,
      });

      get().addToast(`Compiled physics scene: ${scene.problem_metadata.title}`, "success");
    },

    setParam: (name: string, value: number) => {
      const { symbols, params } = get();
      const symDef = symbols.find((s) => s.name === name);

      let clampedValue = value;
      if (symDef) {
        // Clamp to min and max
        clampedValue = Math.min(symDef.max, Math.max(symDef.min, value));
        // Round to nearest step
        const invStep = 1 / symDef.step;
        clampedValue = Math.round(clampedValue * invStep) / invStep;
      }

      const updatedParams = { ...params, [name]: clampedValue };
      const updatedSymbols = symbols.map((s) =>
        s.name === name ? { ...s, value: clampedValue } : s
      );

      set({
        params: updatedParams,
        symbols: updatedSymbols,
        telemetry: [], // Reset telemetry to prevent mixing stale data
        resetSignal: get().resetSignal + 1,
      });
    },

    setSelectedStepIndex: (index: number) => {
      set({ selectedStepIndex: index });
    },

    revealStep: (stepNumber: number) => {
      set((state) => ({
        revealedSteps: { ...state.revealedSteps, [stepNumber]: true },
      }));
    },

    setHintLang: (lang: "en" | "hinglish") => {
      set({ hintLang: lang });
    },

    setActiveTab: (tab: "draw" | "upload" | "type") => {
      set({ activeTab: tab });
    },

    setTypedLatex: (text: string) => {
      set({ typedLatex: text });
    },

    setCanvasImageBase64: (data: string | null) => {
      set({ canvasImageBase64: data });
    },

    togglePlay: () => {
      set((state) => ({ isPlaying: !state.isPlaying }));
    },

    setIsPlaying: (playing: boolean) => {
      set({ isPlaying: playing });
    },

    resetSimulation: () => {
      set((state) => ({
        resetSignal: state.resetSignal + 1,
        telemetry: [],
      }));
    },

    setSimSpeed: (speed: number) => {
      set({ simSpeed: speed });
    },

    toggleVectors: () => {
      set((state) => ({ showVectors: !state.showVectors }));
    },

    toggleTrails: () => {
      set((state) => ({ showTrails: !state.showTrails }));
    },

    toggleGrid: () => {
      set((state) => ({ showGrid: !state.showGrid }));
    },

    addTelemetryPoint: (pt: TelemetryPoint) => {
      const { isTelemetryFrozen, telemetry } = get();
      if (isTelemetryFrozen) return;

      const updated = telemetry.length >= MAX_TELEMETRY_POINTS
        ? [...telemetry.slice(1), pt]
        : [...telemetry, pt];

      set({ telemetry: updated });
    },

    clearTelemetry: () => {
      set({ telemetry: [] });
    },

    toggleSeries: (series) => {
      set((state) => ({
        enabledSeries: {
          ...state.enabledSeries,
          [series]: !state.enabledSeries[series],
        },
      }));
    },

    toggleTelemetryFreeze: () => {
      set((state) => ({ isTelemetryFrozen: !state.isTelemetryFrozen }));
    },

    startAutoDemo: () => {
      set({ autoDemoActive: true, autoDemoStepIndex: 0 });
    },

    stopAutoDemo: () => {
      set({ autoDemoActive: false, autoDemoStepIndex: 0 });
    },

    setAutoDemoStepIndex: (idx: number) => {
      set({ autoDemoStepIndex: idx });
    },

    setCoachStep: (step: number | null) => {
      set({ activeCoachStep: step });
    },

    setShortcutsModalOpen: (open: boolean) => {
      set({ shortcutsModalOpen: open });
    },

    setSettingsModalOpen: (open: boolean) => {
      set({ settingsModalOpen: open });
    },

    setUserApiKey: (key: string | null) => {
      set({ userApiKey: key, mode: key ? "ai" : "demo" });
    },

    addToast: (message: string, type: ToastItem["type"] = "info") => {
      const id = `${Date.now()}-${Math.random()}`;
      set((state) => ({
        toasts: [...state.toasts, { id, message, type }],
      }));
      setTimeout(() => {
        get().removeToast(id);
      }, 4000);
    },

    removeToast: (id: string) => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    },

    runVerification: () => {
      const { steps, symbols } = get();
      const results = verifyDerivationSteps(steps, symbols);
      const updatedSteps: EngineStep[] = steps.map((st, idx) => {
        const v = results[idx];
        return {
          ...st,
          verifiedStatus: v?.status ?? st.status,
          verifiedExplanation: v?.explanation ?? st.explanation,
          verifiedErrorType: v?.error_type ?? st.error_type,
        };
      });
      set({ steps: updatedSteps });
    },
  };
});
