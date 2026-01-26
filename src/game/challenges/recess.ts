import type { Challenge, Player } from '../../types/game';
import { pickRandom, pickRandomN, generateId } from './index';

interface RecessGame {
  title: string;
  description: string;
  playerCount: number;
}

const games: RecessGame[] = [
  {
    title: 'ROCK PAPER SCISSORS',
    description: 'face off in Rock Paper Scissors! Best of one - loser drinks.',
    playerCount: 2,
  },
  {
    title: 'STARING CONTEST',
    description: 'have a staring contest! First to blink or laugh drinks.',
    playerCount: 2,
  },
  {
    title: 'THUMB WAR',
    description: 'battle in a thumb war! Loser drinks.',
    playerCount: 2,
  },
  {
    title: 'CATEGORIES',
    description: 'Name things that are RED. Go around the circle - first to fail drinks!',
    playerCount: 0,
  },
  {
    title: 'WORD ASSOCIATION',
    description: 'Word association starting with DRINK. Hesitate or repeat = drink!',
    playerCount: 0,
  },
  {
    title: 'RHYME TIME',
    description: 'Rhyme with the word BEER. First to fail drinks!',
    playerCount: 0,
  },
  {
    title: 'COUNTING GAME',
    description: 'Count to 20 as a group. If two people say a number at the same time, everyone drinks and restart!',
    playerCount: 0,
  },
  {
    title: 'NEVER HAVE I EVER',
    description: 'Everyone put up 3 fingers. Someone says "never have I ever..." - put a finger down if you have. First to lose all fingers drinks!',
    playerCount: 0,
  },
  {
    title: 'MOST LIKELY TO',
    description: 'On 3, everyone points at who they think is most likely to embarrass themselves at a party. Person with most fingers pointed drinks!',
    playerCount: 0,
  },
  {
    title: 'DRINK IF',
    description: 'Drink if you have ever sent a text to the wrong person!',
    playerCount: 0,
  },
];

export const recessChallenges = {
  generate(players: Player[]): Challenge {
    const game = pickRandom(games);
    let targetIds: string[] = [];
    let description = game.description;

    if (game.playerCount === 2 && players.length >= 2) {
      const selected = pickRandomN(players, 2);
      targetIds = selected.map((p) => p.id);
      description = `${selected[0].name} and ${selected[1].name} ${game.description}`;
    } else {
      targetIds = players.map((p) => p.id);
    }

    return {
      id: generateId(),
      classType: 'recess',
      title: game.title,
      description: description,
      targetPlayerIds: targetIds,
      votingPlayerIds: [],
      timeLimit: 30,
    };
  },
};
