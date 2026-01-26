import type { Challenge, Player } from '../../types/game';
import { pickRandom, generateId } from './index';

interface DetentionEvent {
  title: string;
  description: string;
  targetMode: 'all' | 'one' | 'picker';
  drinkType: 'sips' | 'shot';
  drinkAmount: number;
}

const events: DetentionEvent[] = [
  {
    title: 'WATERFALL',
    description: 'Everyone drinks! The person to your left starts, when they stop you can stop.',
    targetMode: 'all',
    drinkType: 'sips',
    drinkAmount: 3,
  },
  {
    title: 'SOCIAL DRINK',
    description: 'Cheers! Everyone takes a drink together.',
    targetMode: 'all',
    drinkType: 'sips',
    drinkAmount: 2,
  },
  {
    title: 'SHOT ROULETTE',
    description: 'gets to take a shot! Bottoms up!',
    targetMode: 'one',
    drinkType: 'shot',
    drinkAmount: 1,
  },
  {
    title: 'GIVE DRINKS',
    description: 'gets to hand out 5 sips to anyone they choose!',
    targetMode: 'picker',
    drinkType: 'sips',
    drinkAmount: 0,
  },
  {
    title: 'CATEGORY FAIL',
    description: 'Last person to raise their hand drinks!',
    targetMode: 'one',
    drinkType: 'sips',
    drinkAmount: 3,
  },
  {
    title: 'DOUBLE TROUBLE',
    description: 'Two people drink! Pick someone to drink with you.',
    targetMode: 'one',
    drinkType: 'sips',
    drinkAmount: 2,
  },
  {
    title: 'OLDEST DRINKS',
    description: 'The oldest person in the room takes a drink!',
    targetMode: 'all',
    drinkType: 'sips',
    drinkAmount: 2,
  },
  {
    title: 'YOUNGEST DRINKS',
    description: 'The youngest person in the room takes a drink!',
    targetMode: 'all',
    drinkType: 'sips',
    drinkAmount: 2,
  },
  {
    title: 'FINISH YOUR DRINK',
    description: 'must finish their current drink!',
    targetMode: 'one',
    drinkType: 'sips',
    drinkAmount: 5,
  },
  {
    title: 'THUMB MASTER',
    description: 'is now Thumb Master! Put your thumb on the table anytime - last to notice drinks.',
    targetMode: 'one',
    drinkType: 'sips',
    drinkAmount: 0,
  },
];

export const detentionChallenges = {
  generate(players: Player[]): Challenge {
    const event = pickRandom(events);
    let targetIds: string[] = [];
    let description = event.description;

    if (event.targetMode === 'all') {
      targetIds = players.map((p) => p.id);
    } else if (event.targetMode === 'one' || event.targetMode === 'picker') {
      const target = pickRandom(players);
      targetIds = [target.id];
      description = `${target.name} ${event.description}`;
    }

    return {
      id: generateId(),
      classType: 'detention',
      title: event.title,
      description: description,
      targetPlayerIds: targetIds,
      votingPlayerIds: [],
      timeLimit: 10,
    };
  },
};
