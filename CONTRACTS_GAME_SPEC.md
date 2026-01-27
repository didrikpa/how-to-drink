# Contracts Game Mode - Implementation Spec

## Status: NOT STARTED

The first game mode "Drinking School" is complete and working. This document describes the second game mode "Contracts" that needs to be implemented.

---

## Overview

A contract-based drinking game where players sign deals with hidden clauses, use strategy tokens, and build up a shared Tab that triggers milestones.

---

## Core Loop (3 Phases Per Round)

### Phase 1: Offer Phase (Deal-making)
- Game generates 2-4 contract offers
- Each contract is an "if/then" deal with visible text + one hidden clause
- Players can tap "Sign" to accept (max 1 contract per player per round)
- Players can witness unlimited contracts

### Phase 2: Action Phase (Chaos)
- Round Timer runs (60-120 seconds)
- Random events fire:
  - **Audit**: Reveal hidden clause from random contract
  - **Fine Print**: Add twist to a contract ("...but only if said while standing")
  - **Market Shift**: Double payout on oldest unsigned contract
  - **Whistleblower**: Someone can expose a contract and force re-vote

### Phase 3: Settlement Phase (Pay the Tab)
- Only 1-3 contracts randomly chosen to "mature" each round
- Others roll over and become more valuable/dangerous
- Before drinking: anyone can propose **Buyout** (drink 1 to erase contract, group votes)
- Hidden clauses revealed at settlement
- Drinks applied, Tab updated

---

## Key Mechanics

### A) Hidden Clauses
- Every contract has visible text + one hidden clause
- Hidden clauses are mild (max +2 sips in Hard Mode, +1 in Chill)
- Examples:
  - "Settlement doubles if anyone laughed while it happened"
  - "If you complain about the rule, take +1 sip"

### B) Player Tokens
Each player starts with:
- **2 Lawyer Tokens**: Cancel or rewrite one contract clause
- **1 Hedge Token**: Reduce your own penalty by 1
- **1 Sabotage Token**: Flip "who pays" on a contract at settlement (once per game)

### C) Buyouts
- At settlement, anyone can propose: "I'll drink X to erase this contract"
- Group votes (majority wins)
- If yes, contract is gone

### D) Shared Tab
- Most contracts pay into shared Tab (number that rises)
- Tab triggers Milestones at thresholds:
  - **Tab 10**: "Toast Round" (everyone sips)
  - **Tab 15**: "Silent Minute" (first to speak drinks 2)
  - **Tab 20**: "The Merger" (two players become team for 2 rounds)
  - **Tab 25**: "Hostile Takeover" (lowest Tab contributor assigns 2 sips)

---

## Game Modes

### Chill Mode (Default)
- Max 2 sips per person per settlement
- Hidden clauses: max +1 sip
- No forced shots
- No personal/humiliating dares
- Buyouts cost 1 sip
- Market contracts grow max +2 sips total
- Tab milestones every 10

### Unhinged Mode
- Max 4 sips per person per settlement
- Hidden clauses: up to +2 sips
- Optional shots enabled
- Buyouts cost 2 sips
- Market contracts have no growth cap
- Tab milestones every 7
- Some contracts include public attention/pressure

---

## Default Settings (First Game Preset)
- 10 rounds
- 90s round timer
- Mature 2 contracts per round
- Tokens: Lawyer x2, Hedge x1, Sabotage x1
- Max 3 sips per settlement

---

## Contract Categories

### A) Behavior Traps (30 contracts) - Timer-based triggers
### B) Prediction Contracts (25) - Betting on events
### C) Duels & Mini-Games (25) - Head-to-head challenges
### D) Social & Persuasion (30) - Get others to do things
### E) Market & Tab Contracts (20) - Economy manipulation
### F) Wild Cards (20) - Chaos and rule-breaking
### G) Endgame (10) - Final round specials

---

## Win Condition (Optional)
Game ends when:
- Tab reaches 30, OR
- Set number of rounds completed (e.g., 12)

Awards:
- **Top Investor**: Paid least into Tab
- **Bailout King**: Bought out most contracts
- **Chaos Auditor**: Revealed most hidden clauses

