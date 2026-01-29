// Global cover rules that apply to everyone during the game

const globalRules: string[] = [
  'Drink if you use your phone',
  'Drink if you say the word "ghost"',
  'Drink if you point at someone',
  'Drink if you leave the room',
  'Drink if you spill anything',
];

/**
 * Get a random selection of global rules
 * @param count - Number of rules to select (default 3)
 * @returns Array of randomly selected rules
 */
export function getRandomRules(count: number = 3): string[] {
  const shuffled = [...globalRules].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, globalRules.length));
}

/**
 * Get all available global rules
 */
export function getAllRules(): string[] {
  return globalRules;
}
