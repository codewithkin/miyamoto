# 16 — The keyboard never crowds the screen

**Status: built (session 8).** Not yet seen on a device. The rule is D-058.

The owner's report (session 8): with the keyboard open, the chat screen is
mostly keyboard, and it should behave the way WhatsApp's does. The
composer sits directly on the keyboard, the conversation shrinks to the
space left and keeps the latest message in view, and nothing else
competes for the gap.

Why it happens: the chat wraps its messages in React Native's
`KeyboardAvoidingView` with `behavior` set only for iOS, so on Android it
does nothing. Expo SDK 57 draws edge-to-edge, and with
`react-native-keyboard-controller`'s `KeyboardProvider` mounted (it is, in
`app/_layout.tsx`), Android doesn't resize the window for the keyboard
either. The keyboard lands on top of whatever's there. The library's own
components are built for exactly this, and they're already installed
(1.21.9).

## K1 — The chat, like a messaging app

- [x] `2fe0fc8`
- **Commit:** `fix(native): keep the chat's composer on the keyboard and the latest message in view`
- **Touches:** `app/(app)/chat.tsx`
- **Done when:** the chat uses keyboard-controller's `KeyboardAvoidingView`
  (`behavior="padding"`, `automaticOffset`, which measures its real
  position on screen, so the header and tab bar are accounted for without
  hand-set offsets). The composer rides on the keyboard, the conversation
  shrinks, and if the person was at the latest message it stays in view as
  the keyboard opens. The free-questions line hides while typing, as
  messaging apps keep that space clear.

## K2 — No tab bar while typing

- [x] `98d3aaa`
- **Commit:** `fix(native): hide the tab bar while the keyboard is open`
- **Touches:** `app/(app)/_layout.tsx`
- **Done when:** `tabBarHideOnKeyboard`. If Android ever resizes the window,
  the tab bar would otherwise ride up on the keyboard and take 64 points
  from the conversation.

## K3 — Every scrolling screen keeps the focused field in view

- [x] `601a116`
- **Commit:** `fix(native): scroll the focused field above the keyboard on every scrolling screen`
- **Touches:** `components/ui.tsx` (`Screen scroll`)
- **Done when:** `<Screen scroll>` uses keyboard-controller's
  `KeyboardAwareScrollView`, so the first question's own-words field and
  its button, the delete-account email field, and the library search all
  scroll into view above the keyboard.

## K4 — Sheets rise with the keyboard

- [x] `8d61afb`
- **Commit:** `fix(native): lift sheets above the keyboard`
- **Touches:** `components/sheet.tsx`
- **Done when:** a sheet with a field (email sign-in) sits on the keyboard
  instead of under it. The Modal is drawn edge-to-edge explicitly, so it
  behaves the same on every phone, with the bottom safe area padded.

## K5 — Docs

- [x] this commit
- **Commit:** `docs: record how the app handles the keyboard`
- **Touches:** `systems/09-decisions.md` (D-058), `progress/00-START-HERE.md`
