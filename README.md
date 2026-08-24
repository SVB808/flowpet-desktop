# FlowPet (working title)

FlowPet is an original, local-first AI desktop focus companion for Windows. It automatically observes foreground application context, classifies work as **Focus**, **Neutral**, or **Drift**, helps the user recover without shame or surveillance, and turns successful recoveries into lightweight quests and progress signals.

> **Naming note:** FlowPet is a working codename. A public-name search in August 2026 found multiple unrelated products and another desktop-assistant concept using the same name, so the project should be renamed before a public release.

## Product principles

- **Local first:** activity capture and history live on the user's machine.
- **No screen recording:** the MVP captures foreground process and optional window title only.
- **Context over blocklists:** the same app can be focus or drift depending on intent.
- **Hybrid classification:** deterministic rules first; an LLM is used only when context is ambiguous.
- **User correction wins:** "Not a drift" corrections are stored and used to reduce repeated mistakes.
- **Recovery over punishment:** the product measures how quickly and gently the user returns, not just time spent drifting.
- **Model choice:** Ollama is first-class; any OpenAI-compatible endpoint can be configured as BYO.
- **Windows first:** native foreground-window tracking, tray behavior, transparent always-on-top pet, and NSIS packaging.

## MVP features in this repository

- First-run privacy consent before any activity capture begins
- Windows foreground app + window-title activity capture every 5 seconds
- Local SQLite event store and aggregated activity segments
- Focus / Neutral / Drift rules with intent-aware keyword overlap
- Ollama structured-output classifier
- Generic OpenAI-compatible BYO classifier with API key stored in the OS keychain
- Desktop pet window with original "Pip" mascot states
- Adaptive nudge policy with cooldowns and escalating copy
- Explicit 10-minute intentional-break state that suppresses nudges without rewriting history
- Local correction memory for exact contexts marked “Not a drift”
- Recovery event tracking and median time-to-recover
- Daily quests generated from recent focus/recovery behavior
- Dashboard: live state, intent, timeline, focus/drift totals, recovery metrics, quests
- Tray menu, pause tracking, show/hide dashboard, quit
- GitHub Actions CI plus a Windows NSIS installer build workflow

## Stack

- **Desktop shell:** Tauri 2
- **Native core:** Rust
- **UI:** React + TypeScript + Vite
- **Storage:** SQLite via `rusqlite`
- **Local AI:** Ollama HTTP API
- **BYO AI:** OpenAI-compatible `/v1/chat/completions`
- **Secrets:** OS credential store through `keyring`

## Development prerequisites (Windows)

1. Install Node.js 20+.
2. Install Rust using `rustup` with the stable MSVC toolchain.
3. Install Microsoft C++ Build Tools / Visual Studio Build Tools with Desktop development with C++.
4. Ensure Microsoft Edge WebView2 Runtime is present (Windows 10/11 normally already has it).
5. Optional: install Ollama and pull a compact instruction model.

Then:

```powershell
npm install
npm run desktop:dev
```

For a production installer:

```powershell
npm run desktop:build
```

The Tauri configuration targets an NSIS setup executable for Windows.

## Ollama setup

The default local endpoint is `http://127.0.0.1:11434`. In Settings choose **Ollama**, enter the model name you have pulled, and use **Test connection**.

FlowPet sends only a compact classification payload: current foreground app/title, current stated intent, and a short summary of recent segments. It does not send screenshots or keystrokes.

## BYO model setup

Choose **OpenAI-compatible** in Settings and provide:

- base URL, e.g. `https://openrouter.ai/api/v1`
- model name
- API key

The API key is written to the OS credential store and is not stored in SQLite.

## Privacy presets

The capture layer supports three modes conceptually:

- `app_only`: process name only
- `context`: process + window title
- `context_redacted`: process + locally sanitized title

The first-run screen keeps tracking paused until the user explicitly chooses a mode and starts capture. `context_redacted` is the recommended preset. Per-app exclusions are part of the next hardening milestone.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) and [`docs/product-decisions.md`](docs/product-decisions.md).

## Status

This is an implementation-grade MVP, not yet a signed public release. It is intended to be run and hardened on Windows first. The next milestone is browser URL enrichment (opt-in), installer signing, crash telemetry that is disabled by default, and a beta feedback loop.
