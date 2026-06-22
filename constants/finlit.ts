import { World } from '../types';

// --- Money identity ---------------------------------------------------------
// The whole game is a financial-literacy adventure: the score Henry earns IS
// his money. Packages are paychecks; the shop is where he spends; the daily run
// is his allowance. These shared bits keep the money language consistent.

export const COIN = '🪙';

// Short, kid-friendly money facts shown around the app (loading, landing).
export const MONEY_TIPS: string[] = [
    "Saving a little every day adds up to a lot!",
    "A NEED is something you must have. A WANT is something nice to have.",
    "Before you buy, ask: do I really need this?",
    "Money you don't spend today, you can save for something bigger.",
    "A budget is just a plan for your money.",
    "Earning money means doing work that helps others.",
    "Patient savers can afford bigger things later.",
    "Banks pay you extra (interest) for saving with them.",
    "Spreading your money around keeps it safer.",
    "Sharing some of your money helps other people.",
    "Compare prices before you spend — the cheaper one leaves more to save.",
    "Every coin you earn is a coin you worked for.",
];

// Pick a stable "tip of the day" so it doesn't flicker within a session.
export const getMoneyTipOfDay = (): string => {
    const day = Math.floor(Date.now() / 86400000);
    return MONEY_TIPS[day % MONEY_TIPS.length];
};

// Format a coin amount with the coin glyph, e.g. "1,250 🪙".
export const formatCoins = (n: number): string => `${Math.max(0, Math.round(n)).toLocaleString()}`;

// Coin amount WITH the leading coin glyph, e.g. "🪙 1,250". Single source of
// truth for plain-text currency readouts so the glyph + format stay identical
// across every surface. (For readouts that animate via <AnimatedNumber>, keep
// the animation and prefix the COIN constant instead of a hardcoded '🪙'.)
export const formatCoinsWithGlyph = (n: number): string => `${COIN} ${formatCoins(n)}`;

// --- Savings goal ladder ------------------------------------------------------
// The app's namesake concept as a meta-loop: an escalating goal shown as a
// piggy-bank meter on the world map. The TIER ratchets up by the highest balance
// ever reached (peak) so spending never re-locks a goal you passed; the FILL
// reflects current coins kept (so spending visibly empties the piggy — the
// save-vs-spend tradeoff made tangible).
export const SAVINGS_GOALS = [200, 500, 1000, 2500, 5000];

export const currentSavingsGoal = (peak: number): number => {
    for (const g of SAVINGS_GOALS) { if (peak < g) return g; }
    return SAVINGS_GOALS[SAVINGS_GOALS.length - 1];
};

// --- Savings interest -------------------------------------------------------
// Coins you KEEP grow a little every day — this is interest, the "money can
// grow" lesson (Money Mountain lesson 7). Keeping a daily streak boosts the
// rate, so saving + good habits compound together.
export const DAILY_INTEREST_RATE = 0.03;     // 3% of your savings per day
export const STREAK_BONUS_RATE = 0.01;       // +1% per streak day...
export const MAX_STREAK_BONUS_DAYS = 5;      // ...up to +5%
export const MAX_DAILY_INTEREST = 100;       // cap so a big balance can't print money

// UTC day stamp, matching the format the daily challenge uses ("YYYY-M-D").
export const todayStamp = (): string => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
};

export interface InterestResult {
    base: number;        // interest from the balance alone
    streakBonus: number; // extra from the daily streak
    total: number;       // coins actually paid (capped)
    streakDays: number;  // streak days that counted toward the bonus
    rateLabel: string;   // e.g. "5%" — the effective rate, for display
}

// The effective daily interest rate for a given streak, as a "6%" style label.
export const interestRateLabel = (streak: number): string => {
    const streakDays = Math.min(Math.max(0, streak), MAX_STREAK_BONUS_DAYS);
    const effRate = DAILY_INTEREST_RATE + STREAK_BONUS_RATE * streakDays;
    return `${Math.round(effRate * 100)}%`;
};

export const computeDailyInterest = (balance: number, streak: number): InterestResult => {
    const streakDays = Math.min(Math.max(0, streak), MAX_STREAK_BONUS_DAYS);
    const effRate = DAILY_INTEREST_RATE + STREAK_BONUS_RATE * streakDays;
    if (balance <= 0) {
        return { base: 0, streakBonus: 0, total: 0, streakDays, rateLabel: `${Math.round(effRate * 100)}%` };
    }
    const base = Math.floor(balance * DAILY_INTEREST_RATE);
    const streakBonus = Math.floor(balance * STREAK_BONUS_RATE * streakDays);
    const total = Math.min(MAX_DAILY_INTEREST, base + streakBonus);
    return { base, streakBonus, total, streakDays, rateLabel: `${Math.round(effRate * 100)}%` };
};


