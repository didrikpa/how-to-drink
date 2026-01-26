import type { Challenge, Player } from '../../types/game';
import { pickRandom, generateId } from './index';

const votingPrompts: string[] = [
  'Who is most likely to survive a zombie apocalypse?',
  'Who would be the worst at keeping a secret?',
  'Who is most likely to become famous?',
  'Who would be the first to cry during a sad movie?',
  'Who is most likely to get lost in their own city?',
  'Who would win in an arm wrestling match?',
  'Who is most likely to show up late to their own wedding?',
  'Who would be the worst driver?',
  'Who is most likely to accidentally send a text to the wrong person?',
  'Who would survive the longest on a deserted island?',
  'Who is most likely to laugh at an inappropriate moment?',
  'Who would be the worst at lying?',
  'Who is most likely to binge an entire TV series in one day?',
  'Who would be the first to run out of money on a trip?',
  'Who is most likely to forget someones name immediately after meeting them?',
  'Who would be the best cook?',
  'Who is most likely to trip over nothing?',
  'Who would win a dance battle?',
  'Who is most likely to sleep through an alarm?',
  'Who would be the first to panic in an emergency?',
  'Who is most likely to get into an argument with a stranger?',
  'Who would make the best parent?',
  'Who is most likely to get a ridiculous tattoo?',
  'Who would be the worst at karaoke?',
  'Who is most likely to go viral on social media?',
];

export const socialStudiesChallenges = {
  generate(players: Player[]): Challenge {
    const prompt = pickRandom(votingPrompts);

    return {
      id: generateId(),
      classType: 'social-studies',
      title: 'SOCIAL STUDIES',
      description: prompt,
      targetPlayerIds: [],
      votingPlayerIds: players.map((p) => p.id),
      timeLimit: 20,
      options: players.map((p) => p.name),
    };
  },
};
