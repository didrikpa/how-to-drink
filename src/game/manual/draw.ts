import type { ManualRule, ManualDifficulty } from '../../types/manual';

export function substitutePlaceholders(text: string, unit: 'sip' | 'shot'): string {
  const plural = unit === 'sip' ? 'sips' : 'shots';
  return text.replace(/\{UNIT_PLURAL\}/g, plural).replace(/\{UNIT\}/g, unit);
}

function pickWeighted(rules: ManualRule[], weightKey: ManualDifficulty): ManualRule {
  const totalWeight = rules.reduce((sum, r) => sum + r.modeWeights[weightKey], 0);
  let random = Math.random() * totalWeight;

  for (const rule of rules) {
    random -= rule.modeWeights[weightKey];
    if (random <= 0) {
      return rule;
    }
  }

  return rules[rules.length - 1];
}

export function weightedDraw(
  rules: ManualRule[],
  difficulty: ManualDifficulty,
  noRepeatQueue: number[],
  maxAttempts: number = 20,
): ManualRule {
  const eligible = rules.filter(r => r.modeWeights[difficulty] > 0);

  if (eligible.length === 0) {
    return rules[Math.floor(Math.random() * rules.length)];
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const selected = pickWeighted(eligible, difficulty);
    if (!noRepeatQueue.includes(selected.id)) {
      return selected;
    }
  }

  // Fallback: pick from eligible not in queue
  const available = eligible.filter(r => !noRepeatQueue.includes(r.id));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return eligible[Math.floor(Math.random() * eligible.length)];
}
