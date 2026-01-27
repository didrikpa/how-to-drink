import type { ContractTemplate, ContractCategory } from '../../types/contracts';

// CATEGORY A: BEHAVIOR TRAPS (30)
const behaviorTraps: ContractTemplate[] = [
  { id: 'bt-1', category: 'behavior-trap', visibleText: 'If anyone swears, they drink 1', hiddenClause: 'Doubles if it\'s accidental', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'swear' },
  { id: 'bt-2', category: 'behavior-trap', visibleText: 'If anyone laughs out loud, 1 sip', hiddenClause: 'First laugh counts double', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'laugh' },
  { id: 'bt-3', category: 'behavior-trap', visibleText: 'If anyone checks their phone, 2 sips', hiddenClause: 'Scrolling adds +1', baseSips: 2, hiddenSips: 1, targetType: 'trigger', triggerWord: 'phone' },
  { id: 'bt-4', category: 'behavior-trap', visibleText: 'If anyone stands up, 1 sip', hiddenClause: 'Unless they announce it first', baseSips: 1, hiddenSips: 0, targetType: 'trigger', triggerWord: 'stand' },
  { id: 'bt-5', category: 'behavior-trap', visibleText: 'If anyone says "bro", 1 sip', hiddenClause: 'Plural counts twice', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'bro' },
  { id: 'bt-6', category: 'behavior-trap', visibleText: 'If anyone interrupts someone, 1 sip', hiddenClause: 'Interruption during rules = +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'interrupt' },
  { id: 'bt-7', category: 'behavior-trap', visibleText: 'If anyone sings, 2 sips', hiddenClause: 'Humming counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger', triggerWord: 'sing' },
  { id: 'bt-8', category: 'behavior-trap', visibleText: 'If anyone claps, 1 sip', hiddenClause: 'Slow clap = +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'clap' },
  { id: 'bt-9', category: 'behavior-trap', visibleText: 'If anyone spills a drink, 2 sips', hiddenClause: 'Intentional spill counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger', triggerWord: 'spill' },
  { id: 'bt-10', category: 'behavior-trap', visibleText: 'If anyone yawns, 1 sip', hiddenClause: 'Fake yawn = +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'yawn' },
  { id: 'bt-11', category: 'behavior-trap', visibleText: 'If anyone says a player\'s name, 1 sip', hiddenClause: 'Nickname counts', baseSips: 1, hiddenSips: 0, targetType: 'trigger', triggerWord: 'name' },
  { id: 'bt-12', category: 'behavior-trap', visibleText: 'If anyone says "what?", 1 sip', hiddenClause: 'Repetition stacks', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'what' },
  { id: 'bt-13', category: 'behavior-trap', visibleText: 'If anyone looks at the timer, 1 sip', hiddenClause: 'Asking time = +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'timer' },
  { id: 'bt-14', category: 'behavior-trap', visibleText: 'If anyone sighs loudly, 1 sip', hiddenClause: 'Eye roll adds +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'sigh' },
  { id: 'bt-15', category: 'behavior-trap', visibleText: 'If anyone drops something, 1 sip', hiddenClause: 'Phones double it', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'drop' },
  { id: 'bt-16', category: 'behavior-trap', visibleText: 'If anyone whistles, 2 sips', hiddenClause: 'Accidental mouth noises count', baseSips: 2, hiddenSips: 0, targetType: 'trigger', triggerWord: 'whistle' },
  { id: 'bt-17', category: 'behavior-trap', visibleText: 'If anyone clears their throat, 1 sip', hiddenClause: 'Exaggerated = +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'throat' },
  { id: 'bt-18', category: 'behavior-trap', visibleText: 'If anyone says "okay", 1 sip', hiddenClause: 'Drawn-out "okayyy" doubles', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'okay' },
  { id: 'bt-19', category: 'behavior-trap', visibleText: 'If anyone says "actually", 1 sip', hiddenClause: 'Correcting someone adds +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'actually' },
  { id: 'bt-20', category: 'behavior-trap', visibleText: 'If anyone says "wait", 1 sip', hiddenClause: 'Panic tone = +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'wait' },
  { id: 'bt-21', category: 'behavior-trap', visibleText: 'If anyone touches their face, 1 sip', hiddenClause: 'Rubbing eyes doubles', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'face' },
  { id: 'bt-22', category: 'behavior-trap', visibleText: 'If anyone stretches, 1 sip', hiddenClause: 'Standing stretch = +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'stretch' },
  { id: 'bt-23', category: 'behavior-trap', visibleText: 'If anyone knocks on a surface, 1 sip', hiddenClause: 'Rhythm knocks count twice', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'knock' },
  { id: 'bt-24', category: 'behavior-trap', visibleText: 'If anyone says "cheers", 1 sip', hiddenClause: 'Clinking glasses adds +1', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'cheers' },
  { id: 'bt-25', category: 'behavior-trap', visibleText: 'If anyone asks a question, 1 sip', hiddenClause: 'Rhetorical still counts', baseSips: 1, hiddenSips: 0, targetType: 'trigger', triggerWord: 'question' },
  { id: 'bt-26', category: 'behavior-trap', visibleText: 'If anyone points at someone, 1 sip', hiddenClause: 'Finger guns double it', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'point' },
  { id: 'bt-27', category: 'behavior-trap', visibleText: 'If anyone whispers, 2 sips', hiddenClause: 'Stage whisper = +1', baseSips: 2, hiddenSips: 1, targetType: 'trigger', triggerWord: 'whisper' },
  { id: 'bt-28', category: 'behavior-trap', visibleText: 'If anyone mouths a word, 1 sip', hiddenClause: 'Mouthing "sorry" doubles', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'mouth' },
  { id: 'bt-29', category: 'behavior-trap', visibleText: 'If anyone reacts dramatically, 2 sips', hiddenClause: 'Fake drama still counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger', triggerWord: 'dramatic' },
  { id: 'bt-30', category: 'behavior-trap', visibleText: 'If anyone says "no way", 1 sip', hiddenClause: 'Disbelief tone doubles', baseSips: 1, hiddenSips: 1, targetType: 'trigger', triggerWord: 'noway' },
];

// CATEGORY B: PREDICTION CONTRACTS (25)
const predictions: ContractTemplate[] = [
  { id: 'pr-1', category: 'prediction', visibleText: 'I bet someone drinks before timer ends', hiddenClause: 'Signer drinks if wrong', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'pr-2', category: 'prediction', visibleText: 'I bet no one speaks for 10 seconds', hiddenClause: 'Laughter breaks silence', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'pr-3', category: 'prediction', visibleText: 'I bet someone checks their phone', hiddenClause: 'Signer must name who', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'pr-4', category: 'prediction', visibleText: 'I bet someone spills a drink', hiddenClause: 'Signer drinks if no spill', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'pr-5', category: 'prediction', visibleText: 'I bet someone swears', hiddenClause: 'First swearer drinks +1', baseSips: 2, hiddenSips: 1, targetType: 'trigger' },
  { id: 'pr-6', category: 'prediction', visibleText: 'I bet someone laughs', hiddenClause: 'Quiet laugh still counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-7', category: 'prediction', visibleText: 'I bet someone stands up', hiddenClause: 'Leaning half-stand counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-8', category: 'prediction', visibleText: 'I bet someone complains', hiddenClause: 'Sighing counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-9', category: 'prediction', visibleText: 'I bet someone asks a question', hiddenClause: 'Rhetorical counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-10', category: 'prediction', visibleText: 'I bet someone interrupts', hiddenClause: 'Overtalk counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-11', category: 'prediction', visibleText: 'I bet two people talk at once', hiddenClause: 'Overlap >1 sec only', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-12', category: 'prediction', visibleText: 'I bet someone drops something', hiddenClause: 'Intentional drop counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-13', category: 'prediction', visibleText: 'I bet someone says my name', hiddenClause: 'Nickname counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'pr-14', category: 'prediction', visibleText: 'I bet someone drinks early', hiddenClause: 'Sip = drink', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-15', category: 'prediction', visibleText: 'I bet someone checks the rules', hiddenClause: 'Asking counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-16', category: 'prediction', visibleText: 'I bet someone laughs at this contract', hiddenClause: 'Smirk counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-17', category: 'prediction', visibleText: 'I bet someone says "wait"', hiddenClause: 'Panic tone counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-18', category: 'prediction', visibleText: 'I bet someone reacts dramatically', hiddenClause: 'Sarcasm counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-19', category: 'prediction', visibleText: 'I bet someone yawns', hiddenClause: 'Fake yawn counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-20', category: 'prediction', visibleText: 'I bet someone says "okay"', hiddenClause: 'Drawn out doubles', baseSips: 2, hiddenSips: 1, targetType: 'trigger' },
  { id: 'pr-21', category: 'prediction', visibleText: 'I bet someone points', hiddenClause: 'Pointing with object counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-22', category: 'prediction', visibleText: 'I bet someone whispers', hiddenClause: 'Stage whisper counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-23', category: 'prediction', visibleText: 'I bet someone spills intentionally', hiddenClause: 'Intentional is allowed', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-24', category: 'prediction', visibleText: 'I bet someone sighs loudly', hiddenClause: 'Exaggerated counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'pr-25', category: 'prediction', visibleText: 'I bet someone laughs twice', hiddenClause: 'Same person counts', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
];

// CATEGORY C: DUELS & MINI-GAMES (25)
const duels: ContractTemplate[] = [
  { id: 'du-1', category: 'duel', visibleText: 'Rock-paper-scissors, loser drinks 2', hiddenClause: 'Tie adds +1 round', baseSips: 2, hiddenSips: 0, targetType: 'duel', duelType: 'rps' },
  { id: 'du-2', category: 'duel', visibleText: 'Staring contest, loser drinks 1', hiddenClause: 'Blinking fast counts', baseSips: 1, hiddenSips: 0, targetType: 'duel', duelType: 'stare' },
  { id: 'du-3', category: 'duel', visibleText: 'Thumb war, loser drinks 2', hiddenClause: 'Dominant thumb penalty', baseSips: 2, hiddenSips: 1, targetType: 'duel', duelType: 'thumbwar' },
  { id: 'du-4', category: 'duel', visibleText: 'Coin flip duel, loser drinks 1', hiddenClause: 'Best of 3', baseSips: 1, hiddenSips: 0, targetType: 'duel', duelType: 'coinflip' },
  { id: 'du-5', category: 'duel', visibleText: 'First to say "what?" drinks 1', hiddenClause: 'Reaction time matters', baseSips: 1, hiddenSips: 0, targetType: 'duel', duelType: 'firstword' },
  { id: 'du-6', category: 'duel', visibleText: 'First to laugh drinks 1', hiddenClause: 'Smirk counts', baseSips: 1, hiddenSips: 0, targetType: 'duel', duelType: 'firstlaugh' },
  { id: 'du-7', category: 'duel', visibleText: 'Last to raise hand drinks 1', hiddenClause: 'Hesitation counts', baseSips: 1, hiddenSips: 0, targetType: 'everyone', duelType: 'lasthand' },
  { id: 'du-8', category: 'duel', visibleText: 'First to look away drinks 1', hiddenClause: 'Blinking counts', baseSips: 1, hiddenSips: 0, targetType: 'duel', duelType: 'lookaway' },
  { id: 'du-9', category: 'duel', visibleText: 'First to drink loses', hiddenClause: 'Sip = drink', baseSips: 2, hiddenSips: 0, targetType: 'everyone', duelType: 'firstdrink' },
  { id: 'du-10', category: 'duel', visibleText: 'First to stand loses', hiddenClause: 'Half-stand counts', baseSips: 2, hiddenSips: 0, targetType: 'everyone', duelType: 'firststand' },
  { id: 'du-11', category: 'duel', visibleText: 'First to swear loses', hiddenClause: 'Accidental counts', baseSips: 2, hiddenSips: 0, targetType: 'everyone', duelType: 'firstswear' },
  { id: 'du-12', category: 'duel', visibleText: 'First to speak loses', hiddenClause: 'Noise counts', baseSips: 2, hiddenSips: 0, targetType: 'everyone', duelType: 'firstspeak' },
  { id: 'du-13', category: 'duel', visibleText: 'First to check phone loses', hiddenClause: 'Screen lighting counts', baseSips: 2, hiddenSips: 0, targetType: 'everyone', duelType: 'firstphone' },
  { id: 'du-14', category: 'duel', visibleText: 'Simon says (3 commands)', hiddenClause: 'Hesitation counts', baseSips: 2, hiddenSips: 0, targetType: 'everyone', duelType: 'simonsays' },
  { id: 'du-15', category: 'duel', visibleText: 'Rapid fire RPS (3 rounds)', hiddenClause: 'Misthrow counts', baseSips: 2, hiddenSips: 0, targetType: 'duel', duelType: 'rapidrps' },
  { id: 'du-16', category: 'duel', visibleText: 'Nose goes, loser drinks 1', hiddenClause: 'Late nose = +1', baseSips: 1, hiddenSips: 1, targetType: 'everyone', duelType: 'nosegoes' },
  { id: 'du-17', category: 'duel', visibleText: 'Coin balance challenge', hiddenClause: 'Retry adds +1', baseSips: 2, hiddenSips: 1, targetType: 'duel', duelType: 'coinbalance' },
  { id: 'du-18', category: 'duel', visibleText: 'Silent count to 5', hiddenClause: 'Laughter breaks it', baseSips: 1, hiddenSips: 0, targetType: 'everyone', duelType: 'silentcount' },
  { id: 'du-19', category: 'duel', visibleText: 'First to blink twice loses', hiddenClause: 'Rapid blink counts', baseSips: 1, hiddenSips: 0, targetType: 'duel', duelType: 'blink' },
  { id: 'du-20', category: 'duel', visibleText: 'Hand on head last loses', hiddenClause: 'Fake reach counts', baseSips: 1, hiddenSips: 0, targetType: 'everyone', duelType: 'handonhead' },
  { id: 'du-21', category: 'duel', visibleText: 'Categories: name 3 things', hiddenClause: 'Repeats count as fail', baseSips: 2, hiddenSips: 0, targetType: 'duel', duelType: 'categories' },
  { id: 'du-22', category: 'duel', visibleText: 'Rhyme battle', hiddenClause: 'Hesitation = loss', baseSips: 2, hiddenSips: 0, targetType: 'duel', duelType: 'rhyme' },
  { id: 'du-23', category: 'duel', visibleText: 'Word association', hiddenClause: '3 second limit', baseSips: 2, hiddenSips: 0, targetType: 'duel', duelType: 'wordassoc' },
  { id: 'du-24', category: 'duel', visibleText: 'Compliment battle', hiddenClause: 'Sarcasm = loss', baseSips: 1, hiddenSips: 0, targetType: 'duel', duelType: 'compliment' },
  { id: 'du-25', category: 'duel', visibleText: 'Truth or drink showdown', hiddenClause: 'Both can drink', baseSips: 2, hiddenSips: 0, targetType: 'duel', duelType: 'truthdrink' },
];

// CATEGORY D: SOCIAL & PERSUASION (30)
const social: ContractTemplate[] = [
  { id: 'so-1', category: 'social', visibleText: 'Convince someone to agree with you', hiddenClause: 'Sarcasm invalid', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-2', category: 'social', visibleText: 'Get someone to compliment you', hiddenClause: 'Forced compliments don\'t count', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-3', category: 'social', visibleText: 'Make someone laugh', hiddenClause: 'Laughing at yourself counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-4', category: 'social', visibleText: 'Get someone to drink', hiddenClause: 'Sip = drink', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-5', category: 'social', visibleText: 'Get someone to stand up', hiddenClause: 'Leaning doesn\'t count', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-6', category: 'social', visibleText: 'Get someone to say your name', hiddenClause: 'Nickname allowed', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-7', category: 'social', visibleText: 'Get someone to swear', hiddenClause: 'Baiting allowed', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-8', category: 'social', visibleText: 'Get someone to point at you', hiddenClause: 'Object pointing counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-9', category: 'social', visibleText: 'Get someone to whisper', hiddenClause: 'Stage whisper allowed', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-10', category: 'social', visibleText: 'Get someone to sigh', hiddenClause: 'Exaggerated counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-11', category: 'social', visibleText: 'Get someone to interrupt', hiddenClause: 'Overtalk counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-12', category: 'social', visibleText: 'Get someone to laugh twice', hiddenClause: 'Same person counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-13', category: 'social', visibleText: 'Get someone to clap', hiddenClause: 'Slow clap counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-14', category: 'social', visibleText: 'Get someone to yawn', hiddenClause: 'Fake counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-15', category: 'social', visibleText: 'Get someone to drink water', hiddenClause: 'Still counts', baseSips: 1, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-16', category: 'social', visibleText: 'Get someone to say "okay"', hiddenClause: 'Drawn out doubles', baseSips: 2, hiddenSips: 1, targetType: 'signer' },
  { id: 'so-17', category: 'social', visibleText: 'Get someone to react dramatically', hiddenClause: 'Sarcasm counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-18', category: 'social', visibleText: 'Get someone to check phone', hiddenClause: 'Lock screen counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-19', category: 'social', visibleText: 'Get someone to complain', hiddenClause: 'Sigh counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-20', category: 'social', visibleText: 'Get someone to spill a drop', hiddenClause: 'Intentional allowed', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-21', category: 'social', visibleText: 'Get someone to high-five you', hiddenClause: 'Left-hanging = they drink', baseSips: 2, hiddenSips: 1, targetType: 'signer' },
  { id: 'so-22', category: 'social', visibleText: 'Get someone to make eye contact for 5 sec', hiddenClause: 'Blinking allowed', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-23', category: 'social', visibleText: 'Get someone to tell a joke', hiddenClause: 'Bad jokes count', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-24', category: 'social', visibleText: 'Get someone to share a secret', hiddenClause: 'Fake secrets = +1 sip', baseSips: 2, hiddenSips: 1, targetType: 'signer' },
  { id: 'so-25', category: 'social', visibleText: 'Get someone to do a toast', hiddenClause: 'Must include a drink', baseSips: 1, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-26', category: 'social', visibleText: 'Get someone to admit something embarrassing', hiddenClause: 'Group judges validity', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-27', category: 'social', visibleText: 'Get someone to do an impression', hiddenClause: 'Bad impressions count', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-28', category: 'social', visibleText: 'Get someone to sing a line', hiddenClause: 'Humming counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-29', category: 'social', visibleText: 'Get someone to dance', hiddenClause: 'Head bobbing counts', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'so-30', category: 'social', visibleText: 'Get someone to say something nice about you', hiddenClause: 'Backhanded = +1 for them', baseSips: 2, hiddenSips: 1, targetType: 'signer' },
];

// CATEGORY E: MARKET & TAB CONTRACTS (20)
const market: ContractTemplate[] = [
  { id: 'ma-1', category: 'market', visibleText: 'This contract grows +1 sip each round', hiddenClause: 'Doubles after 3 rounds', baseSips: 1, hiddenSips: 2, targetType: 'signer' },
  { id: 'ma-2', category: 'market', visibleText: 'Buyout costs +1 sip', hiddenClause: 'Stacks per attempt', baseSips: 0, hiddenSips: 1, targetType: 'everyone' },
  { id: 'ma-3', category: 'market', visibleText: 'Add +2 to the Tab', hiddenClause: 'Doubles if last contract', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'ma-4', category: 'market', visibleText: 'Oldest contract matures next', hiddenClause: 'Youngest gains +1', baseSips: 0, hiddenSips: 1, targetType: 'everyone' },
  { id: 'ma-5', category: 'market', visibleText: 'Delay settlement one round', hiddenClause: 'Growth continues', baseSips: 0, hiddenSips: 1, targetType: 'signer' },
  { id: 'ma-6', category: 'market', visibleText: 'Swap two contracts', hiddenClause: 'Signer drinks 1', baseSips: 1, hiddenSips: 0, targetType: 'signer' },
  { id: 'ma-7', category: 'market', visibleText: 'Double next settlement', hiddenClause: 'Applies to signer too', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'ma-8', category: 'market', visibleText: 'Cancel newest contract', hiddenClause: 'Oldest gains +1', baseSips: 0, hiddenSips: 1, targetType: 'everyone' },
  { id: 'ma-9', category: 'market', visibleText: 'Freeze Tab for one round', hiddenClause: 'Next round +2', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'ma-10', category: 'market', visibleText: 'Force Audit next round', hiddenClause: 'Random clause revealed now', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'ma-11', category: 'market', visibleText: 'Transfer a contract to another player', hiddenClause: 'They can refuse (+1 sip)', baseSips: 0, hiddenSips: 1, targetType: 'specific' },
  { id: 'ma-12', category: 'market', visibleText: 'Split settlement between 2 players', hiddenClause: 'Rounding up', baseSips: 0, hiddenSips: 0, targetType: 'specific' },
  { id: 'ma-13', category: 'market', visibleText: 'Insurance: reduce next penalty by 2', hiddenClause: 'Only works once', baseSips: 0, hiddenSips: 0, targetType: 'signer' },
  { id: 'ma-14', category: 'market', visibleText: 'Compound interest: +1 sip per witness', hiddenClause: 'Max 3 extra', baseSips: 1, hiddenSips: 0, targetType: 'signer' },
  { id: 'ma-15', category: 'market', visibleText: 'Bankruptcy: clear all your contracts, drink 3', hiddenClause: 'Tokens lost too', baseSips: 3, hiddenSips: 0, targetType: 'signer' },
  { id: 'ma-16', category: 'market', visibleText: 'Merger: combine two contracts into one', hiddenClause: 'Both hidden clauses apply', baseSips: 0, hiddenSips: 0, targetType: 'signer' },
  { id: 'ma-17', category: 'market', visibleText: 'Short sell: bet against a contract', hiddenClause: 'If it settles, you drink double', baseSips: 0, hiddenSips: 0, targetType: 'signer' },
  { id: 'ma-18', category: 'market', visibleText: 'Dividend: everyone drinks 1, Tab +3', hiddenClause: 'Signer drinks 2', baseSips: 1, hiddenSips: 1, targetType: 'everyone' },
  { id: 'ma-19', category: 'market', visibleText: 'Hostile takeover: steal a signed contract', hiddenClause: 'Original signer drinks 1', baseSips: 0, hiddenSips: 1, targetType: 'signer' },
  { id: 'ma-20', category: 'market', visibleText: 'IPO: this contract can be signed by 2 people', hiddenClause: 'Both pay at settlement', baseSips: 1, hiddenSips: 0, targetType: 'everyone' },
];

// CATEGORY F: WILD CARDS (20)
const wildcards: ContractTemplate[] = [
  { id: 'wc-1', category: 'wild-card', visibleText: 'Everyone drinks 1', hiddenClause: 'Except signer', baseSips: 1, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-2', category: 'wild-card', visibleText: 'No one drinks', hiddenClause: 'Signer drinks 1', baseSips: 0, hiddenSips: 1, targetType: 'signer' },
  { id: 'wc-3', category: 'wild-card', visibleText: 'Assign 2 sips', hiddenClause: 'Cannot self-assign', baseSips: 2, hiddenSips: 0, targetType: 'specific' },
  { id: 'wc-4', category: 'wild-card', visibleText: 'Reverse who pays', hiddenClause: 'Signer immune', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-5', category: 'wild-card', visibleText: 'Double penalties this round', hiddenClause: 'Signer included', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-6', category: 'wild-card', visibleText: 'Cancel a clause', hiddenClause: 'Random instead', baseSips: 0, hiddenSips: 0, targetType: 'signer' },
  { id: 'wc-7', category: 'wild-card', visibleText: 'Reveal two hidden clauses', hiddenClause: 'One is yours', baseSips: 0, hiddenSips: 0, targetType: 'signer' },
  { id: 'wc-8', category: 'wild-card', visibleText: 'Add a house rule', hiddenClause: 'Expires next round', baseSips: 0, hiddenSips: 0, targetType: 'signer' },
  { id: 'wc-9', category: 'wild-card', visibleText: 'Steal a token', hiddenClause: 'From random player', baseSips: 0, hiddenSips: 0, targetType: 'signer' },
  { id: 'wc-10', category: 'wild-card', visibleText: 'Refresh contract pool', hiddenClause: 'Signer drinks 1', baseSips: 1, hiddenSips: 0, targetType: 'signer' },
  { id: 'wc-11', category: 'wild-card', visibleText: 'Force re-vote', hiddenClause: 'Tie = signer drinks', baseSips: 0, hiddenSips: 1, targetType: 'signer' },
  { id: 'wc-12', category: 'wild-card', visibleText: 'Pause timer', hiddenClause: 'Timer resumes doubled', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-13', category: 'wild-card', visibleText: 'Swap two players\' penalties', hiddenClause: 'Signer included', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-14', category: 'wild-card', visibleText: 'Nullify a buyout', hiddenClause: 'Costs 1 sip', baseSips: 1, hiddenSips: 0, targetType: 'signer' },
  { id: 'wc-15', category: 'wild-card', visibleText: 'Add a surprise settlement', hiddenClause: 'Signer included', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-16', category: 'wild-card', visibleText: 'Double Tab milestone', hiddenClause: 'Immediate effect', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-17', category: 'wild-card', visibleText: 'Skip next round', hiddenClause: 'Everyone drinks 1', baseSips: 1, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-18', category: 'wild-card', visibleText: 'Force silent round', hiddenClause: 'Laughter breaks it', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-19', category: 'wild-card', visibleText: 'Trigger mini-game', hiddenClause: 'Signer participates', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'wc-20', category: 'wild-card', visibleText: 'End the game early', hiddenClause: 'Final toast', baseSips: 1, hiddenSips: 0, targetType: 'everyone' },
];

// CATEGORY G: ENDGAME (10)
const endgame: ContractTemplate[] = [
  { id: 'eg-1', category: 'endgame', visibleText: 'Final duel', hiddenClause: 'Loser drinks +1', baseSips: 2, hiddenSips: 1, targetType: 'duel' },
  { id: 'eg-2', category: 'endgame', visibleText: 'Highest Tab contributor drinks', hiddenClause: 'Second highest too', baseSips: 2, hiddenSips: 2, targetType: 'everyone' },
  { id: 'eg-3', category: 'endgame', visibleText: 'Lowest Tab contributor assigns', hiddenClause: 'Must include self', baseSips: 2, hiddenSips: 0, targetType: 'everyone' },
  { id: 'eg-4', category: 'endgame', visibleText: 'Everyone drinks together', hiddenClause: 'Toast required', baseSips: 1, hiddenSips: 0, targetType: 'everyone' },
  { id: 'eg-5', category: 'endgame', visibleText: 'One last buyout', hiddenClause: 'Costs double', baseSips: 2, hiddenSips: 0, targetType: 'signer' },
  { id: 'eg-6', category: 'endgame', visibleText: 'Reveal all hidden clauses', hiddenClause: 'Apply one', baseSips: 0, hiddenSips: 2, targetType: 'everyone' },
  { id: 'eg-7', category: 'endgame', visibleText: 'Chaos audit', hiddenClause: 'Random contract doubles', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'eg-8', category: 'endgame', visibleText: 'Market crash', hiddenClause: 'All growth settles', baseSips: 0, hiddenSips: 0, targetType: 'everyone' },
  { id: 'eg-9', category: 'endgame', visibleText: 'Sudden silence', hiddenClause: 'First sound drinks', baseSips: 2, hiddenSips: 0, targetType: 'trigger' },
  { id: 'eg-10', category: 'endgame', visibleText: 'Final contract', hiddenClause: 'Group decides', baseSips: 2, hiddenSips: 0, targetType: 'everyone' },
];

// Export all contracts
export const CONTRACT_LIBRARY: ContractTemplate[] = [
  ...behaviorTraps,
  ...predictions,
  ...duels,
  ...social,
  ...market,
  ...wildcards,
  ...endgame,
];

// Helper to get contracts by category
export function getContractsByCategory(category: ContractCategory): ContractTemplate[] {
  return CONTRACT_LIBRARY.filter(c => c.category === category);
}

// Helper to get random contracts
export function getRandomContracts(count: number, excludeIds: string[] = []): ContractTemplate[] {
  const available = CONTRACT_LIBRARY.filter(c => !excludeIds.includes(c.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper to get random contracts with category distribution
export function getBalancedContracts(count: number, excludeIds: string[] = []): ContractTemplate[] {
  const categories: ContractCategory[] = ['behavior-trap', 'prediction', 'duel', 'social', 'market', 'wild-card'];
  const result: ContractTemplate[] = [];

  // Try to get at least one from different categories
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const available = CONTRACT_LIBRARY.filter(
      c => c.category === category && !excludeIds.includes(c.id) && !result.find(r => r.id === c.id)
    );
    if (available.length > 0) {
      result.push(available[Math.floor(Math.random() * available.length)]);
    }
  }

  // Fill remaining with random
  while (result.length < count) {
    const available = CONTRACT_LIBRARY.filter(
      c => !excludeIds.includes(c.id) && !result.find(r => r.id === c.id)
    );
    if (available.length === 0) break;
    result.push(available[Math.floor(Math.random() * available.length)]);
  }

  return result;
}
