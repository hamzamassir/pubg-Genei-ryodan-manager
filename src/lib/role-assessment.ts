/** PUBG Mobile competitive role assessment — scoring never shown to players */

export const ROLE_CODES = ["IGL", "ENT", "FRG", "FLK", "SCT", "SNR", "SUP", "ANK"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_META: Record<
  RoleCode,
  { name: string; short: string; emoji: string }
> = {
  IGL: { name: "IGL / Shot Caller", short: "IGL", emoji: "👑" },
  ENT: { name: "Entry Fragger", short: "Entry", emoji: "⚡" },
  FRG: { name: "Fragger", short: "Fragger", emoji: "🔥" },
  FLK: { name: "Flanker", short: "Flanker", emoji: "🥷" },
  SCT: { name: "Fixed / Tempo Scout", short: "Scout", emoji: "👁️" },
  SNR: { name: "Sniper / Long Ranger", short: "Sniper", emoji: "🎯" },
  SUP: { name: "Support", short: "Support", emoji: "🩹" },
  ANK: { name: "Anchor / Spoiler / Off-Angle", short: "Anchor", emoji: "🎭" },
};

/** 1–5 ability → base points */
export const SCALE_POINTS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
  5: 5,
};

export type RoleQuestion =
  | {
      id: string;
      section: number;
      sectionTitle: string;
      prompt: string;
      kind: "text";
      scored: false;
    }
  | {
      id: string;
      section: number;
      sectionTitle: string;
      prompt: string;
      kind: "single";
      options: string[];
      scored: false;
    }
  | {
      id: string;
      section: number;
      sectionTitle: string;
      prompt: string;
      kind: "multi";
      options: string[];
      scored: false;
    }
  | {
      id: string;
      section: number;
      sectionTitle: string;
      prompt: string;
      kind: "scale";
      scored: true;
      /** Roles that receive SCALE_POINTS[answer] */
      roles: RoleCode[];
    }
  | {
      id: string;
      section: number;
      sectionTitle: string;
      prompt: string;
      kind: "choice";
      scored: true;
      options: { key: string; label: string; scores: number[] }[];
    };

function S(
  id: string,
  section: number,
  sectionTitle: string,
  prompt: string,
  roles: RoleCode[],
): RoleQuestion {
  return { id, section, sectionTitle, prompt, kind: "scale", scored: true, roles };
}

function C(
  id: string,
  section: number,
  sectionTitle: string,
  prompt: string,
  options: { key: string; label: string; scores: number[] }[],
): RoleQuestion {
  return { id, section, sectionTitle, prompt, kind: "choice", scored: true, options };
}

const SEC = {
  1: "Player profile",
  2: "Mechanical ability",
  3: "Close-combat & entry",
  4: "Fragging & fight conversion",
  5: "Rotation & zone IQ",
  6: "Scouting & information",
  7: "Sniper / long-range",
  8: "Support / utility",
  9: "Anchor / spoiler / off-angle",
  10: "Flanking",
  11: "IGL / shot calling",
  12: "Communication",
  13: "Mentality & team play",
  14: "High-pressure / endgame / clutch",
} as const;

