import type { Challenge, ClassType, Player } from '../../types/game';
import { popQuizChallenges } from './popQuiz';
import { socialStudiesChallenges } from './socialStudies';
import { physicalEducationChallenges } from './physicalEducation';
import { dramaClassChallenges } from './dramaClass';
import { detentionChallenges } from './detention';
import { recessChallenges } from './recess';

export interface ChallengeGenerator {
  generate: (players: Player[], allPlayers: Player[]) => Challenge;
}

const generators: Record<ClassType, ChallengeGenerator> = {
  'pop-quiz': popQuizChallenges,
  'social-studies': socialStudiesChallenges,
  'physical-education': physicalEducationChallenges,
  'drama-class': dramaClassChallenges,
  'detention': detentionChallenges,
  'recess': recessChallenges,
};

export function generateChallenge(
  classType: ClassType,
  connectedPlayers: Player[],
  allPlayers: Player[]
): Challenge {
  const generator = generators[classType];
  return generator.generate(connectedPlayers, allPlayers);
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
