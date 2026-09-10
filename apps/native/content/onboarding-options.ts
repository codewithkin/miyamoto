/**
 * The choices offered during onboarding.
 *
 * Kept here rather than fetched, because the quiz runs before sign-in and
 * must work with no session and no network. These slugs are the contract
 * with the seeded `wound` and `master` tables — the draft stores slugs, and
 * the server resolves them to rows when the account is created.
 *
 * Only active Masters appear here. Mandela is withdrawn (D-006); the server
 * would refuse his slug, and a Master the app cannot deliver has no place
 * on a screen that promises who you will meet.
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
  { slug: "betrayal", label: "Betrayal", masters: ["seneca", "sun-tzu"] },
  { slug: "anxiety", label: "Anxiety", masters: ["seneca", "curie"] },
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
    unlockDay: 7,
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
    slug: "sun-tzu",
    name: "Sun Tzu",
    title: "The Tactician",
    domains: "Business · negotiation",
    manner: "Terse, positional. Answers with the ground, not the feeling.",
    unlockDay: null,
    proOnly: true,
  },
];

const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight"];

/** "four". For copy that names how many Masters there are. */
export function inWords(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/**
 * Copy derived from MASTERS rather than typed beside it.
 *
 * Withdrawing Mandela (D-006) left "five Masters" on four screens and "Day 7,
 * 14 and 21" on two, where Day 14 had been his unlock. Both were true when
 * written and false the moment the list changed, which is the whole case for
 * deriving them.
 */
export const MASTER_COUNT = inWords(MASTERS.length);
export const MASTER_COUNT_TITLE = MASTER_COUNT.charAt(0).toUpperCase() + MASTER_COUNT.slice(1);

/** "Day 7 and 21" — the waits Pro skips. */
export const UNLOCK_WAITS = (() => {
  const days = MASTERS.flatMap((m) => (m.unlockDay ? [m.unlockDay] : [])).sort((a, b) => a - b);
  if (days.length <= 1) return days.length ? `Day ${days[0]}` : "";
  return `Day ${days.slice(0, -1).join(", ")} and ${days[days.length - 1]}`;
})();

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
