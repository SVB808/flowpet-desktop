# Product decisions

## Inspiration boundary

The public Drifty product demonstrates several useful product ideas: automatic foreground-context tracking, contextual Focus/Neutral/Drift classification, local/BYO model choice, timeline review, and drift recovery. FlowPet adopts the underlying problem framing while deliberately changing the product shape:

- Windows first rather than Mac first
- recovery metrics are central, not a secondary intervention feature
- quests are generated from recovery/focus patterns
- the pet is persistent and expressive, but nudges remain optional and bounded
- the visual language is an original soft-orbit dashboard with the original "Pip" creature
- classification uses deterministic rules before any LLM call to reduce cost and false positives
- generic OpenAI-compatible BYO support is a first-class provider abstraction

No Drifty source code, assets, branding, copy, or UI implementation is used.

## Why Tauri

Electron would speed some web-only iteration, but Tauri gives us a smaller desktop footprint and a clean Rust boundary for Windows APIs, SQLite, secrets, and future OS integrations.

## Why not block apps in v0.1

Incorrectly classifying a productive browser tab as drift is inevitable. A v0.1 product should never close a user's app or tab. The first release nudges and learns from corrections. Strong interventions can be explored only as explicit opt-in modes after false-positive rates are understood.

## Why titles but no screenshots

Window titles are enough to distinguish many contexts without the privacy and security cost of continuous screen capture. They can still contain sensitive text, so redaction and exclusions are mandatory hardening items.

## Working-name risk

"FlowPet" is not cleanly ownable as a public brand as of August 2026: unrelated FlowPet products exist, and a recent desktop-assistant concept also uses the name. Keep it as a repository codename only until naming research is complete.
