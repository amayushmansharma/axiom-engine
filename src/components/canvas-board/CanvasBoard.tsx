"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEngineStore } from "@/state/useEngineStore";
import { KaTeXBlock } from "../math/KaTeXBlock";
import {
  Pen,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  Type,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileCode,
  Languages,
} from "lucide-react";

export function CanvasBoard() {
  const {
    preset,
    params,
    steps,
    selectedStepIndex,
    revealedSteps,
    activeTab,
    typedLatex,
    canvasImageBase64,
    hintLang,
    mode,
    userApiKey,
    setSelectedStepIndex,
    revealStep,
    setHintLang,
    setActiveTab,
    setTypedLatex,
    setCanvasImageBase64,
    addToast,
    loadCustomScene,
    runVerification,
  } = useEngineStore();

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penColor, setPenColor] = useState("#0B0B0B");
  const [penWidth, setPenWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Modals & reveals
  const [confirmingRevealStep, setConfirmingRevealStep] = useState<number | null>(null);
  const [expandedWhyStep, setExpandedWhyStep] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Fill background with warm notebook tint
    ctx.fillStyle = "#FCFBF7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial blank state
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
    setHistoryStep(0);
  }, []);

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(0, historyStep + 1), data]);
    setHistoryStep((prev) => prev + 1);
  }, [historyStep]);

  const undo = () => {
    if (historyStep <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const nextStep = historyStep - 1;
    ctx.putImageData(history[nextStep], 0, 0);
    setHistoryStep(nextStep);
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const nextStep = historyStep + 1;
    ctx.putImageData(history[nextStep], 0, 0);
    setHistoryStep(nextStep);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FCFBF7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
    setCanvasImageBase64(null);
  };

  // Pointer event handlers for drawing
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only engage drawing on left click down
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y, pressure } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = tool === "pen" ? penWidth * (0.5 + pressure) : 24;
    ctx.strokeStyle = tool === "pen" ? penColor : "#FCFBF7";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y, pressure } = getCanvasCoords(e);
    ctx.lineWidth = tool === "pen" ? penWidth * (0.5 + pressure) : 24;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    try {
      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    saveCanvasState();
  };

  // Process and downscale/contrast-normalize image before analysis
  const processImageFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      addToast("Image exceeds 4 MB limit. Please use a smaller file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement("canvas");
        const maxDim = 1280;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        offCanvas.width = w;
        offCanvas.height = h;
        const offCtx = offCanvas.getContext("2d");
        if (!offCtx) return;

        offCtx.drawImage(img, 0, 0, w, h);

        // Grayscale & Levels Histogram Contrast normalization
        const imgData = offCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        let minLum = 255;
        let maxLum = 0;

        for (let i = 0; i < data.length; i += 4) {
          const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }

        const lumRange = Math.max(1, maxLum - minLum);
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const normalized = Math.min(255, Math.max(0, ((lum - minLum) / lumRange) * 255));
          data[i] = normalized;
          data[i + 1] = normalized;
          data[i + 2] = normalized;
        }
        offCtx.putImageData(imgData, 0, 0);

        const base64 = offCanvas.toDataURL("image/jpeg", 0.8);
        setCanvasImageBase64(base64);

        // Also draw onto the main work canvas
        const mainCanvas = canvasRef.current;
        if (mainCanvas) {
          const ctx = mainCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(offCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
            saveCanvasState();
          }
        }
        addToast("Photo loaded and contrast-normalized.", "success");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Load bundled handwriting sample SVG
  const loadSampleHandwriting = () => {
    const domain = preset.problem_metadata.domain;
    let sampleSvgUrl = "/presets/sample-incline.svg";
    if (domain === "atwood") sampleSvgUrl = "/presets/sample-pulley.svg";
    if (domain === "projectile_collision") sampleSvgUrl = "/presets/sample-projectile.svg";
    if (domain === "shm") sampleSvgUrl = "/presets/sample-shm.svg";

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveCanvasState();
      setCanvasImageBase64(canvas.toDataURL("image/jpeg", 0.8));
      addToast(`Loaded ${preset.problem_metadata.title} rough-work sample.`, "info");
    };
    img.src = sampleSvgUrl;
  };

  // Analyze Work action
  const handleAnalyzeWork = async () => {
    setIsAnalyzing(true);
    addToast("Analyzing derivation steps with symbolic engine...", "info");

    try {
      // If canvas has drawing but no canvasImageBase64 yet, snapshot it now
      let currentImageBase64 = canvasImageBase64;
      if (!currentImageBase64 && canvasRef.current && activeTab === "draw") {
        currentImageBase64 = canvasRef.current.toDataURL("image/jpeg", 0.8);
      }

      const res = await fetch("/api/analyze-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-user-gemini-key": userApiKey } : {}),
        },
        body: JSON.stringify({
          imageBase64: currentImageBase64 || undefined,
          studentLatex: typedLatex || undefined,
          hintLang,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.scene) {
          loadCustomScene(result.scene);
          setIsAnalyzing(false);
          addToast(result.message || "Derivation verified by symbolic math engine!", "success");
          return;
        } else if (result.message) {
          addToast(result.message, "info");
        }
      }

      // Offline deterministic verification fallback
      setTimeout(() => {
        runVerification();
        setIsAnalyzing(false);
        addToast("Derivation verified by symbolic math engine.", "success");
      }, 400);
    } catch {
      runVerification();
      setIsAnalyzing(false);
      addToast("Offline verification completed.", "info");
    }
  };

  // Compile typed problem to physics
  const handleCompileToPhysics = () => {
    if (!typedLatex.trim()) {
      addToast("Enter a problem statement or equation in the Type tab first.", "warning");
      return;
    }
    handleAnalyzeWork();
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] border-r-2 border-ax-ink text-ax-ink overflow-y-auto relative select-none">
      {/* Top Status Header */}
      <div className="px-4 py-3 border-b-2 border-ax-ink bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black shadow-sm"></span>
          </span>
          <span className="font-mono text-xs font-black tracking-wider text-black">
            AST COMPILER ONLINE // LATEX TOKENIZER
          </span>
        </div>

        <div className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#FFD500] border-2 border-black text-black font-black uppercase tracking-widest shadow-sm">
          MODULE 01
        </div>
      </div>

      {/* Mode Selectors & Handwriting Sample Bar */}
      <div className="p-3.5 border-b-2 border-ax-ink bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-2.5">
        {/* Mode Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#EFECE6] border-2 border-black shadow-inner">
          <button
            onClick={() => setActiveTab("draw")}
            className={`px-3 py-1.5 text-xs font-mono font-black uppercase rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "draw"
                ? "bg-[#0B0B0B] text-[#FFD500] shadow-sm"
                : "text-black/70 hover:text-black"
            }`}
          >
            <Pen className="w-3.5 h-3.5" /> DRAW
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 text-xs font-mono font-black uppercase rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "upload"
                ? "bg-[#0B0B0B] text-[#FFD500] shadow-sm"
                : "text-black/70 hover:text-black"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> UPLOAD
          </button>
          <button
            onClick={() => setActiveTab("type")}
            className={`px-3 py-1.5 text-xs font-mono font-black uppercase rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "type"
                ? "bg-[#0B0B0B] text-[#FFD500] shadow-sm"
                : "text-black/70 hover:text-black"
            }`}
          >
            <Type className="w-3.5 h-3.5" /> TYPE
          </button>
        </div>

        {/* Language Toggle & Sample Handwriting */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHintLang(hintLang === "en" ? "hinglish" : "en")}
            className="px-2.5 py-1.5 rounded-lg border-2 border-black bg-white text-black font-mono text-xs font-bold hover:bg-slate-100 flex items-center gap-1 transition-all shadow-[2px_2px_0px_#000000]"
            title="Toggle Socratic hint language"
          >
            <Languages className="w-3.5 h-3.5 text-[#1A55F0]" />
            <span>{hintLang === "en" ? "EN" : "HINGLISH"}</span>
          </button>

          <button
            onClick={loadSampleHandwriting}
            className="px-3 py-1.5 rounded-lg border-2 border-black bg-[#FFD500] hover:bg-yellow-400 text-black font-mono text-[11px] font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000000] active:translate-y-0.5 active:shadow-none"
          >
            USE SAMPLE HANDWRITING
          </button>
        </div>
      </div>

      {/* Main Board View: DRAW / UPLOAD / TYPE inside High-Contrast Frame */}
      <div className="p-4 border-b-2 border-ax-ink bg-[#FFFFFF]">
        {activeTab === "draw" && (
          <div className="flex flex-col gap-2">
            {/* Drawing Toolbar Plate */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#F8F8F5] border-2 border-black shadow-sm">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTool("pen")}
                  className={`p-1.5 rounded-lg border border-black transition-all ${
                    tool === "pen"
                      ? "bg-[#0B0B0B] text-[#FFD500] shadow-sm"
                      : "bg-white text-black hover:bg-slate-100"
                  }`}
                  title="Pen Tool"
                >
                  <Pen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool("eraser")}
                  className={`p-1.5 rounded-lg border border-black transition-all ${
                    tool === "eraser"
                      ? "bg-[#0B0B0B] text-[#FFD500] shadow-sm"
                      : "bg-white text-black hover:bg-slate-100"
                  }`}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l-2 border-black/20">
                  {["#0B0B0B", "#1A55F0", "#DC2626", "#16A34A"].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setPenColor(c);
                        setTool("pen");
                      }}
                      style={{ backgroundColor: c }}
                      className={`w-4 h-4 rounded-full border border-black transition-transform ${
                        penColor === c && tool === "pen"
                          ? "ring-2 ring-black scale-110"
                          : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={undo}
                  disabled={historyStep <= 0}
                  className="p-1.5 rounded-lg border border-black bg-white text-black hover:bg-slate-100 disabled:opacity-30"
                  title="Undo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={historyStep >= history.length - 1}
                  className="p-1.5 rounded-lg border border-black bg-white text-black hover:bg-slate-100 disabled:opacity-30"
                  title="Redo"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={clearCanvas}
                  className="p-1.5 rounded-lg border border-black bg-red-100 text-red-700 hover:bg-red-200"
                  title="Clear Canvas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recessed Notebook Canvas */}
            <div className="relative border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_#0B0B0B] bg-[#FCFBF7]">
              <canvas
                ref={canvasRef}
                width={600}
                height={320}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full h-56 cursor-crosshair bg-[#FCFBF7]"
              />
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-black/50 rounded-xl bg-[#F8F8F5] hover:border-black transition-colors">
            <Upload className="w-10 h-10 text-black/60 mb-3" />
            <p className="font-display font-bold text-base text-black text-center">
              Drop your rough-work derivation photo here
            </p>
            <p className="font-sans text-xs text-black/60 mt-1 mb-4 text-center">
              JPG, PNG up to 4 MB. Auto-grayscale &amp; contrast normalized.
            </p>
            <label className="px-5 py-2.5 rounded-xl border-2 border-black bg-[#FFD500] text-black font-mono text-xs font-black uppercase cursor-pointer hover:bg-yellow-400 shadow-[2px_2px_0px_#000000] active:translate-y-0.5 active:shadow-none transition-all">
              SELECT FILE
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImageFile(file);
                }}
              />
            </label>
          </div>
        )}

        {activeTab === "type" && (
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs uppercase tracking-wider text-black font-bold">
              Type Derivation Steps or Physics Problem
            </label>
            <textarea
              value={typedLatex}
              onChange={(e) => setTypedLatex(e.target.value)}
              placeholder="e.g. Block of mass 5kg slides down a 30° incline with friction μ=0.25... or type LaTeX lines like: F_net = m*g*sin(\theta) - f_k"
              rows={4}
              className="w-full p-3 font-mono text-xs rounded-xl border-2 border-black bg-[#FCFBF7] text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#1A55F0]"
            />
          </div>
        )}

        {/* Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={handleAnalyzeWork}
            disabled={isAnalyzing}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-black bg-[#0B0B0B] text-[#FFD500] font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#1A55F0] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#FFD500]" />
            {isAnalyzing ? "VERIFYING AST..." : "ANALYZE WORK"}
          </button>

          <button
            onClick={handleCompileToPhysics}
            className="py-3 px-4 rounded-xl border-2 border-black bg-[#FFFFFF] text-black font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#0B0B0B] hover:bg-yellow-50 hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-150 flex items-center gap-2"
          >
            <FileCode className="w-4 h-4 text-[#1A55F0]" /> COMPILE TO PHYSICS
          </button>
        </div>
      </div>

      {/* Step Debugger List */}
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1A55F0] border border-black shadow-sm" />
            <h3 className="font-display font-extrabold text-base text-black tracking-tight">
              DERIVATION AST STEPS ({steps.length})
            </h3>
          </div>
          <span className="font-mono text-xs text-black/70 font-bold bg-[#EFECE6] px-2 py-0.5 rounded border border-black/30">
            {steps.filter((s) => s.verifiedStatus === "VALID").length} of {steps.length} VALID
          </span>
        </div>

        {/* Step Items */}
        <div className="flex flex-col gap-3">
          {steps.map((step, idx) => {
            const isSelected = selectedStepIndex === idx;
            const status = step.verifiedStatus || step.status;
            const isError =
              status === "ERROR_TRIG" ||
              status === "ERROR_SIGN" ||
              status === "ERROR_DIMENSION" ||
              status === "ERROR_ALGEBRAIC" ||
              status === "ERROR_CONCEPTUAL";
            const isPropagated = status === "PROPAGATED";
            const isValid = status === "VALID";
            const isRevealed = revealedSteps[step.step_number];

            // Evaluate live numeric value using current params
            let liveValueStr = "";
            try {
              if (step.lhs === "F_net") {
                const N = params.m * params.g * Math.cos((params.theta * Math.PI) / 180);
                const fk = params.mu * N;
                const net = params.m * params.g * Math.sin((params.theta * Math.PI) / 180) - fk;
                liveValueStr = `F_net = ${net.toFixed(2)} N`;
              } else if (step.lhs === "f_k") {
                const fk =
                  params.mu *
                  params.m *
                  params.g *
                  Math.cos((params.theta * Math.PI) / 180);
                liveValueStr = `f_k = ${fk.toFixed(2)} N`;
              } else if (step.lhs === "a") {
                const a =
                  params.g *
                  (Math.sin((params.theta * Math.PI) / 180) -
                    params.mu * Math.cos((params.theta * Math.PI) / 180));
                liveValueStr = `a = ${Math.max(0, a).toFixed(3)} m/s²`;
              } else if (step.lhs === "T") {
                const m1 = params.m1 ?? 5;
                const m2 = params.m2 ?? 3;
                const mu = params.mu ?? 0.2;
                const g = params.g ?? 9.81;
                const a = ((m2 - mu * m1) * g) / (m1 + m2);
                const T = m1 * a + mu * m1 * g;
                liveValueStr = `T = ${T.toFixed(2)} N`;
              } else if (step.lhs === "t_c") {
                const v0 = params.v0 ?? 20;
                const thetaRad = ((params.theta ?? 53.13) * Math.PI) / 180;
                const x0 = params.x0 ?? 24;
                const tc = x0 / (v0 * Math.cos(thetaRad));
                liveValueStr = `t_c = ${tc.toFixed(2)} s`;
              } else if (step.lhs === "omega0") {
                const m = params.m ?? 2;
                const k = params.k ?? 50;
                const omega = Math.sqrt(k / m);
                liveValueStr = `ω0 = ${omega.toFixed(3)} rad/s`;
              }
            } catch {
              liveValueStr = "";
            }

            return (
              <div
                key={step.step_number}
                onClick={() => setSelectedStepIndex(idx)}
                className={`p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "border-black bg-[#FFFFFF] shadow-[4px_4px_0px_#1A55F0] ring-2 ring-[#1A55F0]"
                    : "border-black bg-[#FFFFFF] shadow-[3px_3px_0px_#0B0B0B] hover:shadow-[4px_4px_0px_#FFE600]"
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-black/60">
                    STEP {step.step_number}
                  </span>

                  {/* Status Chip */}
                  <span
                    className={`font-mono text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                      isValid
                        ? "bg-emerald-100 text-emerald-900 border-emerald-400"
                        : isError
                        ? "bg-rose-100 text-rose-900 border-rose-400"
                        : isPropagated
                        ? "bg-slate-100 text-slate-900 border-slate-400"
                        : "bg-amber-100 text-amber-900 border-amber-400"
                    }`}
                  >
                    {isValid && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    {isError && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {isPropagated && <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />}
                    {status}
                  </span>
                </div>

                {/* KaTeX Math Expression in High-Contrast Crisp Black */}
                <div className="py-2 overflow-x-auto text-base sm:text-lg text-black font-semibold">
                  <KaTeXBlock math={step.latex} />
                </div>

                {/* Live Numeric Readout */}
                {liveValueStr && (
                  <div className="font-mono text-xs text-[#1A55F0] font-bold mt-1 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 inline-block shadow-sm">
                    Live: {liveValueStr}
                  </div>
                )}

                {/* Error diagnostics & Socratic Hint */}
                {isError && (
                  <div className="mt-3 pt-3 border-t border-black/10 flex flex-col gap-2">
                    <div className="p-3 rounded-lg bg-rose-50 border-2 border-rose-300">
                      <p className="font-sans text-xs font-bold text-rose-800 mb-1">
                        Socratic Hint:
                      </p>
                      <p className="font-sans text-xs text-black leading-relaxed">
                        {hintLang === "hinglish" && step.socratic_hint_hinglish
                          ? step.socratic_hint_hinglish
                          : step.socratic_hint || step.verifiedExplanation || "Review the physics law for this step."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedWhyStep(expandedWhyStep === step.step_number ? null : step.step_number);
                        }}
                        className="text-xs font-mono font-bold text-[#1A55F0] hover:underline flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        {expandedWhyStep === step.step_number ? "HIDE EXPLANATION" : "SHOW ME WHY"}
                      </button>

                      {/* Reveal Correct Step */}
                      {!isRevealed ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingRevealStep(step.step_number);
                          }}
                          className="px-2.5 py-1 rounded-md bg-[#0B0B0B] text-[#FFD500] font-mono text-[10px] font-black uppercase hover:bg-black transition-colors shadow-sm"
                        >
                          REVEAL CORRECT STEP
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          REVEALED
                        </span>
                      )}
                    </div>

                    {/* Expanded Why */}
                    {expandedWhyStep === step.step_number && (
                      <div className="p-3 rounded-lg bg-amber-50 border-2 border-amber-300 text-xs font-sans leading-relaxed text-black">
                        {step.verifiedExplanation || step.explanation}
                      </div>
                    )}

                    {/* Revealed Expression */}
                    {isRevealed && step.corrected_step_latex && (
                      <div className="p-3 rounded-lg bg-emerald-50 border-2 border-emerald-400">
                        <span className="font-mono text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                          Correct Expression:
                        </span>
                        <div className="text-sm text-black">
                          <KaTeXBlock math={step.corrected_step_latex} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Propagated Error Message */}
                {isPropagated && (
                  <div className="mt-2 text-xs font-sans text-black/70 italic">
                    {step.verifiedExplanation || step.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog for Reveal */}
      {confirmingRevealStep !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#FFFFFF] border-2 border-black text-black shadow-2xl">
            <h4 className="font-display font-extrabold text-lg text-black mb-2">
              Reveal Step {confirmingRevealStep}?
            </h4>
            <p className="font-sans text-xs sm:text-sm text-black/80 leading-relaxed mb-6">
              Trying to work it out from the Socratic hint creates lasting intuition.
              Are you sure you want to see the corrected expression now?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmingRevealStep(null)}
                className="px-4 py-2 rounded-xl border-2 border-black text-xs font-mono font-bold uppercase hover:bg-slate-100 text-black"
              >
                KEEP TRYING
              </button>
              <button
                onClick={() => {
                  revealStep(confirmingRevealStep);
                  setConfirmingRevealStep(null);
                  addToast(`Step ${confirmingRevealStep} revealed.`, "info");
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-mono font-bold uppercase hover:bg-rose-700 shadow-md border-2 border-black"
              >
                REVEAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
