
import { CellType } from '../types';

export const MILA_DIALOGUES: { taunt: string; reactions: string[] }[] = [
    { taunt: "That route is a bad investment, Captain.", reactions: ["High risk, high reward.", "Diversifying now.", "My portfolio disagrees."] },
    { taunt: "You're one move from bankruptcy.", reactions: ["Budget adjusted.", "I have savings.", "That never happened."] },
    { taunt: "Short route = low cost. Basic economics.", reactions: ["Cutting costs now.", "Frugal mode on.", "Efficiency pays."] },
    { taunt: "That package won't deliver itself. No work, no pay.", reactions: ["Clocking in.", "Payday incoming.", "Fine, FINE."] },
    { taunt: "You skipped a coin. Who skips free money?", reactions: ["Going back.", "It was a want, not a need.", "Okay, okay."] },
    { taunt: "Don't put all your eggs on that fragile tile.", reactions: ["Eggs relocated.", "One step, one chance.", "Basket secured."] },
    { taunt: "If this explodes, insurance won't cover it.", reactions: ["Reading the fine print.", "Risk managed.", "Premium's too high anyway."] },
    { taunt: "Par is the budget. Stay under it.", reactions: ["Trimming expenses.", "Under budget, always.", "Challenge accepted."] },
    { taunt: "Spend moves like money: only on purpose.", reactions: ["Every step audited.", "Precision spending.", "I live for this."] },
    { taunt: "Patience beats panic. Ask any saver.", reactions: ["Compound interest, baby.", "Slow money, smart money.", "Waiting like a pro."] },
    { taunt: "The exit is free. The packages pay the bills.", reactions: ["Bills first.", "No shortcuts.", "Full payday run."] },
    { taunt: "Your hat says rich. Your route says broke.", reactions: ["Style is an asset.", "Net worth loading.", "Watch this."] }
];

export const SLEEPING_TEXTS: string[] = [
  'Zzzz... counting coins...',
  'Dreaming of payday...',
  'My savings nap in the bank...',
  'Snore... interest still growing...',
  'Resting is free...',
  'Wake me when it compounds...',
  'Counting savings, not sheep...',
];

export const LEVEL_COMPLETE_GREETINGS: string[] = [
    "PAYDAY!",
    "JACKPOT!",
    "CHA-CHING!",
    "PROFIT!",
    "BONUS!",
    "GOLDEN!",
    "MINTED!",
    "TYCOON!",
    "BANKED!",
    "WEALTHY!",
    "RICH!",
    "DIVIDEND!",
    "SAVVY!",
    "PREMIUM!",
    "VALUE!"
];

export const SUCCESS_MESSAGES: string[] = [
    "Barely broke even!",
    "Phew, no losses!",
    "Close call!",
    "Messy budget...",
    "Not bad.",
    "Solid earnings.",
    "Okay!",
    "Decent profit.",
    "Great investment!",
    "Smooth saver!",
    "Cha-ching!",
    "Money smart!",
    "PERFECT BUDGET!",
    "JACKPOT!",
    "FLAWLESS FINANCE!",
    "MONEY GENIUS!",
    "Easy earnings!",
    "Nailed the budget!",
    "Like a banker!"
];

export const TUTORIAL_SUCCESS_MESSAGES: string[] = [
    "Easy earnings!",
    "Nailed it!",
    "Like a banker!",
];

export const LIFE_LOSS_MESSAGES: string[] = [
    "OUCH! MY WALLET!",
    "COSTLY!",
    "WHOOPS!",
    "BAD INVESTMENT!",
    "BUDGET BLOWN!",
    "OOF!",
    "MONEY PIT!",
    "EXPENSIVE!",
    "INSURANCE!",
    "NO REFUNDS!",
    "OVERDRAFT!"
];

export const TUTORIAL_HENRY_THOUGHTS: string[] = [
    "Tap arrows to plan a path — planning is free!",
    "Hit PLAY to put the plan to work.",
    "Every package is a paycheck. Collect them all!",
    "Short routes cost less and earn more.",
    "Think first, spend moves second. Let's earn!"
];

export const TUTORIAL_MILA_MESSAGES: string[] = [
    "Start simple: one clean line. Budget basics.",
    "Run it, then optimize. Even savers iterate.",
    "Earn first (packages), exit second.",
    "Fewer moves, fatter wallet.",
    "Now show me a perfect solve. Make it pay."
];

