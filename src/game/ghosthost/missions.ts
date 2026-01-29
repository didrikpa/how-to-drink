import type { Mission } from '../../types/ghosthost';

// Physical Action missions (1-30)
const physicalMissions: Omit<Mission, 'id'>[] = [
  { category: 'physical', text: 'Get someone to check the time on their phone' },
  { category: 'physical', text: 'Get someone to stand up from their seat' },
  { category: 'physical', text: 'Get someone to take a drink without being prompted' },
  { category: 'physical', text: 'Get someone to touch their face' },
  { category: 'physical', text: 'Get someone to cross their arms' },
  { category: 'physical', text: 'Get someone to lean back in their chair' },
  { category: 'physical', text: 'Get someone to pick up an object off the table' },
  { category: 'physical', text: 'Get someone to stretch' },
  { category: 'physical', text: 'Get someone to go to another room' },
  { category: 'physical', text: 'Get someone to look behind them' },
  { category: 'physical', text: 'Get someone to put their phone down' },
  { category: 'physical', text: 'Get someone to refill a drink' },
  { category: 'physical', text: 'Get someone to sit in a different spot' },
  { category: 'physical', text: 'Get someone to clap their hands' },
  { category: 'physical', text: 'Get someone to adjust their clothing' },
  { category: 'physical', text: 'Get someone to touch their hair' },
  { category: 'physical', text: 'Get someone to scratch an itch' },
  { category: 'physical', text: 'Get someone to point at something' },
  { category: 'physical', text: 'Get someone to shake hands with you' },
  { category: 'physical', text: 'Get someone to high five you' },
  { category: 'physical', text: 'Get someone to fist bump you' },
  { category: 'physical', text: 'Get someone to move closer to you' },
  { category: 'physical', text: 'Get someone to move away from you' },
  { category: 'physical', text: 'Get someone to change the music' },
  { category: 'physical', text: 'Get someone to open a door' },
  { category: 'physical', text: 'Get someone to close a window or door' },
  { category: 'physical', text: 'Get someone to grab some food' },
  { category: 'physical', text: 'Get someone to use the bathroom' },
  { category: 'physical', text: 'Get someone to yawn' },
  { category: 'physical', text: 'Get someone to cough' },
];

// Conversation Trap missions (31-70)
const conversationMissions: Omit<Mission, 'id'>[] = [
  { category: 'conversation', text: 'Get someone to mention their ex' },
  { category: 'conversation', text: 'Get someone to talk about their job' },
  { category: 'conversation', text: 'Get someone to say a specific number' },
  { category: 'conversation', text: 'Get someone to mention the weather' },
  { category: 'conversation', text: 'Get someone to talk about food' },
  { category: 'conversation', text: 'Get someone to mention a celebrity' },
  { category: 'conversation', text: 'Get someone to talk about their family' },
  { category: 'conversation', text: 'Get someone to bring up a movie' },
  { category: 'conversation', text: 'Get someone to mention social media' },
  { category: 'conversation', text: 'Get someone to say your name' },
  { category: 'conversation', text: 'Get someone to swear' },
  { category: 'conversation', text: 'Get someone to say "I think..."' },
  { category: 'conversation', text: 'Get someone to agree with you' },
  { category: 'conversation', text: 'Get someone to disagree with you' },
  { category: 'conversation', text: 'Get someone to tell a story' },
  { category: 'conversation', text: 'Get someone to give you a compliment' },
  { category: 'conversation', text: 'Get someone to ask you a question' },
  { category: 'conversation', text: 'Get someone to finish your sentence' },
  { category: 'conversation', text: 'Get someone to repeat something you said' },
  { category: 'conversation', text: 'Get someone to change the topic' },
  { category: 'conversation', text: 'Get someone to talk about music' },
  { category: 'conversation', text: 'Get someone to mention money' },
  { category: 'conversation', text: 'Get someone to talk about vacation or travel' },
  { category: 'conversation', text: 'Get someone to mention a specific place' },
  { category: 'conversation', text: 'Get someone to talk about sports' },
  { category: 'conversation', text: 'Get someone to mention a TV show' },
  { category: 'conversation', text: 'Get someone to talk about their weekend' },
  { category: 'conversation', text: 'Get someone to mention their phone' },
  { category: 'conversation', text: 'Get someone to bring up college' },
  { category: 'conversation', text: 'Get someone to mention their childhood' },
  { category: 'conversation', text: 'Get someone to talk about pets' },
  { category: 'conversation', text: 'Get someone to mention a restaurant' },
  { category: 'conversation', text: 'Get someone to talk about dating' },
  { category: 'conversation', text: 'Get someone to mention alcohol' },
  { category: 'conversation', text: 'Get someone to bring up a current event' },
  { category: 'conversation', text: 'Get someone to mention a friend not present' },
  { category: 'conversation', text: 'Get someone to talk about cars' },
  { category: 'conversation', text: 'Get someone to mention working out' },
  { category: 'conversation', text: 'Get someone to bring up technology' },
  { category: 'conversation', text: 'Get someone to mention video games' },
];

