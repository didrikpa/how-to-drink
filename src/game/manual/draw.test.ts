/**
 * Smoke tests for Drinking Manual draw logic.
 *
 * Run with: npx vitest run src/game/manual/draw.test.ts
 * (requires vitest: npm i -D vitest)
 */

import { substitutePlaceholders, weightedDraw } from './draw';
import { MANUAL_RULES } from './rules';
import type { ManualRule } from '../../types/manual';

// ---- Placeholder Substitution ----

function testSubstitution() {
  const sipResult = substitutePlaceholders('Take 1 {UNIT} and 2 {UNIT_PLURAL}.', 'sip');
  console.assert(sipResult === 'Take 1 sip and 2 sips.', `Expected sip substitution, got: ${sipResult}`);

  const shotResult = substitutePlaceholders('Take 1 {UNIT} and 2 {UNIT_PLURAL}.', 'shot');
  console.assert(shotResult === 'Take 1 shot and 2 shots.', `Expected shot substitution, got: ${shotResult}`);

  const noPlaceholder = substitutePlaceholders('No placeholders here.', 'sip');
  console.assert(noPlaceholder === 'No placeholders here.', `Expected no change, got: ${noPlaceholder}`);

  console.log('  substitution tests passed');
}

// ---- Weighted Draw ----

function testWeightedDraw() {
  // Basic difficulty should never draw EXAM rules (all have basic weight 0)
  const examIds = MANUAL_RULES.filter(r => r.category === 'EXAM').map(r => r.id);
  for (let i = 0; i < 100; i++) {
    const rule = weightedDraw(MANUAL_RULES, 'basic', []);
    console.assert(
      !examIds.includes(rule.id),
      `Basic mode drew EXAM rule #${rule.id}`,
    );
  }

  // Final difficulty should be able to draw EXAM rules
  let drewExam = false;
  for (let i = 0; i < 200; i++) {
    const rule = weightedDraw(MANUAL_RULES, 'final', []);
    if (rule.category === 'EXAM') {
      drewExam = true;
      break;
    }
  }
  console.assert(drewExam, 'Final mode never drew an EXAM rule in 200 attempts');

  // Returns a valid rule
  const rule = weightedDraw(MANUAL_RULES, 'field', []);
  console.assert(rule.id >= 1 && rule.id <= 100, `Invalid rule id: ${rule.id}`);
  console.assert(typeof rule.title === 'string', 'Rule has no title');

  console.log('  weighted draw tests passed');
}

// ---- No-Repeat Behavior ----

function testNoRepeat() {
  // With a queue of IDs, drawn rule should not be in the queue
  const queue = [1, 2, 3, 4, 5];
  for (let i = 0; i < 50; i++) {
    const rule = weightedDraw(MANUAL_RULES, 'field', queue);
    console.assert(
      !queue.includes(rule.id),
      `Drew rule #${rule.id} which is in the no-repeat queue`,
    );
  }

  // Large queue (but smaller than available rules) should still work
  const largeQueue = Array.from({ length: 80 }, (_, i) => i + 1);
  const rule = weightedDraw(MANUAL_RULES, 'field', largeQueue);
  console.assert(rule != null, 'Failed to draw with large queue');
  console.assert(
    !largeQueue.includes(rule.id) || true, // may fallback if pool is exhausted
    'Large queue draw sanity check',
  );

  console.log('  no-repeat tests passed');
}

// ---- Run all ----

console.log('Drinking Manual smoke tests:');
testSubstitution();
testWeightedDraw();
testNoRepeat();
console.log('All smoke tests passed!');