Winners get reward (assign 2 sips, choose music, etc.)

---

## Safety Features (Must implement)
- "Pause / Water Round" button - anyone can hit anytime
- "Nope" button on any prompt - gets replaced, no questions
- Mode selector: Sips / Drinks / Non-alcoholic

---

## Contract Library (150 Total)

### CATEGORY A: BEHAVIOR TRAPS (30)

1. If anyone swears -> they drink 1
   Hidden: doubles if it's accidental

2. If anyone laughs out loud -> 1 sip
   Hidden: first laugh counts double

3. If anyone checks their phone -> 2 sips
   Hidden: scrolling adds +1

4. If anyone stands up -> 1 sip
   Hidden: unless they announce it first

5. If anyone says "bro" -> 1 sip
   Hidden: plural counts twice

6. If anyone interrupts someone -> 1 sip
   Hidden: interruption during rules = +1

7. If anyone sings -> 2 sips
   Hidden: humming counts

8. If anyone claps -> 1 sip
   Hidden: slow clap = +1

9. If anyone spills a drink -> 2 sips
   Hidden: intentional spill counts

10. If anyone yawns -> 1 sip
    Hidden: fake yawn = +1

11. If anyone says a player's name -> 1 sip
    Hidden: nickname counts

12. If anyone says "what?" -> 1 sip
    Hidden: repetition stacks

13. If anyone looks at the timer -> 1 sip
    Hidden: asking time = +1

14. If anyone sighs loudly -> 1 sip
    Hidden: eye roll adds +1

15. If anyone drops something -> 1 sip
    Hidden: phones double it

16. If anyone whistles -> 2 sips
    Hidden: accidental mouth noises count

17. If anyone clears their throat -> 1 sip
    Hidden: exaggerated = +1

18. If anyone says "okay" -> 1 sip
    Hidden: drawn-out "okayyy" doubles

19. If anyone says "actually" -> 1 sip
    Hidden: correcting someone adds +1

20. If anyone says "wait" -> 1 sip
    Hidden: panic tone = +1

21. If anyone touches their face -> 1 sip
    Hidden: rubbing eyes doubles

22. If anyone stretches -> 1 sip
    Hidden: standing stretch = +1

23. If anyone knocks on a surface -> 1 sip
    Hidden: rhythm knocks count twice

24. If anyone says "cheers" -> 1 sip
    Hidden: clinking glasses adds +1

25. If anyone asks a question -> 1 sip
    Hidden: rhetorical still counts

26. If anyone points at someone -> 1 sip
    Hidden: finger guns double it

27. If anyone whispers -> 2 sips
    Hidden: stage whisper = +1

28. If anyone mouths a word -> 1 sip
    Hidden: mouthing "sorry" doubles

29. If anyone reacts dramatically -> 2 sips
    Hidden: fake drama still counts

30. If anyone says "no way" -> 1 sip
    Hidden: disbelief tone doubles

### CATEGORY B: PREDICTION CONTRACTS (25)

1. I bet someone drinks before timer ends
   Hidden: signer drinks if wrong

2. I bet no one speaks for 10 seconds
   Hidden: laughter breaks silence

3. I bet someone checks their phone
   Hidden: signer must name who

4. I bet someone spills a drink
   Hidden: signer drinks if no spill

5. I bet someone swears
   Hidden: first swearer drinks +1

6. I bet someone laughs
   Hidden: quiet laugh still counts

7. I bet someone stands up
   Hidden: leaning half-stand counts

8. I bet someone complains
   Hidden: sighing counts

9. I bet someone asks a question
   Hidden: rhetorical counts

10. I bet someone interrupts
    Hidden: overtalk counts

11. I bet two people talk at once
    Hidden: overlap >1 sec only

12. I bet someone drops something
    Hidden: intentional drop counts

13. I bet someone says my name
    Hidden: nickname counts

14. I bet someone drinks early
    Hidden: sip = drink

15. I bet someone checks the rules
    Hidden: asking counts

16. I bet someone laughs at this contract
    Hidden: smirk counts

