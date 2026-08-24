# Security notes

- Remote model API keys must never be written to SQLite or logs.
- The current implementation uses the operating system credential store via the Rust `keyring` crate.
- Tauri capabilities should stay minimal; do not grant shell or filesystem permissions without a concrete feature requiring them.
- Window titles can contain sensitive information. Keep redaction on by default and add per-app exclusion controls before public beta.
- Do not add screenshots, OCR, clipboard capture, or keyboard hooks to the automatic tracker.
- Any future browser extension should use least-privilege host permissions and transmit context only over a localhost authenticated channel.
