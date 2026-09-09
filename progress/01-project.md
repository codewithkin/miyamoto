# The project

Rarely changes. If this file and the app disagree, the app is wrong.

## What it is

**Miyamoto — Meet the Masters.** A mobile app where you bring a real problem
from your own life and a historical figure answers it in their own voice.

You describe what is weighing on you — passed over for a promotion, scared of
a conversation, cannot stop procrastinating — and one of the Masters writes
back. They do not comfort you. They tell you the moment in their own life
that matched yours, extract the lesson from it, then hand you one concrete
thing to do that day.

## The three pillars

**The chat is the core.** A typed conversation, not a voice. Each Master has
a distinct written tone, and you can switch who is answering without losing
the thread — the new Master reads everything that came before.

**The Adversity Library is the browse path.** Named wounds sorted by
category, each a 30-second story → lesson → action, with a button that
carries it into chat.

**The Bushido Path is the habit engine.** 30 days in four acts — Face it,
Control it, Endure it, Become it — one trial a day, a streak and a Bushido
score, Masters unlocking as you progress. On Day 29 you write your own
personal code: the rules you now live by.

## The Masters

| Master | Domain | Unlocks |
|---|---|---|
| Musashi | Career, fear, rivals | Day 1 |
| Seneca | Anxiety, loss, control | Day 7 |
| ~~Mandela~~ | ~~Betrayal, conflict~~ | **Withdrawn (D-006)** |
| Marie Curie | Focus, grind | Day 21 |
| Sun Tzu | Business, negotiation | Pro |

Mandela was withdrawn from the app over personality rights — he died in 2013
and his estate actively enforces. His corpus is retained behind
`Master.active = false` in case that reverses.

## Money

Free: three questions a day. Pro removes the counter and unlocks all Masters
and stories immediately — $9.99/month or $149 once. Billing is RevenueCat
over native IAP; a rewarded ad buys one extra question a day.

## The design language

Warm ink-dark. Zen Old Mincho for a Master's voice, DM Sans for UI, Barlow
Condensed for labels, Caveat for the user's own Code. Indigo for progress,
green for confirming a trial, red for backing out, gold for what is earned.

A custom **blade mark** system stands in for every status indicator — no
checkboxes, no spinners, no progress rings anywhere in the app.

## The overriding test

> A man opens this at 5am, alone, after the worst week of his year, and he
> has already decided nobody can help him. Does what you built give him one
> thing to do before breakfast — or does it flatter him?

Everything else is downstream of that sentence. If a change makes the app
warmer, softer or more encouraging, it is probably wrong.
