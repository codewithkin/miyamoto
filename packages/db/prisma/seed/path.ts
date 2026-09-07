/**
 * The Bushido Path — thirty authored days in four acts.
 *
 * Each day carries three trials, one per pressure. Gentle is a real thing
 * but a small one; Firm is the default the design recommends; Unbreakable
 * adds a public or compounding cost. Day 29 is where the user writes their
 * own code, so its trial is the writing itself.
 */

export type PathDaySeed = {
  day: number;
  act: "FACE_IT" | "CONTROL_IT" | "ENDURE_IT" | "BECOME_IT";
  title: string;
  brief: string;
  gentle: string;
  firm: string;
  unbreakable: string;
};

export const PATH_DAYS: PathDaySeed[] = [
  // ── Act I · Face it ────────────────────────────────────────────────
  {
    day: 1, act: "FACE_IT", title: "Name it",
    brief: "Nothing changes while the thing stays unnamed.",
    gentle: "Write the name of the person or thing you are avoiding. Once, on paper.",
    firm: "Name the person you're avoiding. Out loud, to yourself, before breakfast.",
    unbreakable: "Name it out loud before breakfast, then tell one other person what it is.",
  },
  {
    day: 2, act: "FACE_IT", title: "The first sentence",
    brief: "You have rehearsed the whole conversation. Write only its opening.",
    gentle: "Write the first sentence you would say if you had to start it today.",
    firm: "Write the first two sentences. Say them aloud once, standing up.",
    unbreakable: "Write them, say them aloud, and send the message asking for a time.",
  },
  {
    day: 3, act: "FACE_IT", title: "Cold water",
    brief: "A body that obeys you before dawn will obey you at noon.",
    gentle: "Thirty seconds of cold at the end of your shower.",
    firm: "Cold shower. Two minutes. No negotiating once the water is on.",
    unbreakable: "Cold shower, three minutes, and no complaint about it to anyone all day.",
  },
  {
    day: 4, act: "FACE_IT", title: "The unopened thing",
    brief: "There is a message, a bill or a result you have not opened.",
    gentle: "Open it. You do not have to act on it today.",
    firm: "Open it and write the single next action underneath.",
    unbreakable: "Open it and take the next action before the day ends.",
  },
  {
    day: 5, act: "FACE_IT", title: "One honest sentence",
    brief: "Say the true thing in the first two minutes, not the last.",
    gentle: "Say one honest sentence to someone today, early in the conversation.",
    firm: "Say the hard sentence within the first two minutes of a conversation you were dreading.",
    unbreakable: "Do it twice, with two different people.",
  },
  {
    day: 6, act: "FACE_IT", title: "Refuse once",
    brief: "You are overcommitted because you have never practised the word.",
    gentle: "Decline one small thing, without an excuse attached.",
    firm: "Say no to one request today. No justification, no softening clause.",
    unbreakable: "Say no to the hardest current ask, to the person it is most awkward with.",
  },
  {
    day: 7, act: "FACE_IT", title: "The ledger",
    brief: "End the act by looking at what the week actually was.",
    gentle: "Write down the one thing you avoided all week.",
    firm: "Write what you avoided, and what avoiding it cost you. Two lines.",
    unbreakable: "Write both, then do the smallest piece of the avoided thing tonight.",
  },

  // ── Act II · Control it ────────────────────────────────────────────
  {
    day: 8, act: "CONTROL_IT", title: "Send the frightening one",
    brief: "The email you have rewritten four times.",
    gentle: "Cut the draft to five lines. Do not send yet.",
    firm: "Send the email you're scared of. Four lines. No apology in the first one.",
    unbreakable: "Send it before 10:00, and do not check for a reply until evening.",
  },
  {
    day: 9, act: "CONTROL_IT", title: "One room, one thing",
    brief: "Attention is a room. Take everything else out of it.",
    gentle: "Twenty minutes on one task. Phone face down.",
    firm: "Twenty minutes. Phone in another room. One task, nothing else.",
    unbreakable: "Ninety minutes in three blocks. Phone in another room for all of them.",
  },
  {
    day: 10, act: "CONTROL_IT", title: "The morning is not for reacting",
    brief: "Whoever gets your first hour sets your day.",
    gentle: "No screen for the first fifteen minutes after waking.",
    firm: "No phone for the first hour. Not once.",
    unbreakable: "No phone for the first hour, and no inbox before noon.",
  },
  {
    day: 11, act: "CONTROL_IT", title: "Finish something small",
    brief: "You have three things at ninety percent. Ninety percent is nothing.",
    gentle: "Take one unfinished small thing to done.",
    firm: "Finish two things that are nearly done. Ship them, badly if necessary.",
    unbreakable: "Finish two, and delete a third you are never going to do.",
  },
  {
    day: 12, act: "CONTROL_IT", title: "The still hand",
    brief: "React slower than you want to, once, deliberately.",
    gentle: "Wait ten minutes before replying to something that annoys you.",
    firm: "Wait an hour before responding to the message that provokes you most today.",
    unbreakable: "Wait until tomorrow. Write the angry version, then do not send it.",
  },
  {
    day: 13, act: "CONTROL_IT", title: "Ask for the number",
    brief: "You have been hoping to be offered what you should be asking for.",
    gentle: "Write the number you actually want. Just write it.",
    firm: "Write the number and put the conversation in someone's calendar.",
    unbreakable: "Ask for it, today, out loud, and do not fill the silence afterwards.",
  },
  {
    day: 14, act: "CONTROL_IT", title: "Half",
    brief: "Mandela is listening from here. He waited longer than you have.",
    gentle: "Write one line on what has changed in two weeks.",
    firm: "Write what has changed and what has not. Be exact about the second.",
    unbreakable: "Write both, and tell someone the part that has not changed.",
  },

  // ── Act III · Endure it ────────────────────────────────────────────
  {
    day: 15, act: "ENDURE_IT", title: "The boring middle",
    brief: "This is the day people stop. Nothing is wrong.",
    gentle: "Do the smallest version of your habit. Do not skip.",
    firm: "Do the full trial with no adjustment, and do not tell anyone you did.",
    unbreakable: "Do it twice, and log why you wanted to stop.",
  },
  {
    day: 16, act: "ENDURE_IT", title: "Under-slept, anyway",
    brief: "Discipline that requires good conditions is a preference.",
    gentle: "Do the thing even if the day went badly.",
    firm: "Do the trial on the worst hour of your day, on purpose.",
    unbreakable: "Do it at 05:30, whatever last night was.",
  },
  {
    day: 17, act: "ENDURE_IT", title: "No complaint",
    brief: "Complaint is how you spend the energy the problem needs.",
    gentle: "No complaining for three hours.",
    firm: "A whole day with no complaint, out loud or in writing.",
    unbreakable: "Two days. If you slip, the count restarts.",
  },
  {
    day: 18, act: "ENDURE_IT", title: "The person you dropped",
    brief: "Someone fell out of your life through neglect, not conflict.",
    gentle: "Write their name down.",
    firm: "Send them four sentences. No apology for the gap.",
    unbreakable: "Call them. Actually call.",
  },
  {
    day: 19, act: "ENDURE_IT", title: "Money in daylight",
    brief: "The number you avoid looking at.",
    gentle: "Open the account and look. That's all.",
    firm: "Look, and write down the one number that matters most.",
    unbreakable: "Look, write it, and cancel one thing you are paying for and not using.",
  },
  {
    day: 20, act: "ENDURE_IT", title: "Do it before you feel like it",
    brief: "Motivation arrives at minute twenty, not minute zero.",
    gentle: "Start before you feel ready. Five minutes counts.",
    firm: "Start the moment you notice yourself negotiating. No delay.",
    unbreakable: "Start within sixty seconds of waking, three separate times today.",
  },
  {
    day: 21, act: "ENDURE_IT", title: "Three weeks",
    brief: "Curie is listening from here. She waited four years.",
    gentle: "Write what is easier now than on Day 1.",
    firm: "Write what is easier, and what you now do without deciding to.",
    unbreakable: "Write both, and add the one thing you are still avoiding.",
  },

  // ── Act IV · Become it ─────────────────────────────────────────────
  {
    day: 22, act: "BECOME_IT", title: "Teach it once",
    brief: "You do not have a thing until you can hand it to someone.",
    gentle: "Explain one thing you've learned to one person.",
    firm: "Teach it properly, to someone who could use it, unprompted.",
    unbreakable: "Teach it, then write down the part you could not explain.",
  },
  {
    day: 23, act: "BECOME_IT", title: "The public stake",
    brief: "Say out loud what you intend, to someone who will remember.",
    gentle: "Tell one person one thing you intend to do.",
    firm: "Tell someone, with a date attached.",
    unbreakable: "Tell three people, with a date, and ask one to check on you.",
  },
  {
    day: 24, act: "BECOME_IT", title: "Remove one option",
    brief: "Discipline is subtraction done while you are calm.",
    gentle: "Delete one app or one shortcut.",
    firm: "Remove one standing option that keeps costing you. Permanently.",
    unbreakable: "Remove two, and tell someone so you cannot quietly restore them.",
  },
  {
    day: 25, act: "BECOME_IT", title: "The conversation you have been circling",
    brief: "The whole month has been preparation for this one.",
    gentle: "Write down exactly what you want out of it.",
    firm: "Have it. Today. Four minutes is enough.",
    unbreakable: "Have it, and say the hardest sentence in the first two minutes.",
  },
  {
    day: 26, act: "BECOME_IT", title: "Sit with the result",
    brief: "You do not get to control what came back.",
    gentle: "Write what happened, without judging it.",
    firm: "Write what happened, and what was actually yours in it.",
    unbreakable: "Write both, and name the part you would do the same way again.",
  },
  {
    day: 27, act: "BECOME_IT", title: "The failure log",
    brief: "Look at what you missed this month, on purpose.",
    gentle: "List the days you skipped.",
    firm: "List them, and write the pattern in one sentence.",
    unbreakable: "List them, name the pattern, and set one rule that would have prevented half.",
  },
  {
    day: 28, act: "BECOME_IT", title: "One rule you already live by",
    brief: "Before you write the code, find the line that is already true.",
    gentle: "Write one rule you already follow without being told.",
    firm: "Write three, and cross out any you only wish were true.",
    unbreakable: "Write five, cross out the aspirational ones, and keep only what survives.",
  },
  {
    day: 29, act: "BECOME_IT", title: "Write your code",
    brief: "The rules you now live by. In your own hand, in your own words.",
    gentle: "Write three rules you intend to keep.",
    firm: "Write your Bushido Code. Between three and seven rules. No aspirations — only what you will actually do.",
    unbreakable: "Write it, then read it aloud to one other person.",
  },
  {
    day: 30, act: "BECOME_IT", title: "Begin again, harder",
    brief: "The thirty days were the entrance, not the building.",
    gentle: "Choose the one rule you will carry into next month.",
    firm: "Choose the rule, set the pressure for the next thirty days, and start tomorrow.",
    unbreakable: "Choose the rule, raise the pressure, and name the person who will hold you to it.",
  },
];

export type WoundSeed = { slug: string; label: string; themes: string[]; sortOrder: number };

export const WOUNDS: WoundSeed[] = [
  { slug: "fear-of-person", label: "Fear of a person", themes: ["scared", "conversation", "confrontation", "afraid"], sortOrder: 0 },
  { slug: "procrastination", label: "Procrastination", themes: ["procrastination", "putting", "avoid", "delay"], sortOrder: 1 },
  { slug: "career-stall", label: "Career stall", themes: ["career", "stall", "promotion", "passed", "job"], sortOrder: 2 },
  { slug: "betrayal", label: "Betrayal", themes: ["betrayal", "lied", "trusted", "friend"], sortOrder: 3 },
  { slug: "anxiety", label: "Anxiety", themes: ["anxiety", "worry", "dread", "fear"], sortOrder: 4 },
  { slug: "no-discipline", label: "No discipline", themes: ["discipline", "habit", "focus", "distraction"], sortOrder: 5 },
];
