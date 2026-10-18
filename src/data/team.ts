export interface TeamMember {
  name: string;
  role: string;
  github: string;
  linkedin: string;
  instagram: string;
  email: string;
  contributions: string[];
}

export const TEAM: TeamMember[] = [
  {
    name: "Priya",
    role: "Co-creator & Frontend Architecture Lead",
    github: "https://github.com/priya-kumaricodes",
    linkedin: "https://www.linkedin.com/in/priya-kumari-411706444/",
    instagram: "", // none provided: hide the icon when empty
    email: "priya06.18kumari@gmail.com",
    contributions: [
      "Designed and developed the award-winning Neo-Brutalist & Buttermax tactile hardware UI",
      "Engineered the global Buttermax.net-style liquid metaball cursor with text inversion",
      "Architected the two-way live state synchronization system using Zustand",
      "Integrated zero-latency Socratic voice feedback with browser Web Speech API",
      "Created the 60 FPS studio EQ audio-phys telemetry canvas visualizer",
    ],
  },
  {
    name: "Anurag",
    role: "Co-creator & Core Engine & Solvers Lead",
    github: "https://github.com/Anurag-tiwaricodes",
    linkedin: "https://www.linkedin.com/in/anurag-tiwari-2b1913427/",
    instagram: "https://www.instagram.com/anurag.tiwari1805/",
    email: "anurag18.05tiwari@gmail.com",
    contributions: [
      "Engineered the deterministic symbolic math engine & AST step verification using math.js",
      "Built dimensional analysis, unit validation, and precision single-mutation error classification",
      "Authored 120 Hz fixed-timestep physics solvers (analytic incline, Atwood, and RK4 SHM)",
      "Implemented Gemini Vision multimodal OCR pipeline and schema sanitization",
      "Designed the 17-point Vitest verification and regression testing suite",
    ],
  },
];

export const REPO_URL = "https://github.com/priya-kumaricodes/axiom-engine";