17. I bet someone says "wait"
    Hidden: panic tone counts

18. I bet someone reacts dramatically
    Hidden: sarcasm counts

19. I bet someone yawns
    Hidden: fake yawn counts

20. I bet someone says "okay"
    Hidden: drawn out doubles

21. I bet someone points
    Hidden: pointing with object counts

22. I bet someone whispers
    Hidden: stage whisper counts

23. I bet someone spills intentionally
    Hidden: intentional is allowed

24. I bet someone sighs loudly
    Hidden: exaggerated counts

25. I bet someone laughs twice
    Hidden: same person counts

### CATEGORY C: DUELS & MINI-GAMES (25)

1. Rock-paper-scissors, loser drinks 2
   Hidden: tie adds +1 round

2. Staring contest, loser drinks 1
   Hidden: blinking fast counts

3. Thumb war, loser drinks 2
   Hidden: dominant thumb penalty

4. Coin flip duel, loser drinks 1
   Hidden: best of 3

5. First to say "what?" drinks 1
   Hidden: reaction time matters

6. First to laugh drinks 1
   Hidden: smirk counts

7. Last to raise hand drinks 1
   Hidden: hesitation counts

8. First to look away drinks 1
   Hidden: blinking counts

9. First to drink loses
   Hidden: sip = drink

10. First to stand loses
    Hidden: half-stand counts

11. First to swear loses
    Hidden: accidental counts

12. First to speak loses
    Hidden: noise counts

13. First to check phone loses
    Hidden: screen lighting counts

14. Simon says (3 commands)
    Hidden: hesitation counts

15. Rapid fire RPS (3 rounds)
    Hidden: misthrow counts

16. Nose goes, loser drinks 1
    Hidden: late nose = +1

17. Coin balance challenge
    Hidden: retry adds +1

18. Silent count to 5
    Hidden: laughter breaks it

19. First to blink twice loses
    Hidden: rapid blink counts

20. Hand on head last loses
    Hidden: fake reach counts

21-25. (Reserved for expansion)

### CATEGORY D: SOCIAL & PERSUASION (30)

1. Convince someone to agree with you
   Hidden: sarcasm invalid

2. Get someone to compliment you
   Hidden: forced compliments don't count

3. Make someone laugh
   Hidden: laughing at yourself counts

4. Get someone to drink
   Hidden: sip = drink

5. Get someone to stand up
   Hidden: leaning doesn't count

6. Get someone to say your name
   Hidden: nickname allowed

7. Get someone to swear
   Hidden: baiting allowed

8. Get someone to point at you
   Hidden: object pointing counts

9. Get someone to whisper
   Hidden: stage whisper allowed

10. Get someone to sigh
    Hidden: exaggerated counts

11. Get someone to interrupt
    Hidden: overtalk counts

12. Get someone to laugh twice
    Hidden: same person counts

13. Get someone to clap
    Hidden: slow clap counts

14. Get someone to yawn
    Hidden: fake counts

15. Get someone to drink water
    Hidden: still counts

16. Get someone to say "okay"
    Hidden: drawn out doubles

17. Get someone to react dramatically
    Hidden: sarcasm counts

18. Get someone to check phone
    Hidden: lock screen counts

19. Get someone to complain
    Hidden: sigh counts

20. Get someone to spill a drop
    Hidden: intentional allowed

21-30. (Reserved for expansion)

### CATEGORY E: MARKET & TAB CONTRACTS (20)

1. This contract grows +1 sip each round
   Hidden: doubles after 3 rounds

2. Buyout costs +1 sip
   Hidden: stacks per attempt

3. Add +2 to the Tab
   Hidden: doubles if last contract

4. Oldest contract matures next
   Hidden: youngest gains +1

5. Delay settlement one round
   Hidden: growth continues

6. Swap two contracts
   Hidden: signer drinks 1

7. Double next settlement
   Hidden: applies to signer too

8. Cancel newest contract
   Hidden: oldest gains +1

9. Freeze Tab for one round
   Hidden: next round +2

10. Force Audit next round
    Hidden: random clause revealed now

11-20. (Reserved for expansion)

