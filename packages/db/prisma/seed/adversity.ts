/**
 * The Adversity Library — twenty authored wounds.
 *
 * Each is a 30-second read shaped story → lesson → action. Free accounts
 * get the first two per category; the rest is Pro.
 */

export type StorySeed = {
  slug: string;
  title: string;
  masterSlug: string;
  story: string;
  lesson: string;
  action: string;
  proOnly: boolean;
  searchCount: number;
};

export type CategorySeed = {
  slug: string;
  name: string;
  sortOrder: number;
  stories: StorySeed[];
};

export const CATEGORIES: CategorySeed[] = [
  {
    slug: "career",
    name: "Career",
    sortOrder: 0,
    stories: [
      {
        slug: "passed-over-promotion",
        title: "I was passed over for the promotion",
        masterSlug: "musashi",
        story:
          "The Yoshioka school refused me a fair duel. They named a boy as their head so that beating him would shame me and losing would end me. I arrived early, took the boy first, and left through the rice fields before the school could form a line.",
        lesson:
          "A rigged contest is information, not a verdict. Stop appealing to the judges and change the ground you fight on.",
        action:
          "Write the one thing that decision told you about your ground. One sentence. Then book the conversation.",
        proOnly: false,
        searchCount: 412,
      },
      {
        slug: "fired",
        title: "I was let go and I didn't see it coming",
        masterSlug: "seneca",
        story:
          "I was accused, condemned and exiled to Corsica for eight years over something I had no part in. I had been at the centre of Rome on the Friday. On the Monday I was on a rock in the sea.",
        lesson:
          "You were never holding the thing as tightly as it felt. What you are grieving is the version of the future you had already spent.",
        action:
          "Write down what you still are with the job gone. Five words. Read them before you tell anyone else the news.",
        proOnly: false,
        searchCount: 388,
      },
      {
        slug: "career-stall",
        title: "I've been in the same seat for three years",
        masterSlug: "curie",
        story:
          "The French Academy refused me membership by two votes, with a campaign in the press about my foreignness. I did not appeal and never stood again. I went back to the laboratory and took a second Nobel the following year.",
        lesson:
          "When a body has told you what it values, believe it and stop submitting to it. Spend the effort where the result is measured.",
        action:
          "Name the one person whose opinion you have been waiting on. Decide today to stop optimising for them.",
        proOnly: true,
        searchCount: 301,
      },
      {
        slug: "imposter",
        title: "Everyone will realise I don't know what I'm doing",
        masterSlug: "curie",
        story:
          "I fitted twenty vehicles with X-ray equipment and drove them to the front myself, because waiting for the institutions would have cost more limbs than my inexperience would. I learned to drive and change a tyre at forty-seven.",
        lesson:
          "If the thing needs doing and no one is doing it, your lack of qualification is the least interesting fact in the room.",
        action:
          "Do the part of your job you feel least qualified for, today, before you feel ready.",
        proOnly: true,
        searchCount: 276,
      },
      {
        slug: "underpaid",
        title: "I know I'm underpaid and I haven't asked",
        masterSlug: "sun-tzu",
        story:
          "Commanders lose by studying the opponent and not the terrain. Height, distance, the road out. Most defeats are decided before contact, by where a man agreed to stand.",
        lesson:
          "You are not being refused. You have not yet made the refusal cost them anything.",
        action:
          "Write the number. Not a range — the number. Send the meeting request before you close the app.",
        proOnly: true,
        searchCount: 244,
      },
      {
        slug: "hate-my-job",
        title: "I dread Sunday evenings",
        masterSlug: "seneca",
        story:
          "Nero sent word that I was to die. I asked for time to settle my affairs and was refused, so I settled them in the hour I had. There was nothing left that I had not already decided years earlier.",
        lesson:
          "Every decision you postpone will eventually be made for you, on someone else's schedule.",
        action:
          "Put a date on the calendar by which you will have decided. Not decided — just the date.",
        proOnly: true,
        searchCount: 198,
      },
    ],
  },

  {
    slug: "mind",
    name: "Mind",
    sortOrder: 1,
    stories: [
      {
        slug: "cant-stop-checking-phone",
        title: "I can't stop checking my phone",
        masterSlug: "curie",
        story:
          "In Paris I lived in an attic on tea and bread so I could afford lectures, and I fainted more than once. I do not offer that as suffering. I offer it as a controlled reduction of variables — I had removed everything from the room that was not the degree.",
        lesson:
          "Discipline is not force of will. It is the removal of options, done in advance, while you are still calm.",
        action:
          "Put the phone in another room for twenty minutes. Not on silent. Another room.",
        proOnly: false,
        searchCount: 507,
      },
      {
        slug: "scared-of-conversation",
        title: "I'm scared of a conversation I need to have",
        masterSlug: "seneca",
        story:
          "I wrote to Lucilius about fears I had carried for years and never once met in the world. We suffer more often in imagination than in reality. I had spent whole seasons paying interest on debts that were never called in.",
        lesson:
          "You have already had this conversation forty times, badly, alone. The real one takes four minutes and has one other person in it.",
        action:
          "Write the first two sentences you will actually say. Say them aloud once. Send the message asking for a time.",
        proOnly: false,
        searchCount: 463,
      },
      {
        slug: "anxious-all-the-time",
        title: "There's a hum of dread I can't switch off",
        masterSlug: "seneca",
        story:
          "I was worth three hundred million sesterces and was mocked for writing about poverty. I did not give it away. I held it loosely and wrote down what I would still be if it went — because the day it went, I did not want to be meeting myself for the first time.",
        lesson:
          "Name the specific loss you are bracing for. Unnamed, it costs you every hour. Named, it costs you one.",
        action: "Write the sentence 'I am afraid that…' and finish it. Once, honestly.",
        proOnly: true,
        searchCount: 421,
      },
      {
        slug: "overwhelmed",
        title: "There's too much and I've frozen",
        masterSlug: "musashi",
        story:
          "At Ichijōji I faced dozens of men in a rice field. I did not plan every cut. I chose the narrow path where only one of them could reach me at a time, and then the number stopped mattering.",
        lesson:
          "You are not fighting the whole thing. You are fighting whichever part of it you have allowed to reach you at once.",
        action: "Write the list. Cross out all but one line. Do that line before you sleep.",
        proOnly: true,
        searchCount: 355,
      },
      {
        slug: "cant-sleep",
        title: "I lie awake rerunning the same scene",
        masterSlug: "seneca",
        story:
          "In exile I learned that a man who has decided what he will do with an ordinary day cannot be exiled from very much. The nights were the difficulty. The mornings were mine.",
        lesson:
          "The scene reruns because it has no ending. Give it one on paper and it stops asking for one at 3am.",
        action: "Write what you will do about it tomorrow. One line. Leave it by the bed.",
        proOnly: true,
        searchCount: 289,
      },
      {
        slug: "comparing-myself",
        title: "Everyone I know is further ahead",
        masterSlug: "musashi",
        story:
          "I won more than sixty duels and then I stopped. Not because I had lost my hand, but because I understood I had been winning without knowing why, and a man who cannot say why he wins has not won anything he can keep.",
        lesson:
          "You are comparing your process to their result. One of those is visible and it is not yours.",
        action: "Write down why your last good week worked. Mechanism, not mood.",
        proOnly: true,
        searchCount: 267,
      },
      {
        slug: "no-motivation",
        title: "I don't want anything enough to chase it",
        masterSlug: "curie",
        story:
          "I stirred vats of pitchblende in a leaking shed for four years to isolate a tenth of a gram of radium. I did not feel inspired on most of those days. The vat did not require it.",
        lesson:
          "Motivation is an output, not an input. It arrives after the twentieth minute, not before the first.",
        action: "Work on one thing for twenty minutes. Judge nothing until the twenty is up.",
        proOnly: true,
        searchCount: 233,
      },
    ],
  },

  {
    slug: "relationships",
    name: "Relationships",
    sortOrder: 2,
    stories: [
      {
        slug: "trusted-lied",
        title: "Someone I trusted lied to me",
        masterSlug: "mandela",
        story:
          "At Rivonia, some of the people who stood with us chose to speak against us. For years afterwards I shared a country, and later a government, with people who had done a great deal worse than lie to me.",
        lesson:
          "Separate what this person is from what you will now do. The first belongs to them. Only the second belongs to you.",
        action:
          "Decide what you will still do with them — work, speak, or nothing. Decide today, not when you feel calmer.",
        proOnly: false,
        searchCount: 478,
      },
      {
        slug: "breakup",
        title: "They ended it and I didn't get a reason",
        masterSlug: "seneca",
        story:
          "I was condemned without a hearing I would recognise as one, and sent away for eight years. I spent the first of them assembling the case I would never get to make.",
        lesson:
          "A reason you are given would not have helped. You want the reason so you can argue with it.",
        action: "Write the argument you keep rehearsing. Then delete it without sending it.",
        proOnly: false,
        searchCount: 445,
      },
      {
        slug: "estranged-family",
        title: "I haven't spoken to them in two years",
        masterSlug: "mandela",
        story:
          "I opened talks with the government while still a prisoner, and did not first ask permission from my own side. They were angry. Someone had to move before both sides were ready, and it had better be the one with the least left to lose.",
        lesson:
          "Someone goes first, and it is rarely the person who feels most wronged. It is the one who has stopped waiting to be right.",
        action: "Send four sentences. No history in them. Just an opening.",
        proOnly: true,
        searchCount: 312,
      },
      {
        slug: "cant-forgive",
        title: "I can't let go of what they did",
        masterSlug: "mandela",
        story:
          "When I became president I invited one of my former warders to sit among the guests. It was not sentiment and it was not forgiveness performed for a camera. It was the cheapest way I knew to tell a frightened country what came next.",
        lesson:
          "Resentment is a thing you carry for someone who set it down long ago. Put it down as strategy, not as absolution.",
        action:
          "Name one thing the resentment is costing you this week. Say it out loud.",
        proOnly: true,
        searchCount: 298,
      },
    ],
  },

  {
    slug: "discipline",
    name: "Discipline",
    sortOrder: 3,
    stories: [
      {
        slug: "putting-off-one-thing",
        title: "I keep putting off one thing",
        masterSlug: "curie",
        story:
          "I stirred a vat of pitchblende for four years to isolate one tenth of a gram of radium. Not because I was patient — because I made the vat the only thing in the room.",
        lesson:
          "You are not avoiding the task. You are avoiding the twenty minutes where it is the only thing in the room.",
        action: "Twenty minutes. Phone in another room. The thing you named, nothing else.",
        proOnly: false,
        searchCount: 592,
      },
      {
        slug: "start-then-quit",
        title: "I start everything and finish nothing",
        masterSlug: "musashi",
        story:
          "I came late to Ganryū island with an oar I had cut down as I rowed. One weapon, made on the way, for one purpose. I did not bring a second in case the first disappointed me.",
        lesson:
          "A second option is not insurance. It is permission to abandon the first.",
        action: "Delete or pause every project but one, today. Say which one out loud.",
        proOnly: false,
        searchCount: 401,
      },
      {
        slug: "no-routine",
        title: "My days have no shape",
        masterSlug: "mandela",
        story:
          "For thirteen years we broke limestone on Robben Island. I used the walk to the quarry to learn Afrikaans, because I would one day need to speak to these men in the language they thought in.",
        lesson:
          "Time you did not choose is still time. The question is whether you spend it being owed something or being ready.",
        action: "Fix one thing to one time tomorrow. One. Set the alarm now.",
        proOnly: true,
        searchCount: 334,
      },
    ],
  },
];
