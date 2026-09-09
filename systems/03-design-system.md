# Design system

**Read the screen's file in `designs/extracted/` before building it.** Not
the tokens. Tokens are downstream and allowed to be incomplete; the designs
are not. Run `python designs/extract.py` if that folder is empty.

## Where things live

| Layer | Path |
|---|---|
| Tokens (native) | `apps/native/theme/tokens.ts` |
| Motion tokens | `apps/native/theme/motion.ts` |
| Tokens (web) | `apps/web/src/styles/tokens.css` |
| Primitives | `apps/native/components/ui.tsx` |
| Blade marks | `apps/native/components/blade.tsx` |
| Entry/exit animation | `apps/native/components/motion.tsx` |
| Press interaction | `apps/native/components/touchable.tsx` |

## The colour grammar

Not decoration — each colour means one thing and is not used for anything
else.

| Colour | Means | Never |
|---|---|---|
| Indigo | Progress, the Path, the one forward action | A warning |
| Green | Confirming a trial | Anything else |
| Red | Backing out, destructive, live | A highlight |
| Gold | Earned, Pro, rare | Ordinary emphasis |
| Ink | Every surface | — |

If a screen needs a fifth meaning, it needs a decision, not a colour.

## Blade marks

The app has **no** checkboxes, dots, spinners or progress rings. Every status
is a cut with the 2px `radius.blade` — the most-used radius in the design and
the reason the UI reads as edged rather than soft.

State is carried by fill, not shape, so a rail of them reads as one edge.

## Type

| Family | Job |
|---|---|
| Zen Old Mincho | A Master's voice, display headings |
| DM Sans | All UI copy |
| Barlow Condensed | Eyebrow labels, numerals |
| Caveat | The user's own Bushido Code, and nothing else |

A Master's words are Mincho and get **no bubble**. The user's are DM Sans in
an indigo one. That asymmetry does most of the work of making chat read as a
letter rather than a messaging app.

Fonts are embedded via the `expo-font` config plugin, not loaded at runtime,
so type never flashes unstyled on a cold start. That is part of why Expo Go
does not work (D-022).

## Motion

Two layers, and they answer different questions.

**Entry** says the screen arrived. 18 presets over Reanimated's layout
animations; `Stagger` hands each child its own delay. **Nothing on an
onboarding screen arrives at the same time as anything else** — the eye is
walked down the screen.

**Interaction** says the screen heard you. `Touchable` with haptics matched
to consequence: confirming a trial is the success pattern, a refused Master
is the warning one, chips are selection ticks. The hand learns the difference
before the eye does.

Only the two primitives import `Pressable`. Everything else uses `Touchable`.
