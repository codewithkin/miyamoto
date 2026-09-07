/**
 * The choices offered during onboarding.
 *
 * Kept here rather than fetched, because the quiz runs before sign-in and
 * must work with no session and no network. These slugs are the contract
 * with the seeded `wound` and `master` tables — the draft stores slugs, and
 * the server resolves them to rows when the account is created.
 */

export type WoundOption = {
  slug: string;
  label: string;
  /** Masters whose corpus covers this wound, used for the nudge on 04. */
  masters: string[];
};

export const WOUNDS: WoundOption[] = [
  { slug: "fear-of-person", label: "Fear of a person", masters: ["musashi", "seneca"] },
  { slug: "procrastination", label: "Procrastination", masters: ["curie", "musashi"] },
  { slug: "career-stall", label: "Career stall", masters: ["musashi", "sun-tzu"] },
  { slug: "betrayal", label: "Betrayal", masters: ["mandela", "seneca"] },
  { slug: "anxiety", label: "Anxiety", masters: ["seneca", "mandela"] },
  { slug: "no-discipline", label: "No discipline", masters: ["curie", "musashi"] },
];

export type MasterOption = {
  slug: string;
  name: string;
  title: string;
  domains: string;
  manner: string;
  /** Day this Master unlocks on the Path. Null means available now. */
  unlockDay: number | null;
  proOnly: boolean;
};

export const MASTERS: MasterOption[] = [
  {
    slug: "musashi",
    name: "Musashi",
    title: "The Strategist",
    domains: "Blunt · fear, rivals, decisions",
    manner: "Writes in short cold lines. Never asks how you feel.",
    unlockDay: null,
    proOnly: false,
  },
  {
    slug: "seneca",
    name: "Seneca",
    title: "The Stoic",
    domains: "Anxiety, loss, control",
    manner: "Calm, reframing letters.",
    unlockDay: null,
    proOnly: false,
  },
  {
    slug: "curie",
    name: "Marie Curie",
    title: "The Method",
    domains: "Focus and grind",
    manner: "Precise, method-first notes.",
    unlockDay: 21,
    proOnly: false,
  },
  {
    slug: "mandela",
    name: "Mandela",
    title: "The Reconciler",
    domains: "Betrayal and conflict",
    manner: "Slow, dignified paragraphs.",
    unlockDay: 14,
    proOnly: false,
  },
  {
    slug: "sun-tzu",
    name: "Sun Tzu",
    title: "The Tactician",
    domains: "Business · negotiation",
    manner: "Terse, positional. Answers with the ground, not the feeling.",
    unlockDay: null,
    proOnly: true,
  },
];

export type PressureOption = {
  value: "GENTLE" | "FIRM" | "UNBREAKABLE";
  label: string;
  detail: string;
};

export const PRESSURES: PressureOption[] = [
  { value: "GENTLE", label: "Gentle", detail: "One small trial a day" },
  { value: "FIRM", label: "Firm", detail: "A real trial daily, cold showers included" },
  {
    value: "UNBREAKABLE",
    label: "Unbreakable",
    detail: "Two trials, no-complaint days, public stakes",
  },
];

export const REMINDER_TIMES = ["06:00", "07:30", "21:00"];
