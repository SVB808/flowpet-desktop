# Research notes: inspiration without cloning

Research date: 2026-08-25.

## What we learned from Drifty's public product surface

Drifty's public website frames focus tracking around four useful ideas: automatic app/site/session capture without manual timers; context-aware Focus/Neutral/Drift classification; user choice over local, cloud, or BYO model routes; and a recovery companion that appears after confirmed drift. Its public copy also emphasizes that it does not save screenshots.

Sources consulted:

- https://drifty.so/
- https://drifty.so/blog/screen-time-alternative-for-mac/

We did **not** inspect or reuse Drifty source code, downloadable application files, design assets, CSS, component structure, brand elements, or proprietary copy.

## What FlowPet deliberately changes

FlowPet is designed independently around a different product thesis:

- Windows-first capture and NSIS distribution.
- Recovery time is a primary metric, not merely an intervention action.
- A deterministic rules layer handles obvious contexts before any LLM is called.
- Model ambiguity falls back to Neutral; LLM output never directly decides whether to close or manipulate another app.
- A persistent original orbital creature, Pip, reflects state and carries bounded nudges.
- Quests reward focus arcs and recovery skill rather than streak pressure.
- First-run capture consent is mandatory; tracking starts paused.
- An intentional-break action creates a temporary neutral classification state and suppresses nudges.
- User “Not a drift” corrections become local exact-context memory.
- No screenshot, keystroke, clipboard, microphone, or document-body capture exists in the MVP.

## Model-provider research

Ollama supports structured output using a JSON schema in the `format` field of `/api/chat`, which maps cleanly to a strict classifier response. FlowPet uses temperature 0 and validates the returned JSON before accepting a classification.

Sources:

- https://docs.ollama.com/capabilities/structured-outputs
- https://ollama.com/blog/structured-outputs

For non-Ollama providers, the MVP accepts a user-configured OpenAI-compatible base URL, model name, and optional API key. The key is stored through the operating system credential store rather than SQLite.

## Desktop packaging research

Tauri 2 officially supports Windows installers through NSIS setup executables or WiX/MSI. The MVP targets NSIS and leaves its default current-user install behavior, which avoids requiring administrator privileges. WebView2's downloaded bootstrapper mode is configured for machines that need the runtime.

Source:

- https://v2.tauri.app/distribute/windows-installer/

## Working-name collision

“FlowPet” should not ship as the public brand. As of the research date, `flowpet.app` is already used by a veterinary software product, and a July 2026 TRAE community submission also uses “FlowPet” for an on-demand desktop assistant concept.

Sources:

- https://flowpet.app/
- https://forum.trae.cn/t/topic/68906

A naming pass should happen before signing installers, buying a domain, publishing stores/listings, or creating public social accounts.
