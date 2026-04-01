import { LEVELS } from '../data/levels.js';

export const STARTING_LIVES = 3;

let currentRun = createDefaultRun();

function createDefaultRun() {
  return {
    score: 0,
    totalDefeats: 0,
    totalTimeMs: 0,
    lives: STARTING_LIVES,
    levelResults: [],
    currentLevelIndex: 0,
  };
}

export function startNewRun() {
  currentRun = createDefaultRun();
  return currentRun;
}

export function getRunState() {
  return currentRun;
}

export function beginLevel(levelIndex) {
  currentRun.currentLevelIndex = Math.max(0, Math.min(levelIndex, LEVELS.length - 1));
  return currentRun;
}

export function addScore(points) {
  currentRun.score += points;
  return currentRun.score;
}

export function addDefeat() {
  currentRun.totalDefeats += 1;
  return currentRun.totalDefeats;
}

export function loseLife() {
  currentRun.lives = Math.max(0, currentRun.lives - 1);
  return currentRun.lives;
}

export function completeLevel(result) {
  currentRun.totalTimeMs += result.timeMs;
  currentRun.levelResults[result.levelIndex] = result;
  return currentRun;
}

export function getCompletedLevelCount() {
  return currentRun.levelResults.filter(Boolean).length;
}
