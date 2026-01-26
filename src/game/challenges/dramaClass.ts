import type { Challenge, Player } from '../../types/game';
import { pickRandom, generateId } from './index';

interface DramaPrompt {
  title: string;
  instruction: string;
}

const prompts: DramaPrompt[] = [
  {
    title: 'IMPRESSION TIME',
    instruction: 'Do your best impression of a celebrity',
  },
  {
    title: 'ANIMAL SOUNDS',
    instruction: 'Make the sound of an animal until someone guesses it',
  },
  {
    title: 'EMOTION ACTING',
    instruction: 'Act extremely angry about something ridiculous',
  },
  {
    title: 'SILENT MOVIE',
    instruction: 'Act out "ordering food at a restaurant" without speaking',
  },
  {
    title: 'ACCENT CHALLENGE',
    instruction: 'Tell a short story in a foreign accent',
  },
  {
    title: 'SLOW MOTION',
    instruction: 'Act out catching a fly in slow motion',
  },
  {
    title: 'NEWS ANCHOR',
    instruction: 'Deliver breaking news about something absurd',
  },
  {
    title: 'OPERA SINGER',
    instruction: 'Sing what you had for breakfast in opera style',
  },
  {
    title: 'ROBOT MALFUNCTION',
    instruction: 'Act like a malfunctioning robot',
  },
  {
    title: 'INVISIBLE ROPE',
    instruction: 'Pretend you are being pulled by an invisible rope',
  },
  {
    title: 'CRYING BABY',
    instruction: 'Pretend to be a baby who just got their toy taken away',
  },
  {
    title: 'SPORTS COMMENTATOR',
    instruction: 'Commentate on someone in the room drinking their drink',
  },
];

export const dramaClassChallenges = {
  generate(players: Player[]): Challenge {
    const target = pickRandom(players);
    const prompt = pickRandom(prompts);
    const others = players.filter((p) => p.id !== target.id);

    return {
      id: generateId(),
      classType: 'drama-class',
      title: prompt.title,
      description: `${target.name}: ${prompt.instruction}`,
      targetPlayerIds: [target.id],
      votingPlayerIds: others.map((p) => p.id),
      timeLimit: 30,
    };
  },
};
