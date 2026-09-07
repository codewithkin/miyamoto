/**
 * Authored answers for the four fixed onboarding problems.
 *
 * These are the reason the opening screens can promise "no account" without
 * contradicting the rule that a real question needs one. The four problems
 * are fixed, so their answers are written here rather than generated: no
 * model call, no quota spent, no anonymous identity created, and the aha
 * moment is identical for every visitor.
 *
 * Each answer is shaped the way a Master always answers — a moment from
 * their own life, the lesson pulled out of it, then one thing to do today.
 * `sourceNote` keeps the biographical claim traceable; nothing here is
 * invented about a real person.
 */

export type SampleAnswer = {
  problemSlug: string;
  masterSlug: string;
  masterName: string;
  /** Shown in the header under the name. */
  masterEra: string;
  /** The user's problem, echoed back in their own words. */
  echo: string;
  /** The Master's moment and lesson, in voice. */
  body: string;
  /** The charge. */
  action: string;
  sourceNote: string;
};

export const SAMPLE_ANSWERS: Record<string, SampleAnswer> = {
  "procrastinating": {
    problemSlug: "procrastinating",
    masterSlug: "curie",
    masterName: "Marie Curie",
    masterEra: "Physicist · 1867–1934",
    echo: "I keep putting off one thing.",
    body: "I stirred a vat of pitchblende for four years to isolate one tenth of a gram of radium. Not because I was patient — because I made the vat the only thing in the room.\n\nYou are not avoiding the task. You are avoiding the twenty minutes where it is the only thing in the room.",
    action:
      "Twenty minutes. Phone in another room. The thing you named, nothing else.",
    sourceNote:
      "Curie processed tonnes of pitchblende residue in a shed at the École de Physique et de Chimie, isolating radium chloride in 1902.",
  },

  "passed-over": {
    problemSlug: "passed-over",
    masterSlug: "musashi",
    masterName: "Musashi",
    masterEra: "Duelist · 1584–1645",
    echo: "I got passed over at work.",
    body: "The Yoshioka school refused me a fair duel. They named a boy as their head, so that beating him would shame me and losing to him would end me.\n\nI arrived early, took the boy first, and left through the rice fields before the school could form a line.\n\nA rigged contest is information, not a verdict. You have been told what ground you are standing on.",
    action:
      "Write the one thing that decision told you about your ground. One sentence. Then book the conversation.",
    sourceNote:
      "The Yoshioka duels, Kyoto, c. 1604, as recorded in the Nitenki and Musashi's own Go Rin No Sho.",
  },

  "betrayed": {
    problemSlug: "betrayed",
    masterSlug: "mandela",
    masterName: "Mandela",
    masterEra: "Statesman · 1918–2013",
    echo: "Someone I trusted lied.",
    body: "Men I had worked beside gave evidence against us. For years afterwards I shared a country with people who had done far worse than lie to me.\n\nI learned to separate two questions that feel like one: what this person is, and what I will now do. The first is theirs to answer. Only the second is yours.\n\nResentment is a thing you carry for someone who set it down long ago.",
    action:
      "Name what you will still do with this person — work, speak, or nothing. Decide it today, not when you feel calmer.",
    sourceNote:
      "Mandela's twenty-seven years of imprisonment from 1962, and the negotiated transition he led after 1990.",
  },

  "scared-conversation": {
    problemSlug: "scared-conversation",
    masterSlug: "seneca",
    masterName: "Seneca",
    masterEra: "Stoic · 4 BC–65 AD",
    echo: "I'm scared of a conversation.",
    body: "I wrote letters to a friend about fears I had rehearsed for years and never met. We suffer more often in imagination than in reality.\n\nYou have already had this conversation — perhaps forty times, always badly, always alone. The real one takes four minutes and has only one other person in it, not forty versions of him.",
    action:
      "Write the first two sentences you will actually say. Say them aloud once. Then send the message asking for the time.",
    sourceNote:
      "Seneca, Epistulae Morales ad Lucilium, Letter 13: 'We suffer more often in imagination than in reality.'",
  },
};

/** Fallback when the user typed their own problem — real answers need auth. */
export const TYPED_PROBLEM_MASTER = "musashi";
