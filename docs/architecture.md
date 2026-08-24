# Architecture

## 1. Runtime shape

FlowPet is one Tauri process with two WebView windows:

- `main`: dashboard/settings/history
- `pet`: transparent, frameless, always-on-top companion

The Rust core owns capture, persistence, classification orchestration, recovery detection, and nudge policy. React is a presentation layer and invokes a narrow command API.

```text
Windows foreground APIs
        |
        v
 ActivityTracker -----> SQLite <----- Dashboard queries
        |                   ^
        v                   |
 Segmenter ----------> ClassificationEngine
                              |        |
                          Rules     ModelProvider
                                      |     |
                                   Ollama  OpenAI-compatible
        |
        v
 RecoveryEngine ---> NudgePolicy ---> Tauri events ---> Pet window
        |
        v
 QuestEngine
```

## 2. Capture pipeline

Every five seconds, the Windows capture adapter reads:

- foreground HWND
- process ID / executable name
- window title
- Windows idle duration

Titles are either omitted, locally redacted, or retained according to the capture preset chosen during first-run consent. Samples are folded into segments when process + normalized context remain stable. A future browser enrichment module can add the active origin/URL, but it must be opt-in and isolated behind a trait.

## 3. Classification

Classification is deliberately hybrid.

### Stage A — deterministic rules

Rules handle high-confidence cases cheaply and offline:

- IDE/terminal with an active work intent -> likely focus
- locked screen / idle -> neutral
- obvious game/social contexts with no intent overlap -> likely drift
- ambiguous browser/docs/chat contexts -> unresolved

### Stage B — model route

Only unresolved or low-confidence segments are sent to a configured model provider. The prompt includes:

- active intent
- current app and redacted title
- duration
- recent segment summaries
- relevant local corrections

The model must return structured JSON with label, confidence, category, and a one-sentence reason. Low-confidence model results fall back to Neutral and never trigger a nudge.

## 4. Provider boundary

`ModelProvider` is a Rust trait-like enum boundary with two implementations in the MVP:

- Ollama native `/api/chat` with a JSON schema
- generic OpenAI-compatible `/v1/chat/completions`

Provider configuration is persisted without secrets. BYO keys live in the OS credential store.

## 5. Recovery as a first-class event

A drift is not considered the end state. FlowPet records a recovery when the user returns from a confirmed drift segment to stable focus within a bounded recovery window. Short neutral bridge segments (for example opening FlowPet to acknowledge a nudge) do not erase the pending recovery; an explicit intentional break does. Recovery events contain:

- drift start
- recovery time
- seconds to recover
- whether a nudge was involved

Nudge actions and user corrections are stored separately and can be joined to the recovery through the nudge/segment identifiers.

This makes "time to get back" a measurable skill and powers adaptive quests.

## 6. Nudge policy

Nudges are generated from policy, not directly from model text.

The policy considers:

- drift duration
- classification confidence
- nudge cooldown
- recent recovery median
- global pause state
- an explicit 10-minute intentional-break state

The model may rewrite a nudge in later versions, but the decision to nudge remains deterministic and bounded.

## 7. Data model

Core tables:

- `activity_samples`
- `activity_segments`
- `intents`
- `nudges`
- `recoveries`
- `quests`
- `corrections`
- `settings`

SQLite is stored under the Tauri app-data directory.

## 8. Failure behavior

- tracker failure: surface degraded status; never crash the UI
- model unavailable: deterministic rules continue; provider retries use bounded exponential backoff
- invalid model JSON: treat as unresolved/Neutral
- DB write failure: log locally and retry on the next sample interval
- pet window failure: dashboard and tray continue

## 9. Windows-first packaging

The production target is an NSIS installer built on `windows-latest`. A later release pipeline should add Authenticode signing and Tauri updater metadata.