// Action & Reaction missions (71-100)
const reactionMissions: Omit<Mission, 'id'>[] = [
  { category: 'reaction', text: 'Get someone to laugh at a joke that was not actually funny' },
  { category: 'reaction', text: 'Get someone to gasp in surprise' },
  { category: 'reaction', text: 'Get someone to roll their eyes' },
  { category: 'reaction', text: 'Get someone to make a confused face' },
  { category: 'reaction', text: 'Get someone to say "what?"' },
  { category: 'reaction', text: 'Get someone to say "wait, really?"' },
  { category: 'reaction', text: 'Get someone to say "that is crazy"' },
  { category: 'reaction', text: 'Get someone to shrug' },
  { category: 'reaction', text: 'Get someone to shake their head' },
  { category: 'reaction', text: 'Get someone to nod in agreement' },
  { category: 'reaction', text: 'Get someone to look surprised' },
  { category: 'reaction', text: 'Get someone to look concerned' },
  { category: 'reaction', text: 'Get someone to look impressed' },
  { category: 'reaction', text: 'Get someone to look skeptical' },
  { category: 'reaction', text: 'Get someone to look disappointed' },
  { category: 'reaction', text: 'Get someone to look excited' },
  { category: 'reaction', text: 'Get someone to look bored' },
  { category: 'reaction', text: 'Get someone to sigh' },
  { category: 'reaction', text: 'Get someone to groan' },
  { category: 'reaction', text: 'Get someone to say "oh no"' },
  { category: 'reaction', text: 'Get someone to say "same"' },
  { category: 'reaction', text: 'Get someone to say "honestly"' },
  { category: 'reaction', text: 'Get someone to say "literally"' },
  { category: 'reaction', text: 'Get someone to say "for real"' },
  { category: 'reaction', text: 'Get someone to say "no way"' },
  { category: 'reaction', text: 'Get someone to say "I know, right?"' },
  { category: 'reaction', text: 'Get someone to mimic your gesture' },
  { category: 'reaction', text: 'Get someone to mirror your posture' },
  { category: 'reaction', text: 'Get someone to react to a fake story' },
  { category: 'reaction', text: 'Get someone to defend you in conversation' },
];

// Combine all missions with IDs
const allMissions: Mission[] = [
  ...physicalMissions.map((m, i) => ({ ...m, id: `phys-${i + 1}` })),
  ...conversationMissions.map((m, i) => ({ ...m, id: `conv-${i + 1}` })),
  ...reactionMissions.map((m, i) => ({ ...m, id: `react-${i + 1}` })),
];

/**
 * Get a random mission that hasn't been used yet
 * @param excludeIds - IDs of missions to exclude (already completed)
 * @returns A random mission, or cycles back if all exhausted
 */
export function getRandomMission(excludeIds: string[] = []): Mission {
  const available = allMissions.filter(m => !excludeIds.includes(m.id));

  // If all missions used, reset and pick from full list
  const pool = available.length > 0 ? available : allMissions;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Get all missions (for testing/display purposes)
 */
export function getAllMissions(): Mission[] {
  return allMissions;
}
