import type { Challenge, Player } from '../../types/game';
import { pickRandom, generateId } from './index';

interface PhysicalChallenge {
  title: string;
  instruction: string;
}

const challenges: PhysicalChallenge[] = [
  {
    title: 'BALANCE TEST',
    instruction: 'Stand on one foot for 10 seconds without wobbling',
  },
  {
    title: 'TONGUE TWISTER',
    instruction: 'Say "red lorry yellow lorry" five times fast',
  },
  {
    title: 'COORDINATION CHECK',
    instruction: 'Pat your head and rub your belly at the same time for 10 seconds',
  },
  {
    title: 'MEMORY WALK',
    instruction: 'Walk in a straight line heel-to-toe for 5 steps',
  },
  {
    title: 'FINGER NOSE',
    instruction: 'Close your eyes and touch your nose with your index finger',
  },
  {
    title: 'ALPHABET BACKWARDS',
    instruction: 'Recite the alphabet backwards from J to A',
  },
  {
    title: 'SPIN TEST',
    instruction: 'Spin around 3 times and then touch your toes',
  },
  {
    title: 'WALL SIT',
    instruction: 'Do a wall sit for 15 seconds',
  },
  {
    title: 'CLAP PUSH-UP',
    instruction: 'Do one push-up (or attempt one)',
  },
  {
    title: 'FLAMINGO STAND',
    instruction: 'Stand on one leg with eyes closed for 5 seconds',
  },
  {
    title: 'SPEED CLAP',
    instruction: 'Clap your hands 20 times in 5 seconds',
  },
  {
    title: 'SQUAT HOLD',
    instruction: 'Hold a squat position for 10 seconds',
  },
];

export const physicalEducationChallenges = {
  generate(players: Player[]): Challenge {
    const target = pickRandom(players);
    const challenge = pickRandom(challenges);
    const others = players.filter((p) => p.id !== target.id);

    return {
      id: generateId(),
      classType: 'physical-education',
      title: challenge.title,
      description: `${target.name}: ${challenge.instruction}`,
      targetPlayerIds: [target.id],
      votingPlayerIds: others.map((p) => p.id),
      timeLimit: 20,
    };
  },
};