export const SHOWCASE_WORLD_THOUGHTS: Record<number, string> = {
    6: "Boost tiles are like bonuses — a smart detour that pays extra.",
    20: "Keys open gates. Invest in the key first, then collect the payoff.",
    40: "Teleporters are like loans: great deal, but plan the payback trip.",
    60: "Trap tiles are scams. If a shortcut looks too good, it probably is.",
    80: "Fragile floor breaks behind me. Spend each step like my last coin.",
    100: "Two keys, two gates. Pay my debts in the right order.",
    120: "Score targets: finishing isn't enough — I have to hit the earnings goal.",
    140: "Combo missions stack like bills. Budget every objective.",
    160: "Bomb lanes leave no slack. Big risks need a plan, not luck.",
    180: "Final exam: every money skill at once. Plan the whole portfolio."
};

export const SHOWCASE_MILA_DIALOGUES: Record<number, { taunt: string; reactions: string[] }> = {
    6: { taunt: "Bonus on the side path. That's free money, Captain.", reactions: ["Claiming my bonus."] },
    20: { taunt: "Gate's locked because you skipped the key. Pay first.", reactions: ["Key first. Payoff second."] },
    40: { taunt: "That teleporter is a loan, not a gift. Plan the payback.", reactions: ["Repayment route ready."] },
    60: { taunt: "Trap tile ahead. Classic get-rich-quick scam.", reactions: ["Not falling for it."] },
    80: { taunt: "Floor breaks behind you. No refunds on steps.", reactions: ["Spending steps wisely."] },
    100: { taunt: "Two locks, two keys. Wrong order bankrupts the run.", reactions: ["Debts sorted."] },
    120: { taunt: "You need the score, not just the exit. Hit the target.", reactions: ["Collecting every coin."] },
    140: { taunt: "Combo objectives. A sloppy budget fails twice.", reactions: ["Audited and ready."] },
    160: { taunt: "Bomb gauntlet. Totally uninsurable. Thread carefully.", reactions: ["Risk assessed."] },
    180: { taunt: "Final exam. Every money skill wants a mistake.", reactions: ["None for sale."] },
};

export const THOUGHT_BUBBLE_TEXTS: string[] = [
    "Route first. Riches later.",
    "Par is my budget. No overspending.",
    "Every move costs. Make them count.",
    "Saving moves is saving money.",
    "Free coins don't wait forever.",
    "No impulse moves today.",
    "Is that tile a need or a want?",
    "Fragile floor: spend once, no refunds.",
    "That bomb is NOT in my budget.",
    "Small map, big savings.",
    "Each step should earn its keep.",
    "If it looks like free money, check twice.",
    "Collect. Count. Cash out.",
    "Future me wants a fatter wallet.",
    "Thinking in coins now.",
    "I refuse to lose money to geometry.",
    "A good plan pays for itself.",
    "Time bonus is calling my name.",
    "Waste not, want not.",
    "I can do this cheaper.",
    "Bargain-route radar: online.",
    "This run is almost profitable.",
    "Earned, not lucky.",
    "One more tweak and it's payday.",
    "Confidence level: fully funded."
];

export const ELEMENT_HINTS: Partial<Record<CellType, string>> = {
    [CellType.Bomb]: "PROXIMITY MINE: Explodes on contact. Not covered by insurance — keep distance.",
    [CellType.Hole]: "VOID CHASM: Infinite drop. Falling in costs you everything.",
    [CellType.CrumblingFloor]: "FRAGILE TILE: One step only. Spend it wisely — no refunds.",
    [CellType.Teleporter_A]: "TELEPORTER: Warp to the matching pad. Plan the return trip before you borrow it.",
    [CellType.Teleporter_C]: "TELEPORTER: Warp to the matching pad. Plan the return trip before you borrow it.",
    [CellType.Teleporter_E]: "TELEPORTER: Warp to the matching pad. Plan the return trip before you borrow it.",
    [CellType.ForceField]: "FORCEFIELD: Locked until Key is collected. Pay first, pass later.",
    [CellType.ForceField_Blue]: "FORCEFIELD: Locked until Blue Key is collected. Pay first, pass later.",
    [CellType.ForceField_Red]: "FORCEFIELD: Locked until Red Key is collected. Pay first, pass later.",
    [CellType.ForceField_Purple]: "FORCEFIELD: Locked until Purple Key is collected. Pay first, pass later.",
    [CellType.ForceField_Orange]: "FORCEFIELD: Locked until Orange Key is collected. Pay first, pass later.",
    [CellType.ForceField_Cyan]: "FORCEFIELD: Locked until Cyan Key is collected. Pay first, pass later.",
    [CellType.PhaseShifter]: "PHASE SHIFTER: Jump over one tile. A premium move — spend it well.",
    [CellType.Package_AutoSolver]: "AUTO-SOLVER: Recharges your solving CPU. Free help — never skip free help."
};
