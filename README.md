# FlowPet (working title)

FlowPet is an original, local-first AI desktop focus companion for Windows. It automatically observes foreground application context, classifies work as **Focus**, **Neutral**, or **Drift**, helps the user recover without shame or surveillance, and turns successful recoveries into lightweight quests and progress signals.

> **Naming note:** FlowPet is a working codename. The project should be renamed before a public release because the name is already used elsewhere.

## Product principles

- **Local first:** activity capture and history live on the user's machine.
- **No screen recording:** the MVP captures foreground process and optional window title only.
- **Context over blocklists:** the same app can be focus or drift depending on intent.
- **Hybrid classification:** deterministic rules first; an LLM is used only when context is ambiguous.
- **User correction wins:** "Not a drift" corrections are stored and used to reduce repeated mistakes.
- **Recovery over punishment:** the product measures how quickly and gently the user returns, not just time spent drifting.
- **Model choice:** Ollama is first-class; any OpenAI-compatible endpoint can be configured as BYO.
- **Windows first:** native foreground-window tracking, tray behavior, transparent always-on-top companion, and NSIS packaging.

## MVP features

- Explicit first-run privacy choice before capture starts
- Windows foreground app + optional window-title capture every 5 seconds
- Correct wrapping Windows idle-time arithmetic for long-running machines
- Local SQLite activity segments, intents, nudges, recoveries, and correction memory
- Focus / Neutral / Drift rules with current-intent overlap
- Ollama classifier for ambiguous contexts
- Generic OpenAI-compatible BYO classifier with API key stored in the OS credential vault
- Provider failure backoff so an unavailable model endpoint is not hammered continuously
- Prompt-injection hardening: app/window text is treated as untrusted data
- Selectable desktop companions: **otter, fennec fox, raccoon, red panda, penguin, and capybara**
- Independent nudge personalities: **Gentle, Playful, Quiet, Coach, and Chaotic**
- User-defined companion name
- Adaptive nudge timing based on recent recovery behavior
- Explicit 10-minute intentional-break state
- "Not a drift" feedback with exact-context correction memory
- Recovery detection that tolerates short neutral bridges
- Daily focus/recovery quests and companion celebration states
- Dashboard with current intent, timeline, focus/drift totals, recovery metrics, quests, provider controls, and companion settings
- Tray controls and a transparent always-on-top companion window
- GitHub Actions CI plus a Windows NSIS installer workflow

## Companion system

The desktop pet is a presentation layer over a shared semantic state machine. **The classifier never branches on the selected animal.** Users can change species and personality without changing activity labels or history.

Built-in semantic states are:

- `idle`
- `focused`
- `deep_focus`
- `neutral`
- `drifting`
- `nudging`
- `recovering`
- `break`
- `celebrating`
- `sleeping`

The MVP ships lightweight original CSS-rendered animals so the system is usable without borrowed or generated artwork. `src/lib/mascots.ts` is the catalog/state boundary and `src/components/Mascot.tsx` is the renderer, so polished original sprite, Rive, or Lottie packs can replace the current renderer later without rewriting tracking, classification, recovery, or nudge logic.

See [`docs/mascot-system.md`](docs/mascot-system.md).

## Stack

- **Desktop shell:** Tauri 2
- **Native core:** Rust
- **UI:** React + TypeScript + Vite
- **Storage:** SQLite via `rusqlite`
- **Windows capture:** native Win32 APIs
- **Local AI:** Ollama HTTP API
- **BYO AI:** OpenAI-compatible `/chat/completions`
- **Secrets:** OS credential store through `keyring`

## Development prerequisites (Windows)

1. Install Node.js 20+.
2. Install Rust using `rustup` with the stable MSVC toolchain.
3. Install Microsoft C++ Build Tools / Visual Studio Build Tools with **Desktop development with C++**.
4. Ensure Microsoft Edge WebView2 Runtime is present. Windows 10/11 normally already includes it.
5. Optional: install Ollama and pull a compact instruction model.

Then:

```powershell
npm install
npm run desktop:dev
```

Run the test suites with:

```powershell
npm test
cargo test --manifest-path src-tauri/Cargo.toml
```

For a Windows installer:

```powershell
npm run desktop:build
```

The Tauri configuration targets an NSIS setup executable.

## Ollama setup

The default local endpoint is `http://127.0.0.1:11434`. In Settings choose **Ollama**, enter a model installed on your machine, and use **Test provider**.

Rules handle clear cases first. Only ambiguous foreground contexts are sent to the selected model route.

## BYO model setup

Choose **OpenAI-compatible** in Settings and provide:

- base URL, for example `https://provider.example/v1`
- model name
- API key when required

The API key is written to the OS credential vault and is not stored in SQLite. Remote providers receive compact current intent/app/window context only when that provider is explicitly selected.

## Privacy presets

- `app_only`: process name only
- `context_redacted`: process + locally sanitized window title — recommended
- `context`: process + full foreground window title

Redaction currently strips control characters, URL query data, email-like tokens, and obvious local Windows paths. FlowPet does **not** capture screenshots, keystrokes, clipboard contents, microphone input, or document bodies.

## Architecture

See:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/product-decisions.md`](docs/product-decisions.md)
- [`docs/mascot-system.md`](docs/mascot-system.md)
- [`docs/research-notes.md`](docs/research-notes.md)

## Development status

This is an implementation-grade MVP, not yet a signed public release. CI is the authoritative build check for the current feature branch because the source-generation environment used for the initial implementation does not contain a Rust toolchain or installable npm dependency cache.

Before a public beta, the important remaining hardening work is installer signing, per-app capture exclusions, broader Windows testing, crash reporting that is opt-in/disabled by default, accessibility review, polished original companion art, and a beta feedback loop for classification and nudge quality.
