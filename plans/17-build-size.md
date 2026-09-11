# 17 — A smaller upload, a smaller app, and a production build that starts

**Status: built (session 8), except S5.** S5 waits on the owner's yes to install `fonttools`. The rule is D-059.

The owner's report (session 8): `eas build --profile production` compressed
96 MB of project and stalled uploading it. They asked for the archive and
the app to be smaller, including by removing unused dependencies.

What's in the 96 MB: git holds about 6 MB. EAS isn't archiving from git
here. It copies the folder, applying only the root `.gitignore`. Folders
ignored only by a nested `.gitignore` go up with every build:
`apps/web/.next` alone is 167 MB of the website's build cache, and
`apps/native/android` is 16 MB.

Found on the way, and worse: the production build would crash on launch.
`EXPO_PUBLIC_SERVER_URL` is required by `@miyamoto/env/native`, `.env`
files are never uploaded, and EAS has no variables for "production". So
the environment check throws before the first screen.

## S1 — `.easignore`

- [x] `587c977`
- **Commit:** `build: upload only what the Android build needs`
- **Touches:** `.easignore` (new, repo root)
- **Done when:** the root rules plus the nested ones, and the website's and
  server's build output, the native `android`/`ios` folders (EAS
  prebuilds them), design sources and docs. Every workspace package's
  source and `package.json` stays, since pnpm installs the workspace.
  Checked by listing what the rules keep.

## S2 — The production build knows its server

- [x] `860cc05`
- **Commit:** `build: give preview and production builds the server URL`
- **Touches:** `apps/native/eas.json`
- **Done when:** `EXPO_PUBLIC_SERVER_URL` is set in the preview and
  production profiles. It's a public URL that ships in the binary, not a
  secret.

## S3 — Remove what the app doesn't use

- [x] `21a698b`
- **Commit:** `build(native): remove unused dependencies`
- **Touches:** `apps/native/package.json`, `pnpm-lock.yaml`, `app.json`,
  `app/_layout.tsx`, `global.css`
- **Done when:** gone, with anything left pointing at them:
  - Native modules: `react-native-purchases-ui` (unused since plan 15, and
    the heaviest), `expo-audio` (voice notes are "Soon"; it also brought
    the microphone and foreground-service permissions Play asks to
    justify), `expo-network`, `expo-insights` (reported to Expo, undisclosed).
  - `heroui-native` (only its provider was mounted) with its peers
    `@gorhom/bottom-sheet`, `tailwind-merge` and `tailwind-variants`.
  - `@tanstack/react-form` and `dotenv`, unused.
  tsc passes and the Android bundle builds.

## S4 — Shrink the release build

- [x] `04f64f2`
- **Commit:** `build(native): minify and shrink resources in release builds`
- **Touches:** `apps/native/app.json` (`expo-build-properties`)
- **Done when:** `enableMinifyInReleaseBuilds` (R8) and
  `enableShrinkResourcesInReleaseBuilds`. Development builds are
  unaffected.

## S5 — Fonts cut to what the app writes

- [ ] `pending-S5` (needs `fonttools`; the owner's yes to install it)
- **Commit:** `build(native): subset Zen Old Mincho to Latin`
- **Done when:** the two Zen Old Mincho files (10.5 MB, nearly all Japanese
  glyphs, and no Japanese anywhere in the app or the corpus) are subset to
  Latin, Latin-1, Latin Extended-A and the punctuation and symbols the
  app uses, and `app.json` embeds the subsets.

## S6 — Docs

- [x] this commit
- **Commit:** `docs: record what the build uploads and ships`
- **Touches:** `systems/12-deploys.md`, `systems/09-decisions.md`,
  `progress/00-START-HERE.md`
