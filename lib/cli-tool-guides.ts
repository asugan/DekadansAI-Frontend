export type CliCompatibilityMode = "openai-compatible" | "anthropic-compatible" | "both";

export interface CliInstallCommand {
  label: string;
  command: string;
}

export interface CliToolGuide {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  bestFor: string;
  officialDocsUrl: string;
  compatibility: CliCompatibilityMode;
  configFile: string;
  installCommands: CliInstallCommand[];
  envVars: string[];
  configExample: string;
  verifyCommands: string[];
  checklist: string[];
  troubleshooting: string[];
}

export const OPENAI_COMPATIBLE_BASE_URL = "https://api.dekadans.net/v1";
export const ANTHROPIC_COMPATIBLE_BASE_URL = "https://api.dekadans.net";

export const CLI_TOOL_GUIDES: CliToolGuide[] = [
  {
    slug: "claude-cli",
    name: "Claude CLI",
    tagline: "Anthropic-compatible setup",
    summary:
      "Use Claude Code with Dekadans AI through the Anthropic-compatible Messages endpoint.",
    bestFor: "Teams that already use Claude Code and want a familiar terminal coding workflow.",
    officialDocsUrl: "https://code.claude.com/docs/en/setup",
    compatibility: "anthropic-compatible",
    configFile: ".claude/settings.json",
    installCommands: [
      {
        label: "npm",
        command: "npm install -g @anthropic-ai/claude-code"
      },
      {
        label: "start",
        command: "claude"
      }
    ],
    envVars: ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_MODEL"],
    configExample: `export ANTHROPIC_BASE_URL="${ANTHROPIC_COMPATIBLE_BASE_URL}"
export ANTHROPIC_AUTH_TOKEN="<YOUR_DEKADANS_API_KEY>"
export ANTHROPIC_MODEL="claude-sonnet-4"

claude`,
    verifyCommands: [
      "claude --version",
      "echo $ANTHROPIC_BASE_URL",
      "claude \"Explain this repository in five bullets\""
    ],
    checklist: [
      "Use Node.js 18 or newer before installing the npm package.",
      "Use the Anthropic-compatible root URL, not the /v1 URL.",
      "Keep the API key in your shell profile or a local settings file that is not committed.",
      "Pick a model ID that is available in your Dekadans dashboard."
    ],
    troubleshooting: [
      "If authentication fails, confirm ANTHROPIC_AUTH_TOKEN contains a Dekadans API key.",
      "If the client calls the wrong URL, remove any trailing /v1 from ANTHROPIC_BASE_URL.",
      "If the model is rejected, copy an active model ID from the model catalog."
    ]
  },
  {
    slug: "opencode-cli",
    name: "OpenCode CLI",
    tagline: "OpenAI-compatible provider",
    summary:
      "Register Dekadans AI as a custom OpenAI-compatible provider in opencode.json.",
    bestFor: "Open source terminal workflows that need a configurable provider layer.",
    officialDocsUrl: "https://opencode.ai/docs/",
    compatibility: "openai-compatible",
    configFile: "opencode.json",
    installCommands: [
      {
        label: "npm",
        command: "npm install -g opencode-ai"
      },
      {
        label: "start",
        command: "opencode"
      }
    ],
    envVars: ["DEKADANS_API_KEY"],
    configExample: `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "dekadans": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Dekadans AI",
      "options": {
        "baseURL": "${OPENAI_COMPATIBLE_BASE_URL}",
        "apiKey": "{env:DEKADANS_API_KEY}"
      },
      "models": {
        "gpt-5.5": {
          "name": "Dekadans GPT 5.5"
        }
      }
    }
  },
  "model": "dekadans/gpt-5.5"
}`,
    verifyCommands: [
      "export DEKADANS_API_KEY=\"<YOUR_DEKADANS_API_KEY>\"",
      "opencode --help",
      "opencode"
    ],
    checklist: [
      "Install OpenCode with the package manager recommended by your environment.",
      "Set DEKADANS_API_KEY before starting the TUI.",
      "Use the /v1 base URL for OpenAI-compatible requests.",
      "Add more models under the provider.models object when your catalog grows."
    ],
    troubleshooting: [
      "If the provider is not visible, validate opencode.json syntax.",
      "If requests return 401, reload the shell after exporting DEKADANS_API_KEY.",
      "If completions fail, verify the model ID matches a Dekadans model."
    ]
  },
  {
    slug: "droid-cli",
    name: "Droid CLI",
    tagline: "Custom model configuration",
    summary:
      "Add Dekadans AI models to Droid through customModels in the Factory settings file.",
    bestFor: "Agentic software engineering with spec mode, reviews, MCP, skills, and automation.",
    officialDocsUrl: "https://docs.factory.ai/cli/getting-started/quickstart",
    compatibility: "both",
    configFile: "~/.factory/settings.json",
    installCommands: [
      {
        label: "macOS/Linux",
        command: "curl -fsSL https://app.factory.ai/cli | sh"
      },
      {
        label: "Homebrew",
        command: "brew install --cask droid"
      },
      {
        label: "npm",
        command: "npm install -g droid"
      },
      {
        label: "Windows",
        command: "irm https://app.factory.ai/cli/windows | iex"
      }
    ],
    envVars: ["DEKADANS_API_KEY"],
    configExample: `{
  "customModels": [
    {
      "model": "gpt-5.5",
      "displayName": "Dekadans GPT 5.5",
      "provider": "openai",
      "baseUrl": "${OPENAI_COMPATIBLE_BASE_URL}",
      "apiKey": "\${DEKADANS_API_KEY}",
      "maxOutputTokens": 16384
    },
    {
      "model": "claude-sonnet-4",
      "displayName": "Dekadans Claude Sonnet",
      "provider": "anthropic",
      "baseUrl": "${ANTHROPIC_COMPATIBLE_BASE_URL}",
      "apiKey": "\${DEKADANS_API_KEY}",
      "maxOutputTokens": 8192
    }
  ]
}`,
    verifyCommands: [
      "droid --version",
      "export DEKADANS_API_KEY=\"<YOUR_DEKADANS_API_KEY>\"",
      "droid",
      "/model"
    ],
    checklist: [
      "Store custom models in ~/.factory/settings.json or a local override.",
      "Use provider openai with the /v1 URL for OpenAI-compatible models.",
      "Use provider anthropic with the root URL for Messages-compatible models.",
      "Select the custom model from /model after starting Droid."
    ],
    troubleshooting: [
      "If custom models do not appear, run /diagnostics and check JSON syntax.",
      "If a key is missing, confirm the DEKADANS_API_KEY environment variable is available to Droid.",
      "If a request times out, lower maxOutputTokens or retry with a different model."
    ]
  }
];

export function getCompatibilityLabel(mode: CliCompatibilityMode): string {
  if (mode === "openai-compatible") return "OpenAI-compatible";
  if (mode === "anthropic-compatible") return "Anthropic-compatible";
  return "OpenAI + Anthropic-compatible";
}
