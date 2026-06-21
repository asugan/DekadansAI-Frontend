export interface ModelPresentationInput {
  id: string;
  name?: string;
  provider?: string | null;
}

export interface ModelPresentation {
  description: string;
  logo: string;
  accent: string;
}

const MODEL_PRESENTATIONS: Record<string, ModelPresentation> = {
  minimax: {
    description: "Fast, efficient reasoning for agents, workflow automation, and everyday API workloads.",
    logo: "/minimax.png",
    accent: "from-amber-300/20 to-cyan-300/10"
  },
  glm: {
    description: "Strong coding and reasoning model for technical tasks, long-form answers, and assistants.",
    logo: "/zai.jpg",
    accent: "from-cyan-300/20 to-blue-500/10"
  },
  zai: {
    description: "Strong coding and reasoning model for technical tasks, long-form answers, and assistants.",
    logo: "/zai.jpg",
    accent: "from-cyan-300/20 to-blue-500/10"
  },
  kimi: {
    description: "Long-context model for research, document-heavy flows, and multi-step reasoning.",
    logo: "/kimilogo.webp",
    accent: "from-violet-400/20 to-cyan-300/10"
  },
  openai: {
    description: "Premium general intelligence for harder prompts, agents, writing, and production copilots.",
    logo: "/chatgptlogo.png",
    accent: "from-emerald-300/20 to-cyan-300/10"
  },
  chatgpt: {
    description: "Premium general intelligence for harder prompts, agents, writing, and production copilots.",
    logo: "/chatgptlogo.png",
    accent: "from-emerald-300/20 to-cyan-300/10"
  },
  gpt: {
    description: "Premium general intelligence for harder prompts, agents, writing, and production copilots.",
    logo: "/chatgptlogo.png",
    accent: "from-emerald-300/20 to-cyan-300/10"
  },
  deepseek: {
    description: "Cost-efficient coding and reasoning model for high-throughput agentic workloads.",
    logo: "/model-icons/deepseek.svg",
    accent: "from-blue-500/20 to-cyan-300/10"
  },
  qwen: {
    description: "General-purpose model family for multilingual reasoning, coding, and instruction following.",
    logo: "/model-icons/qwen.svg",
    accent: "from-violet-500/20 to-blue-400/10"
  }
};

const ID_PREFIXES = [
  "minimax",
  "glm",
  "kimi",
  "gpt",
  "chatgpt",
  "openai",
  "deepseek",
  "qwen"
];

function normalize(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getModelPresentation(model: ModelPresentationInput): ModelPresentation {
  const normalizedId = normalize(model.id);
  const normalizedProvider = normalize(model.provider);
  const normalizedName = normalize(model.name);

  const directMatch =
    MODEL_PRESENTATIONS[normalizedId] ||
    MODEL_PRESENTATIONS[normalizedProvider] ||
    MODEL_PRESENTATIONS[normalizedName];

  if (directMatch) {
    return directMatch;
  }

  const prefix = ID_PREFIXES.find(
    (item) =>
      normalizedId.startsWith(item) ||
      normalizedProvider.startsWith(item) ||
      normalizedName.startsWith(item)
  );

  if (prefix) {
    return MODEL_PRESENTATIONS[prefix];
  }

  return {
    description: "Production-ready AI model available through the Dekadans unified gateway.",
    logo: "/logo.png",
    accent: "from-cyan-300/20 to-fuchsia-400/10"
  };
}