// Money Mountain — a financial-literacy world for kids. It lives in its own
// level-index namespace so it can sit beside the campaign without touching
// campaign indices, daily seeds, custom levels (10000+), or co-op.
export const MONEY_LEVEL_BASE = 20000;

export interface MoneyLesson {
    title: string;
    emoji: string;
    // 2-3 short, kid-friendly sentences shown before the level starts.
    lesson: string[];
    // One line connecting the concept to the puzzle the kid is about to play.
    mission: string;
    quiz: {
        question: string;
        choices: string[];
        answerIndex: number;
        explanation: string;
    };
}

export const MONEY_LESSONS: MoneyLesson[] = [
    {
        title: 'Working for It',
        emoji: '💼',
        lesson: [
            "Money doesn't grow on trees — people earn it by doing work.",
            'When you help someone or do a job, you earn money as a thank-you.',
            'In this game, every package you deliver earns you coins!',
        ],
        mission: 'Deliver every package — that’s you earning your coins!',
        quiz: {
            question: 'How do most people get money?',
            choices: [
                'It falls from the sky',
                'They earn it by working',
                'The TV gives it to them',
            ],
            answerIndex: 1,
            explanation: 'People do jobs — like teaching, building, or baking — and get paid for their work.',
        },
    },
    {
        title: 'Save It Up',
        emoji: '🐷',
        lesson: [
            'Saving means keeping some of your money instead of spending it all.',
            'Little by little, saved money grows into a big pile!',
        ],
        mission: 'Grab every coin on the map — a good saver leaves nothing behind!',
        quiz: {
            question: 'If you save 1 coin every day, what happens?',
            choices: [
                'The coins slowly add up to a lot',
                'The coins disappear',
                'Nothing at all',
            ],
            answerIndex: 0,
            explanation: 'Small savings add up! One coin a day becomes 365 coins in a year.',
        },
    },
    {
        title: 'Needs Come First',
        emoji: '🍎',
        lesson: [
            'A NEED is something you must have — like food, a home, and warm clothes.',
            'A WANT is something fun to have — like toys and candy.',
            'Smart money heroes pay for needs first, then save for wants.',
        ],
        mission: 'Grab what you NEED — the keys — before chasing the shiny extras!',
        quiz: {
            question: 'Which one is a NEED?',
            choices: [
                'A new video game',
                'Food for dinner',
                'A balloon',
            ],
            answerIndex: 1,
            explanation: 'You must have food to live. Games and balloons are fun wants.',
        },
    },
    {
        title: 'Think Before You Spend',
        emoji: '🛒',
        lesson: [
            'Before you buy something, stop and think: do I really want this?',
            'Money spent on one thing can’t be spent on something else.',
            'Comparing your choices helps you pick the best one.',
        ],
        mission: 'Study the whole map before you move — the first path isn’t always the best one!',
        quiz: {
            question: 'You have 5 coins. A toy costs 5 and a book costs 5. What is true?',
            choices: [
                'You can buy both',
                'You can pick only one',
                'You can buy three toys',
            ],
            answerIndex: 1,
            explanation: 'Money spent on one thing can’t be spent again — choosing is part of spending!',
        },
    },
    {
        title: 'The Move Budget',
        emoji: '🗺️',
        lesson: [
            'A budget is a plan for your money: so much for this, so much for that.',
            'With a plan, your money doesn’t run out before the important stuff.',
        ],
        mission: 'You have a MOVE BUDGET this time! Finish before your moves run out.',
        quiz: {
            question: 'What is a budget?',
            choices: [
                'A plan for how to use your money',
                'A kind of candy',
                'A place to hide coins',
            ],
            answerIndex: 0,
            explanation: 'A budget is a plan that makes sure your money goes where you need it most.',
        },
    },
    {
        title: 'Patience Pays',
        emoji: '🌱',
        lesson: [
            'Sometimes waiting is the smartest money move.',
            'If you skip the small treat today, you can afford something bigger later.',
        ],
        mission: 'Don’t rush! Plan the careful route that collects MORE — slow and smart wins.',
        quiz: {
            question: 'You can have 1 candy now, or 3 candies if you wait until tomorrow. What is the patient choice?',
            choices: [
                'Take 1 candy now',
                'Wait and get 3 candies',
                'Take zero candies',
            ],
            answerIndex: 1,
            explanation: 'Waiting is hard, but patient savers end up with more!',
        },
    },
    {
        title: 'Money Can Grow',
        emoji: '🌳',
        lesson: [
            'When you keep savings in a bank, the bank adds a little extra. That extra is called interest.',
            'Your money makes more money — like a seed growing into a tree!',
        ],
        mission: 'The coins are your interest today — collect every bonus on top of finishing!',
        quiz: {
            question: 'What is interest?',
            choices: [
                'Extra money the bank adds to your savings',
                'A type of homework',
                'Money you lose',
            ],
            answerIndex: 0,
            explanation: 'Banks pay you a little extra for saving with them — your money grows while you wait!',
        },
    },
    {
        title: 'Borrow Carefully',
        emoji: '🤝',
        lesson: [
            'Borrowing means using someone else’s money and promising to pay it back.',
            'You usually pay back a little MORE than you borrowed — so borrow carefully!',
        ],
        mission: 'Keys are like loans: they open doors, but fetching them costs extra steps!',
        quiz: {
            question: 'If you borrow 10 coins, how many might you have to pay back?',
            choices: [
                '0 coins',
                '11 coins',
                '2 coins',
            ],
            answerIndex: 1,
            explanation: 'Borrowed money usually costs a little extra. That extra cost is why borrowing needs care.',
        },
    },
    {
        title: 'Eggs in Many Baskets',
        emoji: '🧺',
        lesson: [
            'Putting all your money in one place is risky — if it breaks, you lose everything.',
            'Spreading your money across different places keeps it safer.',
        ],
        mission: 'Hazards everywhere! Pick a route that doesn’t risk everything on one dangerous lane.',
        quiz: {
            question: 'Why spread your money into different places?',
            choices: [
                'If one fails, you don’t lose it all',
                'It looks pretty',
                'Coins need fresh air',
            ],
            answerIndex: 0,
            explanation: 'When your money is spread out, one bad surprise can’t take all of it away.',
        },
    },
    {
        title: 'Share and Shine',
        emoji: '🎁',
        lesson: [
            'Money is a tool: you can spend it, save it, grow it — and share it.',
            'Giving some to help others is one of the best things money can do.',
            'You’ve learned all 10 money skills. Time for the final climb!',
        ],
        mission: 'Use everything you’ve learned — plan ahead, mind your moves, and finish the final climb!',
        quiz: {
            question: 'What can money do?',
            choices: [
                'Only buy toys',
                'Be saved, spent, grown, and shared',
                'Nothing at all',
            ],
            answerIndex: 1,
            explanation: 'Money is a tool with many jobs — and sharing it is a superpower!',
        },
    },
];

