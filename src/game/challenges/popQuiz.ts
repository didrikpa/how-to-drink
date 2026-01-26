import type { Challenge, Player } from '../../types/game';
import { pickRandom, generateId } from './index';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
}

const questions: QuizQuestion[] = [
  {
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correct: 'Canberra',
  },
  {
    question: 'How many planets are in our solar system?',
    options: ['7', '8', '9', '10'],
    correct: '8',
  },
  {
    question: 'What year did the Titanic sink?',
    options: ['1905', '1912', '1920', '1898'],
    correct: '1912',
  },
  {
    question: 'Which element has the chemical symbol Fe?',
    options: ['Fluorine', 'Iron', 'Francium', 'Fermium'],
    correct: 'Iron',
  },
  {
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
    correct: 'Pacific',
  },
  {
    question: 'How many bones are in the adult human body?',
    options: ['186', '206', '226', '246'],
    correct: '206',
  },
  {
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correct: 'Vatican City',
  },
  {
    question: 'Which planet has the most moons?',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    correct: 'Saturn',
  },
  {
    question: 'What is the speed of light in km/s (approximately)?',
    options: ['100,000', '200,000', '300,000', '400,000'],
    correct: '300,000',
  },
  {
    question: 'In what year was the first iPhone released?',
    options: ['2005', '2006', '2007', '2008'],
    correct: '2007',
  },
  {
    question: 'What is the longest river in the world?',
    options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
    correct: 'Nile',
  },
  {
    question: 'How many keys are on a standard piano?',
    options: ['76', '82', '88', '92'],
    correct: '88',
  },
  {
    question: 'What is the chemical formula for water?',
    options: ['H2O', 'CO2', 'NaCl', 'O2'],
    correct: 'H2O',
  },
  {
    question: 'Which country invented pizza?',
    options: ['Greece', 'Italy', 'Spain', 'France'],
    correct: 'Italy',
  },
  {
    question: 'What is the largest mammal on Earth?',
    options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    correct: 'Blue Whale',
  },
];

export const popQuizChallenges = {
  generate(players: Player[]): Challenge {
    const target = pickRandom(players);
    const question = pickRandom(questions);

    return {
      id: generateId(),
      classType: 'pop-quiz',
      title: 'POP QUIZ',
      description: question.question,
      targetPlayerIds: [target.id],
      votingPlayerIds: [],
      timeLimit: 15,
      options: question.options,
      correctAnswer: question.correct,
    };
  },
};
