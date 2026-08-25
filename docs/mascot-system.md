# Companion / mascot system

FlowPet treats the desktop companion as a replaceable presentation layer, not as productivity logic.

## Built-in animals

- **Otter** — playful and steady; pebble motif
- **Fennec fox** — alert and curious; tiny-notebook motif
- **Raccoon** — mischievous but loyal; shiny-token motif
- **Red panda** — cozy and determined; leaf-bookmark motif
- **Penguin** — calm and persistent; checklist motif
- **Capybara** — unbothered and kind; grass-sprig motif

Users can rename their companion. Species selection is persisted locally in application settings.

## Semantic states

The renderer consumes these states:

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

A current focus segment becomes `deep_focus` after 25 minutes. Intentional breaks override classifier labels. Paused tracking becomes `sleeping`. New recovery events briefly become `recovering`, and newly completed quests briefly become `celebrating`.

## Personality

Personality is separate from species:

- Gentle
- Playful
- Quiet
- Coach
- Chaotic

The Rust nudge policy still decides **whether and when** a nudge is justified. Personality changes deterministic wording only after the nudge policy has fired. Personalities must remain supportive and non-shaming.

## Rendering boundary

`src/lib/mascots.ts` is the companion catalog/state layer and `src/components/Mascot.tsx` is the current renderer. The MVP renderer uses original CSS shapes and animations, so there is no external art dependency.

A future sprite, Rive, or Lottie renderer can implement the same semantic states without changing tracking, recovery, settings, quests, or classification. New animals therefore become mostly an art/animation addition rather than a focus-engine rewrite.

## Product rule

Changing a companion must never rewrite history, reclassify activity, change confidence scores, or affect model prompts. The only behavior outside rendering that a companion preference may influence is the **tone** of an already-authorized nudge.