// Each lesson generates at a fixed, gentle campaign-equivalent difficulty
// (world 1 → world 4 territory) no matter how far the player is in the
// campaign — this is a learning track, not an endgame gauntlet.
export const MONEY_LESSON_DIFFICULTY: number[] = [10, 13, 16, 19, 22, 25, 29, 33, 37, 41];

export const isMoneyLevel = (levelIndex: number): boolean =>
    levelIndex >= MONEY_LEVEL_BASE && levelIndex < MONEY_LEVEL_BASE + MONEY_LESSONS.length;

export const moneyLessonIndex = (levelIndex: number): number => levelIndex - MONEY_LEVEL_BASE;

// Coins awarded the first time a kid clears a lesson level (replaces the old
// quiz bonus — now you earn it by DOING the lesson, not answering a popup).
export const MONEY_LESSON_BONUS = 100;

// "Learn by doing": a few lessons embody an efficiency/budget constraint as a
// move limit, so finishing under it IS the lesson. Others return undefined and
// rely on the level's inherent rules (you must collect every coin = saving;
// keys gate the path = needs/loans; hazards = risk).
export const moneyLessonObjective = (
    lessonIdx: number,
    par: number,
): { type: 'max_moves'; maxMoves: number } | undefined => {
    switch (lessonIdx) {
        case 3: return { type: 'max_moves', maxMoves: par + 1 }; // Think Before You Spend
        case 4: return { type: 'max_moves', maxMoves: par + 2 }; // The Move Budget
        case 9: return { type: 'max_moves', maxMoves: par + 2 }; // Share & Shine (mastery)
        default: return undefined;
    }
};

// One-line takeaway shown (non-blocking) after the lesson is completed.
export const moneyLessonTakeaway = (lessonIdx: number): string =>
    MONEY_LESSONS[lessonIdx]?.quiz.explanation || '';

export const MONEY_WORLD: World = {
    name: 'Money Mountain',
    theme: 'sunrise',
    levels: MONEY_LESSONS.map((_, i) => MONEY_LEVEL_BASE + i),
    mapPosition: { x: 50, y: 50 },
    size: 48,
    gimmickTitle: 'Learn & Earn',
    gimmickDescription: 'Ten short money lessons — earn bonus coins by acing each quiz.',
    introBanner: 'New world: learn real money skills and earn bonus coins.',
};