export const ROLE_QUESTIONS: RoleQuestion[] = [
  // —— Section 1 (info only) ——
  { id: "Q1", section: 1, sectionTitle: SEC[1], prompt: "IGN (in-game name)", kind: "text", scored: false },
  {
    id: "Q2",
    section: 1,
    sectionTitle: SEC[1],
    prompt: "How long have you played PUBG Mobile?",
    kind: "single",
    scored: false,
    options: ["Less than 1 year", "1–2 years", "2–3 years", "3–4 years", "4+ years"],
  },
  {
    id: "Q3",
    section: 1,
    sectionTitle: SEC[1],
    prompt: "Competitive experience?",
    kind: "single",
    scored: false,
    options: [
      "None",
      "Occasional scrims",
      "Regular scrims",
      "Tournaments",
      "Competitive/tournament experience for 1+ year",
    ],
  },
  { id: "Q4", section: 1, sectionTitle: SEC[1], prompt: "Current / peak competitive level", kind: "text", scored: false },
  { id: "Q5", section: 1, sectionTitle: SEC[1], prompt: "Device", kind: "text", scored: false },
  {
    id: "Q6",
    section: 1,
    sectionTitle: SEC[1],
    prompt: "FPS",
    kind: "single",
    scored: false,
    options: ["60", "90", "120", "Other"],
  },
  {
    id: "Q7",
    section: 1,
    sectionTitle: SEC[1],
    prompt: "Control setup",
    kind: "single",
    scored: false,
    options: ["2 finger", "3 finger", "4 finger", "5 finger", "6+"],
  },
  {
    id: "Q8",
    section: 1,
    sectionTitle: SEC[1],
    prompt: "Gyroscope",
    kind: "single",
    scored: false,
    options: ["Off", "Always on", "ADS only"],
  },
  {
    id: "Q9",
    section: 1,
    sectionTitle: SEC[1],
    prompt: "Main maps",
    kind: "multi",
    scored: false,
    options: ["Erangel", "Miramar", "Rondo", "Sanhok", "Livik", "Other"],
  },
  {
    id: "Q10",
    section: 1,
    sectionTitle: SEC[1],
    prompt: "How many hours per week do you realistically play?",
    kind: "single",
    scored: false,
    options: ["<5", "5–10", "10–20", "20–30", "30+"],
  },

  // —— Section 2 ——
  S("Q11", 2, SEC[2], "Close-range AR fights", ["ENT", "FRG", "FLK"]),
  S("Q12", 2, SEC[2], "Mid-range sprays", ["ENT", "FRG", "FLK", "SNR"]),
  S("Q13", 2, SEC[2], "Long-range accuracy", ["SNR", "SCT", "IGL"]),
  S("Q14", 2, SEC[2], "DMR ability", ["SNR", "SCT", "FRG"]),
  S("Q15", 2, SEC[2], "Bolt-action / sniper ability", ["SNR"]),
  S("Q16", 2, SEC[2], "Recoil control", ["ENT", "FRG", "FLK", "SNR"]),
  S("Q17", 2, SEC[2], "Tracking moving targets", ["ENT", "FRG", "FLK", "SNR"]),
  S("Q18", 2, SEC[2], "Fast target switching", ["ENT", "FRG", "FLK"]),
  S("Q19", 2, SEC[2], "Hip-fire / very close-range mechanics", ["ENT", "FRG"]),
  S("Q20", 2, SEC[2], "Fighting multiple enemies simultaneously", ["ENT", "FRG", "FLK", "ANK"]),
  S("Q21", 2, SEC[2], "Vehicle-to-vehicle fighting", ["ENT", "FRG", "FLK", "SCT"]),
  S("Q22", 2, SEC[2], "Fighting while under heavy pressure", ["ENT", "FRG", "FLK", "ANK"]),

  // —— Section 3 ——
  C("Q23", 3, SEC[3], "You are first into a compound and hear multiple enemies. What do you prioritize?", [
    { key: "A", label: "Immediately push the closest enemy.", scores: [1, 5, 4, 2, 0, 0, 1, 1] },
    { key: "B", label: "Create an isolated 1v1 before committing.", scores: [2, 4, 5, 3, 1, 0, 1, 1] },
    { key: "C", label: "Wait for teammates to enter first.", scores: [3, 0, 2, 0, 1, 1, 5, 4] },
    { key: "D", label: "Take an unexpected angle and force them to split their attention.", scores: [1, 3, 3, 5, 2, 0, 1, 2] },
  ]),
  C("Q24", 3, SEC[3], "You knock the first enemy during a compound crash. What is your next priority?", [
    { key: "A", label: "Immediately push deeper.", scores: [1, 5, 4, 3, 0, 0, 1, 1] },
    { key: "B", label: "Reset/reload and prepare for the next fight.", scores: [2, 2, 5, 2, 1, 1, 3, 3] },
    { key: "C", label: "Give the team the information and let the IGL decide.", scores: [5, 3, 2, 1, 3, 1, 3, 2] },
    { key: "D", label: "Take an angle that prevents remaining enemies from helping the knocked player.", scores: [2, 3, 4, 5, 2, 1, 1, 3] },
  ]),
  C("Q25", 3, SEC[3], "Your Entry player is knocked first.", [
    { key: "A", label: "Immediately trade the enemy.", scores: [1, 5, 5, 2, 0, 0, 1, 2] },
    { key: "B", label: "Smoke and stabilize the situation.", scores: [2, 1, 2, 0, 2, 1, 5, 4] },
    { key: "C", label: "Attack from another angle.", scores: [2, 3, 4, 5, 1, 0, 1, 2] },
    { key: "D", label: "Disengage if the fight is no longer favorable.", scores: [5, 0, 1, 2, 3, 1, 3, 5] },
  ]),
  C("Q26", 3, SEC[3], "You are Entry and your IGL gives you a push call you don’t personally like.", [
    { key: "A", label: "Push immediately.", scores: [3, 5, 3, 2, 1, 0, 2, 3] },
    { key: "B", label: "Tell the IGL your concern, then execute the call.", scores: [5, 4, 3, 1, 2, 0, 4, 3] },
    { key: "C", label: "Ignore the call and play your own fight.", scores: [0, 2, 4, 5, 0, 0, 0, 1] },
    { key: "D", label: "Suggest an alternative quickly before committing.", scores: [5, 3, 3, 3, 3, 0, 3, 3] },
  ]),
  C("Q27", 3, SEC[3], "You’re in a 1v2 indoors. What is your first objective?", [
    { key: "A", label: "Kill the closest enemy immediately.", scores: [1, 5, 4, 2, 0, 0, 0, 1] },
    { key: "B", label: "Separate the two enemies.", scores: [2, 4, 5, 4, 1, 0, 1, 2] },
    { key: "C", label: "Find information about both positions before committing.", scores: [4, 2, 2, 2, 5, 1, 2, 3] },
    { key: "D", label: "Create an unexpected angle.", scores: [1, 3, 4, 5, 2, 0, 1, 2] },
  ]),
  C("Q28", 3, SEC[3], "You have a knock but are at 20 HP.", [
    { key: "A", label: "Finish immediately.", scores: [0, 5, 4, 2, 0, 0, 1, 1] },
    { key: "B", label: "Heal first.", scores: [2, 1, 3, 1, 1, 1, 5, 4] },
    { key: "C", label: "Hold the knock and pressure the enemy’s teammates.", scores: [3, 3, 5, 3, 2, 1, 3, 3] },
    { key: "D", label: "Reposition and create a new angle.", scores: [2, 3, 4, 5, 2, 1, 2, 3] },
  ]),
  S("Q29", 3, SEC[3], "How comfortable are you being the first player through a door?", ["ENT", "FRG"]),
  S("Q30", 3, SEC[3], "How good are you at recognizing when NOT to push?", ["IGL", "ENT", "FRG", "FLK", "ANK"]),

  // —— Section 4 ——
  C("Q31", 4, SEC[4], "Your teammate gets a knock from one side while you have another enemy in front of you.", [
    { key: "A", label: "Push the enemy in front of you.", scores: [1, 4, 5, 2, 0, 0, 1, 2] },
    { key: "B", label: "Immediately help your teammate’s fight.", scores: [2, 4, 5, 1, 1, 0, 3, 2] },
    { key: "C", label: "Hold your enemy so they can’t assist their teammate.", scores: [3, 3, 5, 3, 2, 1, 2, 4] },
    { key: "D", label: "Reposition to create a crossfire.", scores: [3, 3, 4, 5, 3, 1, 2, 4] },
  ]),
  C("Q32", 4, SEC[4], "An enemy is heavily damaged but escapes behind cover.", [
    { key: "A", label: "Chase immediately.", scores: [0, 5, 4, 2, 0, 0, 1, 1] },
    { key: "B", label: "Hold the angle and wait.", scores: [2, 3, 5, 2, 2, 1, 2, 4] },
    { key: "C", label: "Predict where he will move and cut the escape.", scores: [4, 3, 5, 5, 4, 1, 2, 3] },
    { key: "D", label: "Focus on his teammates instead.", scores: [3, 3, 5, 3, 2, 1, 3, 3] },
  ]),
  S("Q33", 4, SEC[4], "Rate your ability to trade a teammate’s knock/death.", ["ENT", "FRG", "SUP"]),
  S("Q34", 4, SEC[4], "Rate your ability to recognize the highest-value enemy target.", ["IGL", "FRG", "SCT", "FLK"]),
  S("Q35", 4, SEC[4], "Rate your ability to win fights after your initial plan fails.", ["ENT", "FRG", "FLK", "ANK"]),
  C("Q36", 4, SEC[4], "Your team is winning the fight comfortably. What should you avoid?", [
    { key: "A", label: "Unnecessary overextension.", scores: [4, 1, 2, 2, 2, 1, 3, 5] },
    { key: "B", label: "Giving enemies time to recover.", scores: [2, 4, 5, 3, 1, 1, 2, 2] },
    { key: "C", label: "Maintaining pressure.", scores: [1, 5, 5, 4, 1, 1, 1, 1] },
    { key: "D", label: "Allowing enemy teammates to regroup.", scores: [3, 3, 4, 4, 4, 1, 2, 4] },
  ]),
  S("Q37", 4, SEC[4], "Rate your ability to fight while maintaining awareness of the wider battlefield.", ["IGL", "FRG", "FLK", "SCT"]),
  S("Q38", 4, SEC[4], "Rate your ability to remain mechanically effective when low HP.", ["ENT", "FRG", "FLK", "ANK"]),

  // —— Section 5 ——
  C("Q39", 5, SEC[5], "Your compound is strong but the next zone pulls 400m away.", [
    { key: "A", label: "Leave immediately.", scores: [2, 3, 2, 2, 2, 0, 2, 2] },
    { key: "B", label: "Gather information and identify the best route first.", scores: [5, 1, 1, 2, 5, 2, 3, 4] },
    { key: "C", label: "Send a player ahead to scout.", scores: [4, 1, 1, 3, 5, 1, 3, 3] },
    { key: "D", label: "Wait until the last possible moment.", scores: [3, 2, 2, 2, 1, 1, 3, 5] },
  ]),
  C("Q40", 5, SEC[5], "Two possible rotation routes: shorter with unknown enemies vs longer with more info.", [
    { key: "A", label: "Take the shorter route.", scores: [1, 4, 3, 3, 1, 0, 1, 2] },
    { key: "B", label: "Take the known safer route.", scores: [4, 1, 1, 2, 4, 1, 4, 5] },
    { key: "C", label: "Scout the shorter route first.", scores: [4, 1, 1, 4, 5, 1, 2, 3] },
    { key: "D", label: "Let the IGL choose based on zone timing.", scores: [5, 2, 2, 2, 3, 1, 3, 4] },
  ]),
  C("Q41", 5, SEC[5], "Your team gets shot during an open-field rotation.", [
    { key: "A", label: "Stop and fight.", scores: [1, 5, 4, 2, 0, 0, 1, 2] },
    { key: "B", label: "Find cover and identify the shooters.", scores: [5, 1, 2, 2, 5, 1, 3, 5] },
    { key: "C", label: "Smoke and continue moving.", scores: [3, 2, 2, 1, 3, 1, 5, 4] },
    { key: "D", label: "Split the team to create multiple angles.", scores: [2, 3, 3, 5, 2, 0, 1, 2] },
  ]),
  C("Q42", 5, SEC[5], "You arrive late to a compound occupied by another team.", [
    { key: "A", label: "Crash immediately.", scores: [1, 5, 4, 2, 0, 0, 1, 2] },
    { key: "B", label: "Look for another position.", scores: [4, 1, 1, 2, 3, 1, 4, 5] },
    { key: "C", label: "Scout their weak side.", scores: [5, 2, 2, 5, 5, 2, 2, 3] },
    { key: "D", label: "Surround them and prepare pressure.", scores: [4, 3, 4, 5, 3, 1, 2, 4] },
  ]),
  S("Q43", 5, SEC[5], "Rate your ability to predict the next zone.", ["IGL", "SCT"]),
  S("Q44", 5, SEC[5], "Rate your understanding of terrain and power positions.", ["IGL", "SCT", "SNR", "ANK"]),
  S("Q45", 5, SEC[5], "Rate your ability to choose between early, mid and late rotation.", ["IGL", "SCT", "ANK"]),
  S("Q46", 5, SEC[5], "Rate your ability to recognize when a rotation is too risky.", ["IGL", "SCT", "SUP", "ANK"]),

  // —— Section 6 ——
  C("Q47", 6, SEC[6], "You have no information on the compound ahead.", [
    { key: "A", label: "Drive directly into it.", scores: [1, 4, 3, 2, 0, 0, 1, 2] },
    { key: "B", label: "Stop and gather information.", scores: [5, 1, 1, 2, 5, 1, 3, 4] },
    { key: "C", label: "Send the Scout ahead.", scores: [4, 1, 1, 4, 5, 1, 3, 3] },
    { key: "D", label: "Avoid it completely.", scores: [3, 1, 1, 2, 3, 1, 4, 5] },
  ]),
  C("Q48", 6, SEC[6], "You spot a team 300m away. What information is most useful?", [
    { key: "A", label: "Number of players.", scores: [3, 1, 2, 2, 5, 1, 2, 3] },
    { key: "B", label: "Exact position and movement.", scores: [4, 1, 2, 3, 5, 2, 2, 3] },
    { key: "C", label: "Their weapons.", scores: [2, 1, 2, 3, 3, 5, 2, 2] },
    { key: "D", label: "Whether they can interfere with your rotation.", scores: [5, 1, 2, 3, 5, 1, 3, 5] },
  ]),
  C("Q49", 6, SEC[6], "You’re scouting ahead and find an enemy team.", [
    { key: "A", label: "Shoot immediately.", scores: [1, 4, 5, 3, 1, 2, 1, 2] },
    { key: "B", label: "Stay hidden and report them.", scores: [4, 0, 1, 2, 5, 1, 4, 4] },
    { key: "C", label: "Find their exact numbers and positions.", scores: [5, 1, 2, 4, 5, 2, 3, 4] },
    { key: "D", label: "Try to create pressure from an unexpected angle.", scores: [2, 3, 4, 5, 2, 2, 1, 3] },
  ]),
  S("Q50", 6, SEC[6], "Rate your ability to remember enemy locations.", ["IGL", "SCT", "FLK", "SNR"]),
  S("Q51", 6, SEC[6], "Rate your ability to identify where gunfire is coming from.", ["SCT", "IGL", "FLK", "SNR"]),
  S("Q52", 6, SEC[6], "Rate your ability to track multiple teams simultaneously.", ["IGL", "SCT"]),
  S("Q53", 6, SEC[6], "Rate your ability to safely gather information without unnecessarily fighting.", ["SCT", "IGL", "ANK"]),
  S("Q54", 6, SEC[6], "Rate your communication of enemy information.", ["IGL", "SCT", "SUP", "ANK"]),

  // —— Section 7 ——
  C("Q55", 7, SEC[7], "Your team is preparing to attack a compound. You have a strong long-range angle.", [
    { key: "A", label: "Look for a knock before the push.", scores: [3, 3, 4, 2, 3, 5, 2, 2] },
    { key: "B", label: "Stay hidden and provide overwatch.", scores: [2, 1, 2, 2, 3, 5, 4, 5] },
    { key: "C", label: "Push with the team immediately.", scores: [1, 5, 4, 3, 0, 1, 1, 1] },
    { key: "D", label: "Watch enemy rotations while teammates attack.", scores: [5, 1, 2, 3, 5, 5, 2, 5] },
  ]),
  C("Q56", 7, SEC[7], "You knock an enemy from 300m away.", [
    { key: "A", label: "Immediately finish if possible.", scores: [1, 3, 5, 1, 1, 5, 1, 1] },
    { key: "B", label: "Continue suppressing his teammates.", scores: [2, 2, 5, 2, 2, 5, 2, 3] },
    { key: "C", label: "Give the team the information and maintain overwatch.", scores: [5, 1, 2, 2, 5, 5, 3, 5] },
    { key: "D", label: "Move closer to support the push.", scores: [3, 4, 4, 3, 1, 3, 2, 2] },
  ]),
  S("Q57", 7, SEC[7], "Rate your DMR accuracy.", ["SNR", "SCT", "FRG"]),
  S("Q58", 7, SEC[7], "Rate your bolt-action accuracy.", ["SNR"]),
  S("Q59", 7, SEC[7], "Rate your ability to identify high-value long-range targets.", ["SNR", "IGL", "SCT"]),
  S("Q60", 7, SEC[7], "Rate your ability to provide useful overwatch.", ["SNR", "SCT", "SUP", "ANK"]),
  S("Q61", 7, SEC[7], "Rate your patience when holding a long-range angle.", ["SNR", "SCT", "ANK"]),
  S("Q62", 7, SEC[7], "Rate your ability to fight effectively after losing your long-range advantage.", ["SNR", "FRG", "ANK"]),

  // —— Section 8 ——
  C("Q63", 8, SEC[8], "Your Entry gets knocked in an exposed position.", [
    { key: "A", label: "Immediately fight the enemy.", scores: [1, 5, 4, 2, 0, 0, 1, 2] },
    { key: "B", label: "Smoke the Entry and prepare a recovery.", scores: [4, 1, 2, 1, 2, 1, 5, 5] },
    { key: "C", label: "Hold the enemy’s angle.", scores: [3, 2, 3, 3, 4, 1, 5, 5] },
    { key: "D", label: "Push another side to distract them.", scores: [2, 3, 4, 5, 2, 0, 2, 3] },
  ]),
  C("Q64", 8, SEC[8], "You have limited smokes during the final zones.", [
    { key: "A", label: "Use them aggressively for pushes.", scores: [2, 5, 4, 3, 1, 0, 2, 2] },
    { key: "B", label: "Save them for essential movement/revives.", scores: [5, 1, 1, 1, 3, 1, 5, 5] },
    { key: "C", label: "Give them to the Entry.", scores: [2, 4, 4, 2, 1, 0, 5, 2] },
    { key: "D", label: "Use them to create multiple angles.", scores: [3, 3, 3, 5, 3, 1, 4, 4] },
  ]),
  S("Q65", 8, SEC[8], "Rate your grenade / utility usage.", ["SUP", "ENT", "IGL", "FRG"]),
  S("Q66", 8, SEC[8], "Rate your smoke placement.", ["SUP", "IGL", "ANK"]),
  S("Q67", 8, SEC[8], "Rate your ability to revive teammates safely.", ["SUP", "ANK", "IGL"]),
  S("Q68", 8, SEC[8], "Rate your ability to provide cover for teammates.", ["SUP", "ANK", "SNR"]),
  S("Q69", 8, SEC[8], "Rate your willingness to sacrifice personal kills for team success.", ["SUP", "IGL", "ANK"]),
  S("Q70", 8, SEC[8], "Rate your ability to know when to revive versus fight.", ["SUP", "IGL", "ANK"]),

  // —— Section 9 ——
  C("Q71", 9, SEC[9], "Your team is attacking from the front. Where would you prefer to be?", [
    { key: "A", label: "First through the entrance.", scores: [1, 5, 4, 2, 0, 0, 1, 1] },
    { key: "B", label: "Directly behind Entry.", scores: [2, 3, 5, 2, 1, 1, 5, 3] },
    { key: "C", label: "On a separate angle that threatens the enemy’s side.", scores: [3, 3, 4, 5, 4, 2, 2, 5] },
    { key: "D", label: "Behind the team protecting the rear.", scores: [4, 1, 2, 2, 5, 2, 4, 5] },
  ]),
  C("Q72", 9, SEC[9], "Enemy team is focused on your main three players.", [
    { key: "A", label: "Push directly.", scores: [1, 5, 4, 2, 0, 0, 1, 1] },
    { key: "B", label: "Stay hidden and create an unexpected angle.", scores: [3, 2, 4, 5, 3, 1, 2, 5] },
    { key: "C", label: "Rotate behind them completely.", scores: [2, 3, 4, 5, 2, 1, 1, 3] },
    { key: "D", label: "Hold the rear and prevent a third party.", scores: [4, 1, 1, 2, 5, 2, 4, 5] },
  ]),
  C("Q73", 9, SEC[9], "Your team is holding a compound. Where should you position yourself?", [
    { key: "A", label: "At the strongest defensive point.", scores: [3, 1, 2, 1, 3, 2, 3, 5] },
    { key: "B", label: "At an off-angle where you can punish a push.", scores: [3, 2, 4, 5, 3, 2, 2, 5] },
    { key: "C", label: "At the team’s rear.", scores: [4, 1, 1, 2, 5, 1, 4, 5] },
    { key: "D", label: "Wherever the IGL assigns you.", scores: [5, 2, 2, 2, 3, 1, 4, 4] },
  ]),
  S("Q74", 9, SEC[9], "Rate your ability to hold an off-angle without unnecessarily exposing yourself.", ["ANK", "FLK", "SCT", "SNR"]),
  S("Q75", 9, SEC[9], "Rate your ability to protect the team’s rear.", ["ANK", "SCT", "SUP", "IGL"]),
  S("Q76", 9, SEC[9], "Rate your ability to punish enemies who overextend.", ["ANK", "FLK", "FRG"]),
  S("Q77", 9, SEC[9], "Rate your ability to hold a position under pressure.", ["ANK", "SUP", "SNR"]),
  S("Q78", 9, SEC[9], "Rate your ability to know when to abandon your position.", ["ANK", "IGL", "SCT"]),

  // —— Section 10 ——
  C("Q79", 10, SEC[10], "Your team is fighting a compound from the front. What do you prefer?", [
    { key: "A", label: "Push with the team.", scores: [1, 5, 5, 2, 0, 0, 2, 2] },
    { key: "B", label: "Take a side angle.", scores: [2, 3, 4, 5, 3, 1, 1, 4] },
    { key: "C", label: "Rotate completely around the enemy.", scores: [3, 2, 3, 5, 2, 1, 1, 3] },
    { key: "D", label: "Hold the team’s rear.", scores: [4, 1, 1, 2, 5, 2, 4, 5] },
  ]),
  C("Q80", 10, SEC[10], "When is a flank BAD?", [
    { key: "A", label: "When it takes too long and leaves your team outnumbered.", scores: [5, 1, 2, 5, 4, 1, 3, 5] },
    { key: "B", label: "When the enemy doesn’t know you’re there.", scores: [1, 3, 3, 1, 2, 1, 1, 2] },
    { key: "C", label: "When your team is already winning.", scores: [2, 3, 3, 2, 2, 1, 3, 3] },
    { key: "D", label: "Almost never; unexpected angles are always useful.", scores: [0, 4, 4, 2, 0, 0, 0, 1] },
  ]),
  S("Q81", 10, SEC[10], "Rate your ability to time a flank with your team’s main push.", ["FLK", "IGL", "ENT"]),
  S("Q82", 10, SEC[10], "Rate your ability to operate independently.", ["FLK", "SCT", "ENT"]),
  S("Q83", 10, SEC[10], "Rate your ability to disengage after a failed flank.", ["FLK", "IGL", "ANK"]),
  S("Q84", 10, SEC[10], "Rate your ability to create pressure without immediately revealing your position.", ["FLK", "ANK", "SCT"]),
  S("Q85", 10, SEC[10], "Rate your ability to cut enemy rotations.", ["FLK", "SCT", "IGL"]),
  S("Q86", 10, SEC[10], "Rate your ability to recognize the correct timing for an off-angle attack.", ["FLK", "IGL", "ANK"]),

  // —— Section 11 ——
  C("Q87", 11, SEC[11], "Your team has 60 seconds before zone closes. You have two possible compounds.", [
    { key: "A", label: "Pick the closest one.", scores: [1, 3, 2, 2, 1, 0, 2, 2] },
    { key: "B", label: "Pick the strongest one based on terrain, zone and enemy information.", scores: [5, 1, 1, 2, 5, 2, 3, 5] },
    { key: "C", label: "Send a scout first.", scores: [5, 1, 1, 4, 5, 1, 3, 4] },
    { key: "D", label: "Wait until the zone forces the decision.", scores: [2, 2, 2, 1, 1, 0, 3, 3] },
  ]),
  C("Q88", 11, SEC[11], "Two teammates want to fight while two want to rotate.", [
    { key: "A", label: "Vote.", scores: [1, 2, 2, 2, 2, 0, 2, 2] },
    { key: "B", label: "Make the decision based on information, zone and timing.", scores: [5, 2, 2, 3, 5, 1, 3, 5] },
    { key: "C", label: "Let the aggressive players decide.", scores: [1, 5, 4, 4, 0, 0, 1, 1] },
    { key: "D", label: "Try to create a compromise.", scores: [4, 2, 2, 2, 3, 1, 5, 4] },
  ]),
  C("Q89", 11, SEC[11], "Your previous call was clearly wrong.", [
    { key: "A", label: "Ignore it and continue.", scores: [0, 1, 1, 1, 0, 0, 0, 1] },
    { key: "B", label: "Immediately admit it and make a new plan.", scores: [5, 2, 2, 2, 4, 1, 4, 5] },
    { key: "C", label: "Blame the player who executed it poorly.", scores: [0, 2, 3, 2, 0, 0, 0, 0] },
    { key: "D", label: "Continue the original plan to avoid confusion.", scores: [1, 2, 2, 1, 1, 0, 1, 2] },
  ]),
  C("Q90", 11, SEC[11], "Your team has no information in a late zone.", [
    { key: "A", label: "Take a random fight to reveal teams.", scores: [1, 5, 5, 3, 1, 0, 1, 2] },
    { key: "B", label: "Gather information before moving.", scores: [5, 1, 1, 4, 5, 2, 3, 5] },
    { key: "C", label: "Move toward the center immediately.", scores: [3, 3, 2, 2, 2, 0, 3, 4] },
    { key: "D", label: "Hold your position and let others reveal themselves.", scores: [4, 1, 1, 2, 3, 1, 4, 5] },
  ]),
  S("Q91", 11, SEC[11], "Rate your ability to make decisions under pressure.", ["IGL", "ENT", "FRG", "FLK"]),
  S("Q92", 11, SEC[11], "Rate your understanding of rotation timing.", ["IGL", "SCT", "ANK"]),
  S("Q93", 11, SEC[11], "Rate your understanding of zone priority.", ["IGL", "SCT", "ANK"]),
  S("Q94", 11, SEC[11], "Rate your ability to coordinate four players simultaneously.", ["IGL"]),
  S("Q95", 11, SEC[11], "Rate your ability to adapt a plan after unexpected information.", ["IGL", "SCT", "FLK"]),
  S("Q96", 11, SEC[11], "Rate your ability to communicate short, clear calls during chaos.", ["IGL", "SUP", "SCT"]),

  // —— Section 12 ——
  C("Q97", 12, SEC[12], "Your teammate spots an enemy. What information is most useful?", [
    { key: "A", label: "“Enemy!”", scores: [1, 1, 1, 1, 1, 0, 1, 1] },
    { key: "B", label: "Exact direction + distance + position.", scores: [5, 2, 2, 3, 5, 2, 4, 5] },
    { key: "C", label: "“They’re pushing!”", scores: [3, 4, 3, 3, 4, 1, 3, 3] },
    { key: "D", label: "“I see someone.”", scores: [2, 1, 1, 1, 2, 1, 1, 2] },
  ]),
  C("Q98", 12, SEC[12], "Two teammates are talking during a fight and important information is being missed.", [
    { key: "A", label: "Talk louder.", scores: [1, 2, 2, 2, 0, 0, 1, 1] },
    { key: "B", label: "Stop speaking and listen.", scores: [4, 1, 2, 2, 4, 1, 4, 5] },
    { key: "C", label: "Give only critical information.", scores: [5, 3, 3, 3, 5, 1, 5, 4] },
    { key: "D", label: "Tell everyone to be quiet.", scores: [4, 2, 2, 2, 3, 1, 4, 4] },
  ]),
  C("Q99", 12, SEC[12], "Your teammate is making a mistake during a fight.", [
    { key: "A", label: "Criticize immediately.", scores: [0, 1, 1, 1, 0, 0, 0, 0] },
    { key: "B", label: "Give concise information that helps fix it.", scores: [5, 3, 4, 3, 5, 1, 5, 5] },
    { key: "C", label: "Ignore it.", scores: [1, 1, 1, 1, 1, 0, 1, 1] },
    { key: "D", label: "Wait until after the fight.", scores: [3, 1, 2, 1, 2, 1, 4, 4] },
  ]),
  S("Q100", 12, SEC[12], "Rate your ability to communicate while actively fighting.", ["ENT", "FRG", "IGL", "SCT"]),
  S("Q101", 12, SEC[12], "Rate your callout precision.", ["IGL", "SCT", "SUP", "ANK"]),
  S("Q102", 12, SEC[12], "Rate your ability to remain calm on comms.", ["IGL", "SUP", "SCT", "ANK"]),
  S("Q103", 12, SEC[12], "Rate your ability to listen while under pressure.", ["IGL", "ENT", "FRG", "SUP"]),
  S("Q104", 12, SEC[12], "Rate your ability to tell teammates important information without flooding comms.", ["IGL", "SCT", "SUP"]),

  // —— Section 13 ——
  C("Q105", 13, SEC[13], "You die early because of your own mistake.", [
    { key: "A", label: "Become more aggressive next game.", scores: [0, 3, 3, 3, 0, 0, 0, 1] },
    { key: "B", label: "Analyze what happened and adjust.", scores: [5, 3, 4, 4, 4, 2, 4, 5] },
    { key: "C", label: "Blame the call.", scores: [0, 0, 1, 1, 0, 0, 0, 0] },
    { key: "D", label: "Stay quiet and continue.", scores: [2, 1, 2, 2, 2, 1, 4, 4] },
  ]),
  C("Q106", 13, SEC[13], "Your teammate makes a major mistake.", [
    { key: "A", label: "Criticize him immediately.", scores: [0, 0, 1, 1, 0, 0, 0, 0] },
    { key: "B", label: "Help him understand the mistake after the fight.", scores: [5, 2, 3, 2, 4, 1, 5, 5] },
    { key: "C", label: "Ignore it.", scores: [1, 1, 1, 1, 1, 0, 2, 2] },
    { key: "D", label: "Change your own play to compensate.", scores: [4, 3, 4, 3, 3, 1, 5, 5] },
  ]),
  C("Q107", 13, SEC[13], "Your team is losing badly in a tournament.", [
    { key: "A", label: "Start taking more fights for kills.", scores: [1, 5, 5, 4, 0, 0, 1, 1] },
    { key: "B", label: "Stay disciplined and adapt the strategy.", scores: [5, 2, 3, 3, 5, 1, 5, 5] },
    { key: "C", label: "Become extremely passive.", scores: [3, 1, 1, 1, 3, 1, 5, 5] },
    { key: "D", label: "Let each player play individually.", scores: [0, 4, 4, 5, 0, 0, 0, 1] },
  ]),
  C("Q108", 13, SEC[13], "Your preferred role isn’t needed for a tournament.", [
    { key: "A", label: "Refuse to change.", scores: [0, 1, 1, 1, 0, 0, 0, 0] },
    { key: "B", label: "Play whatever role benefits the team.", scores: [5, 4, 4, 4, 5, 3, 5, 5] },
    { key: "C", label: "Try to convince the team otherwise.", scores: [2, 2, 2, 2, 2, 1, 3, 3] },
    { key: "D", label: "Play the role but ignore its responsibilities.", scores: [0, 2, 2, 2, 0, 0, 1, 1] },
  ]),
  S("Q109", 13, SEC[13], "Rate your ability to accept criticism.", ["IGL", "ENT", "FRG", "FLK", "SCT", "SNR", "SUP", "ANK"]),
  S("Q110", 13, SEC[13], "Rate your ability to remain calm after consecutive losses.", ["IGL", "ENT", "FRG", "FLK", "SCT", "SNR", "SUP", "ANK"]),
  S("Q111", 13, SEC[13], "Rate your ability to put team success above personal statistics.", ["IGL", "SUP", "ANK", "SCT"]),
  S("Q112", 13, SEC[13], "Rate your ability to adapt your playstyle for the team.", ["IGL", "ENT", "FRG", "FLK", "SCT", "SUP", "ANK"]),
  S("Q113", 13, SEC[13], "Rate your ability to stay disciplined when you’re confident.", ["IGL", "ENT", "FRG", "FLK", "ANK"]),
  S("Q114", 13, SEC[13], "Rate your ability to stay mentally stable after making a major mistake.", ["IGL", "ENT", "FRG", "FLK", "SUP", "ANK"]),

  // —— Section 14 ——
  C("Q115", 14, SEC[14], "Final 3 teams. Your team has the strongest position but low information.", [
    { key: "A", label: "Push another team.", scores: [1, 5, 5, 3, 0, 0, 1, 2] },
    { key: "B", label: "Maintain position and gather information.", scores: [5, 1, 1, 2, 5, 2, 4, 5] },
    { key: "C", label: "Send one player to scout.", scores: [5, 1, 1, 4, 5, 2, 3, 5] },
    { key: "D", label: "Wait and force other teams to move first.", scores: [4, 1, 1, 2, 3, 1, 4, 5] },
  ]),
  C("Q116", 14, SEC[14], "Final zone is pulling away from your compound.", [
    { key: "A", label: "Leave immediately.", scores: [2, 3, 2, 2, 2, 0, 2, 2] },
    { key: "B", label: "Wait until you have information about enemy movement.", scores: [5, 1, 1, 3, 5, 2, 4, 5] },
    { key: "C", label: "Send a player to secure the next position.", scores: [5, 1, 1, 4, 5, 2, 3, 5] },
    { key: "D", label: "Take a fight to create space.", scores: [2, 5, 5, 4, 1, 0, 1, 2] },
  ]),
  C("Q117", 14, SEC[14], "You are the last alive against two enemies.", [
    { key: "A", label: "Fight immediately.", scores: [1, 5, 5, 3, 0, 0, 1, 1] },
    { key: "B", label: "Isolate one enemy.", scores: [3, 4, 5, 4, 1, 0, 1, 2] },
    { key: "C", label: "Disengage and reposition.", scores: [4, 2, 3, 4, 2, 1, 3, 5] },
    { key: "D", label: "Use sound/information to predict their positions.", scores: [5, 2, 3, 4, 5, 2, 2, 4] },
  ]),
  C("Q118", 14, SEC[14], "Your team is currently first in a tournament.", [
    { key: "A", label: "Play extremely aggressively to increase kills.", scores: [1, 5, 5, 4, 0, 0, 1, 1] },
    { key: "B", label: "Prioritize survival and favorable fights.", scores: [5, 1, 1, 2, 4, 1, 5, 5] },
    { key: "C", label: "Continue the normal strategy regardless of standings.", scores: [3, 2, 2, 2, 2, 1, 3, 3] },
    { key: "D", label: "Change strategy according to the point situation.", scores: [5, 2, 3, 3, 5, 1, 5, 5] },
  ]),
  C("Q119", 14, SEC[14], "Your team is behind in points with one match remaining.", [
    { key: "A", label: "Play for maximum kills regardless of survival.", scores: [1, 5, 5, 4, 0, 0, 1, 1] },
    { key: "B", label: "Calculate what result you actually need and adjust aggression accordingly.", scores: [5, 3, 4, 3, 5, 1, 5, 5] },
    { key: "C", label: "Play normally.", scores: [2, 2, 2, 2, 2, 1, 3, 3] },
    { key: "D", label: "Take an early fight and hope for the best.", scores: [1, 5, 4, 4, 1, 0, 1, 1] },
  ]),
  S("Q120", 14, SEC[14], "Rate your clutch ability.", ["ENT", "FRG", "FLK", "ANK"]),
  S("Q121", 14, SEC[14], "Rate your endgame decision-making.", ["IGL", "FRG", "SCT", "ANK"]),
  S("Q122", 14, SEC[14], "Rate your ability to perform under tournament pressure.", ["IGL", "ENT", "FRG", "FLK", "SNR", "SUP", "ANK"]),
  S("Q123", 14, SEC[14], "Rate your ability to make good decisions with incomplete information.", ["IGL", "FLK", "SCT", "ANK"]),
  S("Q124", 14, SEC[14], "Rate your ability to change strategy when the match situation changes.", ["IGL", "FLK", "SCT", "SUP", "ANK"]),
];

