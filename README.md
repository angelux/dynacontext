# DynaContext

**A CLI that generates structured, task-specific context from your codebase for AI coding agents and human readers.**

Most AI coding tools let agents explore your codebase autonomously burning tokens, missing context, and producing vague output. DynaContext inverts that. It invests effort *upfront* in constructing precise, scoped context so the downstream consumer whether a coding agent or a human operates from a clear, complete picture instead of exploring blind.

Describe a task in natural language. DynaContext surveys your codebase, gathers the relevant code, and assembles a self-contained context document either a detailed build specification your coding agent can execute without guessing, or an explanatory document that makes a complex part of your codebase legible.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Model Recommendations](#model-recommendations)
- [Configuration Reference](#configuration-reference)
- [Usage](#usage)
- [Output](#output)
- [License](#license)

---

## How It Works

DynaContext runs a four-phase pipeline. Each phase is powered by a dedicated LLM, and you stay in control throughout.

```
  INTAKE ──▶ RETRIEVAL ──▶ ASSEMBLY ──▶ REVIEW
```

**Intake** You describe what you need in natural language. The intake model assesses your request, asks clarifying questions if needed, and produces a structured task summary with targeted search patterns.

**Retrieval** An agentic process executes shell commands against your real codebase [ripgrep](https://github.com/BurntSushi/ripgrep), `find`, `git`, and more across four steps: pattern exploration, structural mapping, content capture, and gap analysis. No hallucinated file paths. Every piece of evidence comes from your actual repository.

**Assembly** A capable model receives the retrieval results and your task summary, then synthesizes everything into a self-contained context document. Depending on how you define your task, this is either a complete build specification (with file maps, architecture decisions, reference code, and acceptance criteria) or a free-form explanatory document designed for human understanding.

**Review** You review the assembled output directly in the terminal with full Markdown rendering. Revise it, request additional retrieval, or save. The output file is ready to hand to your coding agent or read yourself.

---

## Prerequisites

- **Node.js** >= 20.0.0
- **ripgrep** (`rg`) DynaContext uses ripgrep for fast codebase search during retrieval. Without it, the retrieval phase won't work.

  ```bash
  # macOS
  brew install ripgrep

  # Ubuntu / Debian
  sudo apt install ripgrep

  # Windows
  choco install ripgrep
  # or
  scoop install ripgrep
  ```

  See the [ripgrep installation guide](https://github.com/BurntSushi/ripgrep#installation) for other platforms.

- **API access** to at least one LLM provider (OpenAI-compatible or Anthropic-compatible endpoints)

---

## Installation

```bash
git clone https://github.com/angelux/dynacontext.git
cd dynacontext
nvm use
npm install
npm run build
npm link
```

The `dynacontext` command is now available globally.

---

## Getting Started

On first launch, DynaContext opens an interactive setup wizard that walks you through configuring three model slots one for each pipeline phase that needs an LLM:

- **Intake** the model that understands your task, asks clarifying questions, and produces the structured summary.
- **Agent** the tool-calling model that executes shell commands to survey your codebase during retrieval.
- **Assembly** the model that synthesizes all retrieval results into the final context document.

For each slot, the wizard asks for four things:

1. **Endpoint** the full API URL (e.g., `https://api.anthropic.com/v1/messages`)
2. **Model** the model identifier (e.g., `claude-sonnet-4.6`)
3. **API Key** either a literal key or the name of an environment variable (e.g., `ANTHROPIC_API_KEY`). DynaContext detects env var names automatically and resolves them at runtime.
4. **Format** `openai` or `anthropic`, depending on which API format your provider uses.

Once the wizard completes, your configuration is saved to `~/.dynacontext/config.json`. You can update it anytime from within DynaContext's settings menu.

---

## Model Recommendations

Not all slots need the same caliber of model. Each phase has a different workload profile, and picking the right model for each slot keeps costs down without sacrificing output quality.

### Intake

**Claude Sonnet 4.6** or **DeepSeek V3.2**. The intake phase handles conversation and structured summarization a strong mid-tier model performs well here.

### Retrieval (Agent)

**[Kimi K2.5](https://platform.moonshot.ai/)** is highly recommended. The retrieval agent makes many rapid tool calls as it surveys your codebase, which makes rate limits and per-call cost the primary concerns. Kimi K2.5 via [platform.moonshot.ai](https://platform.moonshot.ai/) has no rate limits and is very cost-efficient ideal for this workload.

### Assembly

**Use the most capable model you can afford.** This is where the quality of your context document is determined. The latest **Claude Opus** is the official recommendation.

---

## Configuration Reference

Configuration lives at `~/.dynacontext/config.json`. The setup wizard creates this file for you, but here's the full structure for reference:

```json
{
  "intake": {
    "endpoint": "https://api.anthropic.com/v1/messages",
    "model": "claude-sonnet-4.6",
    "apiKey": "ANTHROPIC_API_KEY",
    "format": "anthropic"
  },
  "assembly": {
    "endpoint": "https://api.anthropic.com/v1/messages",
    "model": "claude-opus-4.6",
    "apiKey": "ANTHROPIC_API_KEY",
    "format": "anthropic"
  },
  "agent": {
    "endpoint": "https://api.moonshot.ai/v1/chat/completions",
    "model": "kimi-k2.5",
    "apiKey": "MOONSHOT_API_KEY",
    "format": "anthropic"
  },
  "output": {
    "filenamePrefix": "DYNA",
    "dir": "."
  },
  "stepFiles": {
    "cleanup": true,
    "reviewBeforeAssembly": true
  }
}
```

**`output.filenamePrefix`** prefix for generated context files (default: `DYNA`).

**`output.dir`** directory where context files are saved, relative to your project root (default: `.`).

**`stepFiles.cleanup`** whether to automatically remove intermediate retrieval files after assembly (default: `true`).

**`stepFiles.reviewBeforeAssembly`** whether to pause after retrieval so you can review the raw step files before assembly begins (default: `true`).

---

## Usage

Navigate to your project directory and run:

```bash
dynacontext
```

DynaContext launches an interactive terminal interface. Describe your task in natural language, and the pipeline takes it from there.

```bash
# Check version
dynacontext --version
```

### Session Persistence

DynaContext automatically saves your session at key checkpoints. If the process is interrupted or you need to step away, the next time you run `dynacontext` in the same project directory, you'll be offered the option to resume where you left off.

Sessions are stored in a `.dynacontext/` directory within your project. DynaContext automatically adds session files to your global gitignore.

---

## Output

After review, context documents are saved to your project directory:

```
DYNA_01-your-task-name.md    # The context document
DYNA_01-stats.md             # Token usage report
```

The context document is self-contained designed to be handed directly to a coding agent as its sole input, or read by a human who needs to understand a part of the codebase. The stats file tracks token usage across all three pipeline phases.

---

## License

MIT © [Angel Ponce Espinosa](https://angelponce.com)