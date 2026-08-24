# FlowPet privacy model

FlowPet is designed around local processing and data minimization.

## First-run consent

FlowPet starts with tracking paused. The user must choose a capture preset and explicitly start local tracking before any foreground activity samples are written.

## Captured after consent

- timestamp
- foreground executable name
- foreground window title after local redaction
- idle/active status derived from Windows' last-input timestamp

## Not captured

- screenshots or screen video
- clipboard contents
- keystrokes or typed text
- microphone audio
- files or file contents
- browser history outside the currently active context

## AI routing

- **Rules only:** no activity leaves the device.
- **Ollama:** activity context is sent only to the configured local Ollama endpoint.
- **BYO OpenAI-compatible endpoint:** only the compact classification prompt is sent to the configured endpoint.

The UI should always show which route is active. A future payload-preview screen should let users inspect exactly what would be sent before enabling a remote provider.

## Retention

Raw samples are intended to be short-lived. Aggregated segments are the durable history. The MVP includes a cleanup hook point; production should default raw sample retention to 7 days and make this configurable.

## Corrections

When a user marks a segment "Not a drift", FlowPet stores the correction locally so the same context can be handled more accurately later.