export type RoleScores = Record<RoleCode, number>;

export function emptyScores(): RoleScores {
  return { IGL: 0, ENT: 0, FRG: 0, FLK: 0, SCT: 0, SNR: 0, SUP: 0, ANK: 0 };
}

/** Max possible raw points per role (for percentage) */
export function computeMaxScores(): RoleScores {
  const max = emptyScores();
  for (const q of ROLE_QUESTIONS) {
    if (!q.scored) continue;
    if (q.kind === "scale") {
      const pts = SCALE_POINTS[5];
      for (const r of q.roles) max[r] += pts;
    } else if (q.kind === "choice") {
      for (let i = 0; i < ROLE_CODES.length; i++) {
        const best = Math.max(...q.options.map((o) => o.scores[i] ?? 0));
        max[ROLE_CODES[i]] += best;
      }
    }
  }
  return max;
}

export const MAX_ROLE_SCORES = computeMaxScores();

export type RoleProfile = {
  raw: RoleScores;
  pct: RoleScores;
  ranked: { code: RoleCode; pct: number; raw: number }[];
  primary: RoleCode;
  secondary: RoleCode;
  third: RoleCode;
  flex: RoleCode;
  differentiation: number;
  band: (pct: number) => string;
  identity: string;
};

export function interpretBand(pct: number): string {
  if (pct >= 90) return "Exceptional natural fit";
  if (pct >= 80) return "Excellent fit";
  if (pct >= 70) return "Strong fit";
  if (pct >= 60) return "Viable secondary";
  if (pct >= 50) return "Situational";
  return "Poor fit";
}

