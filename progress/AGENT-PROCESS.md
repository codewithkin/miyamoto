# Agent process

The operating system for this repository, in short. The owner's full
template is the canonical version; this is the working summary plus what is
specific to Miyamoto.

## The one idea

**The repository is the memory. Writing to it is part of the work, not the
wrap-up.** Every session starts cold and ends forgotten. What survives is
what was written down.

## The loop

1. **Orient.** `progress/00-START-HERE.md`, then the named plan file, then
   the `systems/` sections it points at, then `git log --oneline | head -20`.
2. **Try the toolchain.** Routinely skipped, routinely decisive. Finding out
   in minute five that something cannot run changes the plan; finding out at
   the end wastes the session.
3. **Budget out loud.** Say what fits and in what order. Order by what is
   most valuable if you stop here, not by plan order.
4. **Build.** One todo at a time, against the design file and the Done-when.
5. **Verify, capably.** If the real runner cannot run, execute the logic
   another way rather than declaring it untested.
6. **Audit the screens against their designs.** A separate, deliberate step.
   Do not skip it because you were careful.
7. **Record divergences in the plan file**, before the changelog.
8. **Write the handoff.** Changelog first, then rewrite START-HERE.

## Local facts, learned the hard way

| Thing | State |
|---|---|
| `git` | Works |
| File deletion | Works |
| `tsc` | Works everywhere. Use it early, not at the end. |
| Test runner | None configured. There are no tests yet. |
| Docker | **Not installed.** Dockerfiles are static-checked only. |
| Emulator | **Cannot run** — the owner's machine lacks the RAM. |
| Device | Owner runs EAS development builds on hardware. |
| PowerShell 5.1 | **No `&&`.** Use `;` or separate commands. |
| Heredocs | Break on apostrophes in prose. Use the file tool. |
| Prisma reset | Requires fresh per-command consent, even when authorised. |

## Rules with teeth

- **One todo, one commit.** Where a change genuinely cannot be split — a
  Prisma file whose models are mutually referential, a generated lockfile —
  say so in the message rather than pretending it was scoped.
- **Never `git add -A`.** It has produced an oversized commit here already.
  Stage explicit paths.
- **Announce destructive actions in the response that performs them** (D-028),
  not only in a commit message.
- **Leave a Done-when unticked if you cannot honestly verify it,** and say
  why. Half the Done-whens in `plans/05` say "on a device" and nothing here
  has ever run on one.
- **A stub with a TODO is worse than an absence.** The next agent has to work
  out whether it is real.

## The check that catches what the others miss

The moment a value is defined in one file and consumed in another that
cannot import it — a token in TypeScript and a variable in CSS, a constant in
code and a number in a config — **write the check that spans the gap.**
Otherwise both sides agree with each other while disagreeing with reality and
nothing complains.

Then **make it fail once, deliberately.** A check with a subtly broken
pattern passes forever because it matches nothing.

This project has already shipped three instances of the underlying shape: a
font variable set where the tokens could not see it, a dev server broken
while the production build was green, and pages with no titles on the two
URLs a store reviewer opens. All three were found by looking at the page.