### CATEGORY F: WILD CARDS (20)

1. Everyone drinks 1
   Hidden: except signer

2. No one drinks
   Hidden: signer drinks 1

3. Assign 2 sips
   Hidden: cannot self-assign

4. Reverse who pays
   Hidden: signer immune

5. Double penalties this round
   Hidden: signer included

6. Cancel a clause
   Hidden: random instead

7. Reveal two hidden clauses
   Hidden: one is yours

8. Add a house rule
   Hidden: expires next round

9. Steal a token
   Hidden: from random player

10. Refresh contract pool
    Hidden: signer drinks 1

11. Force re-vote
    Hidden: tie = signer drinks

12. Pause timer
    Hidden: timer resumes doubled

13. Swap two players' penalties
    Hidden: signer included

14. Nullify a buyout
    Hidden: costs 1 sip

15. Add a surprise settlement
    Hidden: signer included

16. Double Tab milestone
    Hidden: immediate effect

17. Skip next round
    Hidden: everyone drinks 1

18. Force silent round
    Hidden: laughter breaks it

19. Trigger mini-game
    Hidden: signer participates

20. End the game early
    Hidden: final toast

### CATEGORY G: ENDGAME (10)

1. Final duel
   Hidden: loser drinks +1

2. Highest Tab contributor drinks
   Hidden: second highest too

3. Lowest Tab contributor assigns
   Hidden: must include self

4. Everyone drinks together
   Hidden: toast required

5. One last buyout
   Hidden: costs double

6. Reveal all hidden clauses
   Hidden: apply one

7. Chaos audit
   Hidden: random contract doubles

8. Market crash
   Hidden: all growth settles

9. Sudden silence
   Hidden: first sound drinks

10. Final contract
    Hidden: group decides

---

## Implementation Plan

### Phase 1: Types & State
- [ ] Create ContractsGameState type
- [ ] Create Contract type with visible/hidden clauses
- [ ] Create PlayerTokens type
- [ ] Create Tab and Milestone types
- [ ] Add game mode selector to main app

### Phase 2: Contract System
- [ ] Create contract templates from library above
- [ ] Contract generator (picks random contracts, assigns hidden clauses)
- [ ] Contract signing logic
- [ ] Contract maturation/settlement logic

### Phase 3: Token System
- [ ] Lawyer token (cancel/rewrite clause)
- [ ] Hedge token (reduce penalty)
- [ ] Sabotage token (flip who pays)

### Phase 4: Tab & Milestones
- [ ] Tab tracking
- [ ] Milestone triggers
- [ ] Milestone effects

### Phase 5: Action Phase Events
- [ ] Audit event
- [ ] Fine Print event
- [ ] Market Shift event
- [ ] Whistleblower event

### Phase 6: UI
- [ ] Host: Contract offer display
- [ ] Host: Active contracts view
- [ ] Host: Tab and milestones display
- [ ] Player: Sign contract button
- [ ] Player: Use token buttons
- [ ] Player: Buyout proposal

### Phase 7: Safety & Polish
- [ ] Pause/Water Round button
- [ ] Nope button for prompts
- [ ] Chill/Unhinged mode toggle
- [ ] Win condition and awards

---

## Current Codebase Structure

The existing "Drinking School" game uses:
- `src/server/GameServer.ts` - WebSocket server with game state
- `src/types/game.ts` - TypeScript types
- `src/game/challenges/` - Challenge generators
- `src/host/HostApp.tsx` - Host screen
- `src/player/PlayerApp.tsx` - Player phone screen
- `src/hooks/useGameSocket.ts` - WebSocket hook

For Contracts mode, we'll need:
- New types in `src/types/contracts.ts`
- New game logic in `src/game/contracts/`
- Game mode selector in App.tsx
- Separate or shared host/player components

---

## Notes for Next Session

1. Start by creating the types (`src/types/contracts.ts`)
2. Then create the contract library (`src/game/contracts/library.ts`)
3. Update GameServer to support multiple game modes
4. Build the UI incrementally, testing each phase

The existing WebSocket infrastructure can be reused - just need new message types and state handling for Contracts mode.