export function scoreRoleAssessment(
  answers: Record<string, unknown>,
): RoleProfile {
  const raw = emptyScores();

  for (const q of ROLE_QUESTIONS) {
    if (!q.scored) continue;
    const ans = answers[q.id];
    if (ans == null || ans === "") continue;

    if (q.kind === "scale") {
      const n = Number(ans);
      const pts = SCALE_POINTS[n] ?? 0;
      for (const r of q.roles) raw[r] += pts;
    } else if (q.kind === "choice") {
      const key = String(ans);
      const opt = q.options.find((o) => o.key === key);
      if (!opt) continue;
      ROLE_CODES.forEach((code, i) => {
        raw[code] += opt.scores[i] ?? 0;
      });
    }
  }

  const pct = emptyScores();
  for (const code of ROLE_CODES) {
    const m = MAX_ROLE_SCORES[code] || 1;
    pct[code] = Math.round((raw[code] / m) * 1000) / 10;
  }

  const ranked = ROLE_CODES.map((code) => ({
    code,
    pct: pct[code],
    raw: raw[code],
  })).sort((a, b) => b.pct - a.pct);

  const primary = ranked[0].code;
  const secondary = ranked[1].code;
  const third = ranked[2].code;
  const flex = ranked[3].code;
  const differentiation = Math.round((ranked[0].pct - ranked[1].pct) * 10) / 10;

  const identity = `Primary ${ROLE_META[primary].short} / Secondary ${ROLE_META[secondary].short} / Situational ${ROLE_META[third].short}`;

  return {
    raw,
    pct,
    ranked,
    primary,
    secondary,
    third,
    flex,
    differentiation,
    band: interpretBand,
    identity,
  };
}

export const ROLE_ASSESSMENT_META = {
  title: "PUBG Mobile Competitive Role Assessment",
  description:
    "Weekly role assessment — self-ability + scenario questions. Scoring is hidden. Results help find complementary roles (Stage 1 of lineup building).",
  questionCount: ROLE_QUESTIONS.length,
} as const;
