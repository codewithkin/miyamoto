/**
 * Which model each Master runs on.
 *
 * This file used to hold a hand-written voice essay per Master. Voice now
 * lives on the `master` row — register, syntax, person, characteristicMove,
 * cadenceSample, neverDo — and is compiled into the system prompt by
 * ./template.ts at request time.
 *
 * What is left here is the one thing that genuinely is code: the model a
 * Master is served by. Kept per-slug rather than global so a Master whose
 * voice needs a stronger model can be moved without touching the others.
 */

export type MasterModelSpec = {
  slug: string;
  /** Routed through OpenRouter; swapping providers is a change to this id. */
  model: string;
};

const DEFAULT_MODEL = "openrouter/deepseek/deepseek-v4-pro";

export const MASTER_MODELS: MasterModelSpec[] = [
  { slug: "musashi", model: DEFAULT_MODEL },
  { slug: "seneca", model: DEFAULT_MODEL },
  { slug: "mandela", model: DEFAULT_MODEL },
  { slug: "curie", model: DEFAULT_MODEL },
  { slug: "sun-tzu", model: DEFAULT_MODEL },
];

export function modelFor(slug: string): string {
  return MASTER_MODELS.find((m) => m.slug === slug)?.model ?? DEFAULT_MODEL;
}
